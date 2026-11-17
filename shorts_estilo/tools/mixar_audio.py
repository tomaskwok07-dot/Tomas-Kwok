"""
Mixa narração + trilha + efeitos sonoros no padrão da bíblia e (opcional) junta com o vídeo.
Precisa do ffmpeg no PATH.

    python tools/mixar_audio.py --voz voz.wav --trilha trilha.mp3 \
        --sfx whoosh.wav@2.0 --sfx impacto.wav@12.4:-6 \
        --video render/video_sem_audio.mp4 --saida final.mp4

    # vídeo renderizado como PNG pelo Blender:
    python tools/mixar_audio.py --voz voz.wav --quadros "render/quadros/q_%04d.png" --saida final.mp4

O que faz:
  voz: passa-alta 80 Hz, de-esser, compressor 3:1, nivelada a -16 LUFS
  trilha: em loop, 20 LU abaixo da voz, com ducking quando a voz entra, cortada no fim da voz
  efeitos: cada um no seu tempo (s), 8 dB abaixo da voz (ou o ganho dado após ':')
  master: loudnorm em 2 passadas para -14 LUFS, -1 dBTP; relatório de loudness e silêncios
"""
import argparse
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style_config as C  # noqa: E402

E, A = C.ENTREGA, C.AUDIO


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        sys.exit("ffmpeg falhou:\n" + " ".join(cmd) + "\n" + p.stderr[-2000:])
    return p.stderr


def duracao(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout.strip()
    return float(out)


def mixar(voz, trilha, sfx, saida_wav):
    dur = duracao(voz)
    vlufs = E["lufs_integrado"] - 2          # voz a -16 antes do master
    tlufs = vlufs - sum(A["trilha_abaixo_da_voz_db"]) / 2
    comp = A["voz_compressor"]
    d = A["ducking"]
    inputs = ["-i", voz]
    filt = [f"[0:a]aformat=sample_rates={E['audio_hz']}:channel_layouts=stereo,"
            f"highpass=f={A['voz_passa_alta_hz']},deesser,"
            f"acompressor=threshold={comp['threshold_db']}dB:ratio={comp['ratio']}:attack={comp['attack_ms']}:release={comp['release_ms']},"
            f"loudnorm=I={vlufs}:TP=-2:LRA=7,asplit=2[voz][sc]"]
    mix = ["[voz]"]
    idx = 1
    if trilha:
        inputs += ["-stream_loop", "-1", "-i", trilha]
        filt.append(f"[{idx}:a]aformat=sample_rates={E['audio_hz']}:channel_layouts=stereo,atrim=0:{dur:.3f},"
                    f"loudnorm=I={tlufs}:TP=-6:LRA=7[tr0]")
        filt.append(f"[tr0][sc]sidechaincompress=threshold={d['threshold']}:ratio={d['ratio']}:"
                    f"attack={d['attack_ms']}:release={d['release_ms']}[tr]")
        mix.append("[tr]")
        idx += 1
    else:
        filt.append("[sc]anullsink")
    ganho_padrao = -sum(A["sfx_abaixo_da_voz_db"]) / 2
    for s in sfx:
        m = re.match(r"(.+)@([\d.]+)(?::(-?[\d.]+))?$", s)
        if not m:
            sys.exit(f"--sfx '{s}': use arquivo.wav@segundos[:ganho_db]")
        arq, t, g = m.group(1), float(m.group(2)), float(m.group(3)) if m.group(3) else ganho_padrao
        inputs += ["-i", arq]
        ms = int(t * 1000)
        filt.append(f"[{idx}:a]aformat=sample_rates={E['audio_hz']}:channel_layouts=stereo,"
                    f"loudnorm=I={vlufs}:TP=-2,volume={g}dB,adelay={ms}|{ms}[s{idx}]")
        mix.append(f"[s{idx}]")
        idx += 1
    filt.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0:duration=first[mix]")
    tmp = saida_wav + ".premaster.wav"
    run(["ffmpeg", "-y", "-v", "error"] + inputs + ["-filter_complex", ";".join(filt), "-map", "[mix]",
                                                   "-ar", str(E["audio_hz"]), tmp])
    # master em 2 passadas
    alvo = f"I={E['lufs_integrado']}:TP={E['true_peak_dbtp']}:LRA={E['lra_lu'][1]}"
    log = run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", f"loudnorm={alvo}:print_format=json", "-f", "null", "-"])
    meas = json.loads(log[log.rindex("{"):log.rindex("}") + 1])
    af = (f"loudnorm={alvo}:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
          f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:"
          f"offset={meas['target_offset']}:linear=true")
    tmp2 = saida_wav + ".pass2.wav"
    run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(E["audio_hz"]), tmp2])
    # correção fina de ganho + limitador em -1 dBTP
    for _ in range(3):
        I = medir_lufs(tmp2)
        diff = E["lufs_integrado"] - I
        lim = 10 ** (E["true_peak_dbtp"] / 20)
        run(["ffmpeg", "-y", "-v", "error", "-i", tmp2, "-af",
             f"volume={diff:.2f}dB,alimiter=limit={lim:.3f}:level=false", "-ar", str(E["audio_hz"]), saida_wav])
        if abs(medir_lufs(saida_wav) - E["lufs_integrado"]) <= 0.2:
            break
        os.replace(saida_wav, tmp2)
    for t in (tmp, tmp2):
        if os.path.exists(t):
            os.remove(t)
    return saida_wav


