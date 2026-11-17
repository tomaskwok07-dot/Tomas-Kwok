"""Aperta as pausas da narração, acelera 1,10x e abre o espaço da fala do novato.

    python audio/montar_voz.py   ->  audio/voz.wav (48 kHz mono), audio/beijo.wav, src/dados/palavras.json, src/dados/marcas.json
"""
import json, os, re, subprocess
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 48000
TEMPO = 1.10          # aceleração final (style_config: 1,10–1,15)
PAUSA_FRASE = 0.14    # pausa máxima entre frases (bíblia: 0,15 s)
PAUSA_BATIDA = 0.22   # entre batidas / antes de piada (bíblia: 0,25 s)
BATIDA_DEPOIS_DE = {"querem.", "lidas.", "mim.", "vida.", "sossego.", "segundos,"}
ESPACO_BEIJO = 1.75   # s de respiro depois de "com flores." para o balão ME DÁ UM BEIJO!


def ler(caminho, filtro=None):
    cmd = ["ffmpeg", "-v", "error", "-i", caminho] + (["-af", filtro] if filtro else []) + \
          ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()


def gravar(caminho, x):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                          "-c:a", "pcm_s24le", caminho], stdin=subprocess.PIPE)
    p.communicate(x.astype(np.float32).tobytes())


def main():
    ws = json.load(open(os.path.join(AQUI, "alinhamento.json")))
    x = ler(os.path.join(AQUI, "voz_bruta.mp3"), f"atempo={TEMPO}")
    for w in ws:
        w["start"] /= TEMPO
        w["end"] /= TEMPO
    saida, palavras, marcas = [], [], {}
    pos = 0.0          # tempo na saída
    cur = 0.0          # tempo na entrada já copiado
    fade = int(0.008 * SR)

    def copiar(a, b):
        nonlocal pos
        seg = x[int(a * SR):int(b * SR)].copy()
        if len(seg) > 2 * fade:
            seg[:fade] *= np.linspace(0, 1, fade)
            seg[-fade:] *= np.linspace(1, 0, fade)
        saida.append(seg)
        pos += len(seg) / SR

    for i, w in enumerate(ws):
        prox = ws[i + 1]["start"] if i + 1 < len(ws) else len(x) / SR
        gap = prox - w["end"]
        fim_frase = bool(re.search(r"[.!?:]$", w["word"])) or w["word"] in BATIDA_DEPOIS_DE
        alvo = gap
        if fim_frase:
            alvo = min(gap, PAUSA_BATIDA if w["word"] in BATIDA_DEPOIS_DE else PAUSA_FRASE)
        elif gap > 0.2:
            alvo = 0.2
        desloc = pos - cur
        palavras.append({"word": w["word"], "start": round(w["start"] + desloc, 3), "end": round(w["end"] + desloc, 3)})
        corte = w["end"] + min(alvo, gap) * 0.5
        if alvo < gap - 0.01:
            copiar(cur, corte)                       # até o meio da pausa mantida
            cur = prox - alvo * 0.5                  # pula o excesso
        if w["word"] == "flores.":
            copiar(cur, prox - 0.02) if prox - 0.02 > cur else None
            cur = max(cur, prox - 0.02)
            marcas["beijo"] = round(pos + 0.12, 3)
            saida.append(np.zeros(int(ESPACO_BEIJO * SR), dtype=np.float32))
            pos += ESPACO_BEIJO
    copiar(cur, len(x) / SR)
    voz = np.concatenate(saida)
    voz = np.concatenate([voz, np.zeros(int(0.2 * SR), dtype=np.float32)])
    gravar(os.path.join(AQUI, "voz.wav"), voz)
    # fala do novato: Will mais agudo e rápido (personagem diferente do narrador)
    b = ler(os.path.join(AQUI, "beijo_bruto.mp3"), "asetrate=44100*1.26,aresample=48000,atempo=0.92")
    nz = np.where(np.abs(b) > 0.01)[0]
    b = b[max(0, nz[0] - 200):nz[-1] + 2000]
    gravar(os.path.join(AQUI, "beijo.wav"), b)
    marcas["beijo_dur"] = round(len(b) / SR, 3)
    marcas["duracao_voz"] = round(len(voz) / SR, 3)
    os.makedirs(os.path.join(AQUI, "..", "src", "dados"), exist_ok=True)
    json.dump(palavras, open(os.path.join(AQUI, "..", "src", "dados", "palavras.json"), "w"), ensure_ascii=False)
    json.dump(marcas, open(os.path.join(AQUI, "..", "src", "dados", "marcas.json"), "w"))
    print(marcas)
    linha, s = [], None
    for w in palavras:
        s = w["start"] if s is None else s
        linha.append(w["word"])
        if re.search(r"[.!?:]$", w["word"]):
            print(f"{s:6.2f}-{w['end']:6.2f} q{round(s*30):5d}-{round(w['end']*30):5d}  {' '.join(linha)}")
            linha, s = [], None


if __name__ == "__main__":
    main()
