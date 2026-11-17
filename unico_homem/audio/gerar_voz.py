"""Gera a narração com a voz Will (ElevenLabs) e os tempos de cada palavra.

    python audio/gerar_voz.py            # lê roteiro.txt, grava audio/voz_bruta.mp3 + audio/alinhamento.json

A chave da API vem do ambiente (ELEVENLABS_API_KEY) ou é injetada pelo proxy do ambiente.
"""
import base64, json, os, re, subprocess, sys, urllib.request

VOZ_WILL = "bIHbv24MWmeRgasZH58o"
AQUI = os.path.dirname(os.path.abspath(__file__))


def texto_roteiro(caminho):
    t = open(caminho, encoding="utf-8").read()
    linhas = [l for l in t.splitlines() if l.strip() and not l.startswith("#") and not l.startswith("TÍTULO")
              and not re.match(r"\[.+\]", l.strip())]
    return " ".join(linhas)


def tts(texto, saida_mp3, saida_json, velocidade=1.15, estabilidade=0.5, estilo=0.15):
    corpo = {"text": texto, "model_id": "eleven_multilingual_v2", "language_code": "pt",
             "voice_settings": {"stability": estabilidade, "similarity_boost": 0.8, "style": estilo,
                                "speed": velocidade, "use_speaker_boost": True}}
    tmp = saida_json + ".req"
    json.dump(corpo, open(tmp, "w"))
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOZ_WILL}/with-timestamps?output_format=mp3_44100_128"
    r = subprocess.run(["curl", "-sS", "-X", "POST", url, "-H", "Content-Type: application/json",
                        "-H", "xi-api-key: " + os.environ.get("ELEVENLABS_API_KEY", "proxy"),
                        "--data-binary", "@" + tmp], capture_output=True)
    os.remove(tmp)
    d = json.loads(r.stdout)
    if "audio_base64" not in d:
        sys.exit("erro da API: " + json.dumps(d)[:400])
    open(saida_mp3, "wb").write(base64.b64decode(d["audio_base64"]))
    al = d["alignment"]
    palavras, atual, ini = [], "", None
    for c, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if c.isspace():
            if atual:
                palavras.append({"word": atual, "start": round(ini, 3), "end": round(fim, 3)})
            atual, ini = "", None
        else:
            if ini is None:
                ini = a
            atual += c
            fim = b
    if atual:
        palavras.append({"word": atual, "start": round(ini, 3), "end": round(fim, 3)})
    json.dump(palavras, open(saida_json, "w"), ensure_ascii=False, indent=0)
    return palavras


if __name__ == "__main__":
    raiz = os.path.dirname(AQUI)
    if len(sys.argv) > 1 and sys.argv[1] == "beijo":
        p = tts("Me dá um beijo!", os.path.join(AQUI, "beijo_bruto.mp3"), os.path.join(AQUI, "beijo.json"),
                velocidade=1.0, estabilidade=0.3, estilo=0.6)
    else:
        p = tts(texto_roteiro(os.path.join(raiz, "roteiro.txt")), os.path.join(AQUI, "voz_bruta.mp3"),
                os.path.join(AQUI, "alinhamento.json"))
    print(len(p), "palavras, fim em", p[-1]["end"], "s")
