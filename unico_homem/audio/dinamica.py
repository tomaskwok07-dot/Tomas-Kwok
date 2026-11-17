"""Dá respiro e picos ao master (faixa de loudness 2–3 LU) com uma curva de ganho por momento da história.

    python audio/dinamica.py out/audio_final.wav   (reescreve o arquivo em -14 LUFS / -1 dBTP)
"""
import re, subprocess, sys
import numpy as np

SR = 48000
# (segundo, dB): respiro nos trechos calmos, pico nos momentos-chave
CURVA = [(0, 1.2), (3.4, 1.2), (3.7, 0), (13.0, 0), (13.2, -1.6), (15.3, -1.6), (15.5, 0), (17.9, 0.4), (19.6, 2.0), (19.9, -2.2), (21.9, -2.2),
         (22.1, 0), (25.4, 0.6), (27.0, 0.6), (27.2, 0), (30.2, 1.2), (30.7, 0), (36.6, 0), (36.8, -3.4), (38.2, -3.4), (38.4, -0.8), (39.7, -0.8),
         (39.9, -1.4), (41.8, -1.4), (42.0, 0), (47.2, 0), (47.4, 1.8), (53.4, 1.8), (53.6, -3.6), (55.3, -3.6), (55.5, -2.0), (57.6, -0.5),
         (58.2, 2.2), (59.3, 2.2), (59.9, 1.6), (63.5, 1.6)]


def medir(path):
    log = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1]), float(re.findall(r"LRA:\s+([\d.]+) LU", log)[-1])


def main(path, escala=1.0, dur=None):
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).copy()
    if dur:  # deixa exatamente na duração do vídeo
        n = int(dur * SR); x = np.concatenate([x, np.zeros((max(0, n - len(x)), 2), dtype=np.float32)])[:n]
    t = np.arange(len(x)) / SR
    db = np.interp(t, [c[0] for c in CURVA], [c[1] * escala for c in CURVA])
    k = int(0.15 * SR); c = np.cumsum(np.pad(db, (k + 1, k), mode="edge")); db = (c[2 * k + 1:] - c[:-2 * k - 1]) / (2 * k + 1)  # suaviza as rampas (média móvel)
    x *= (10 ** (db / 20))[:, None]
    tmp = path + ".din.wav"
    ganho = 0.0
    for _ in range(4):
        p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af", f"volume={ganho:.2f}dB,alimiter=limit=0.78:level=false", "-c:a", "pcm_s24le", tmp], stdin=subprocess.PIPE)
        p.communicate(x.tobytes())
        I, lra = medir(tmp)
        if abs(I + 14) <= 0.1: break
        ganho += -14 - I
    subprocess.run(["mv", tmp, path], check=True)
    print(f"dinâmica aplicada: {I:.1f} LUFS, LRA {lra:.1f} LU")


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 1.0, float(sys.argv[3]) if len(sys.argv) > 3 else None)