def medir_lufs(path):
    log = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"])
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1])


def relatorio(path):
    log = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
               f"ebur128=peak=true,silencedetect=n={E['silencio_limiar_db']}dB:d={E['silencio_max_s']}",
               "-f", "null", "-"])
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1])
    lra = float(re.findall(r"LRA:\s+([\d.]+) LU", log)[-1])
    sil = re.findall(r"silence_start: ([\d.]+)", log)
    ok_i = abs(I - E["lufs_integrado"]) <= E["lufs_tolerancia"]
    ok_l = lra <= E["lra_lu"][1] + 0.5
    print(f"\nloudness integrado: {I:.1f} LUFS  (alvo {E['lufs_integrado']})  {'ok' if ok_i else 'AJUSTAR'}")
    print(f"faixa de loudness:  {lra:.1f} LU    (originais {E['lra_lu'][0]}–{E['lra_lu'][1]})  {'ok' if ok_l else 'AJUSTAR'}")
    print(f"silêncios ≥ {E['silencio_max_s']} s abaixo de {E['silencio_limiar_db']} dB: {len(sil)}"
          + ("  ok" if not sil else "  AJUSTAR em " + ", ".join(f"{float(s):.2f}s" for s in sil[:8])))
    return ok_i and ok_l and not sil


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--voz", required=True)
    p.add_argument("--trilha")
    p.add_argument("--sfx", action="append", default=[], help="arquivo.wav@segundos[:ganho_db]")
    g = p.add_mutually_exclusive_group()
    g.add_argument("--video", help="vídeo renderizado (o áudio dele é ignorado)")
    g.add_argument("--quadros", help='sequência PNG, ex.: "render/quadros/q_%%04d.png"')
    p.add_argument("--inicio-quadros", type=int, default=0, help="número do primeiro PNG")
    p.add_argument("--saida", required=True, help="final.mp4, ou .wav para só o áudio")
    a = p.parse_args()

    wav = a.saida if a.saida.lower().endswith(".wav") else os.path.splitext(a.saida)[0] + "_audio.wav"
    mixar(a.voz, a.trilha, a.sfx, wav)
    if a.video or a.quadros:
        vin = ["-i", a.video] if a.video else ["-framerate", str(E["fps"]), "-start_number", str(a.inicio_quadros),
                                               "-i", a.quadros]
        lo, hi = E["bitrate_mbps"]
        run(["ffmpeg", "-y", "-v", "error"] + vin + ["-i", wav, "-map", "0:v", "-map", "1:a",
             "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", str(E["fps"]),
             "-vf", f"scale={E['largura']}:{E['altura']}:flags=lanczos",
             "-b:v", f"{(lo + hi) // 2}M", "-maxrate", f"{hi}M", "-bufsize", f"{2 * hi}M",
             "-c:a", "aac", "-b:a", f"{E['audio_kbps']}k", "-shortest", "-movflags", "+faststart", a.saida])
        print("vídeo final:", a.saida)
    ok = relatorio(wav)
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
