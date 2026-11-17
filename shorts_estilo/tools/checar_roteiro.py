"""
Confere um roteiro em português contra a bíblia de estilo.

    python tools/checar_roteiro.py roteiro.txt

Formato do roteiro: blocos marcados com [GANCHO], [CONTEXTO], [DESCONFIANCA], [PROVA], [VIRADA]
(o modelo está em templates/roteiro_modelo.txt). Linhas começando com # são comentários.
"""
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style_config as C  # noqa: E402

NUM_EXTENSO = r"\b(dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|vinte|trinta|quarenta|cinquenta|cem|cento|mil|milh[aã]o|milh[oõ]es|metade|d[uú]zia)\b"


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def ler(caminho):
    texto = open(caminho, encoding="utf-8").read()
    texto = "\n".join(l for l in texto.splitlines() if not l.strip().startswith("#"))
    partes = re.split(r"\[([A-ZÇÃÉÊÍÓÚ ]+)\]", texto)
    titulo = re.search(r"T[IÍ]TULO\s*:\s*(.+)", texto, re.I)
    blocos = {}
    for i in range(1, len(partes) - 1, 2):
        blocos[sem_acento(partes[i].strip().lower())] = partes[i + 1].strip()
    return (titulo.group(1).strip() if titulo else ""), blocos


def palavras(t):
    return re.findall(r"[0-9A-Za-zÀ-ÿ$%'’-]+", t)


def frases(t):
    return [f.strip() for f in re.split(r"(?<=[.!?…])\s+", t.strip()) if f.strip()]


def checar(caminho):
    titulo, blocos = ler(caminho)
    R = C.ROTEIRO
    ok, avisos = [], []
    ordem = [b["nome"] for b in R["batidas"]]
    faltando = [b for b in ordem if b not in blocos]
    if faltando:
        avisos.append(f"faltam as batidas: {', '.join(faltando)}")
    total = 0
    linhas = []
    for b in R["batidas"]:
        t = blocos.get(b["nome"], "")
        n = len(palavras(t))
        nf = len(frases(t))
        total += n
        a, z = b["palavras"]
        st = "ok" if a <= n <= z else ("curto" if n < a else "longo")
        linhas.append((b["nome"], f"{b['inicio_s']}-{b['fim_s']} s", n, f"{a}-{z}", nf, st))
        if st != "ok":
            avisos.append(f"{b['nome']}: {n} palavras (alvo {a}-{z})")
    a, z = R["palavras_total"]
    seg = total / C.ROTEIRO["palavras_por_segundo_pt"]
    (ok if a <= total <= z else avisos).append(f"total: {total} palavras (alvo {a}-{z}) ≈ {seg:.0f} s de narração")
    todas = [f for b in ordem for f in frases(blocos.get(b, ""))]
    fa, fz = R["palavras_por_frase"]
    longas = [f for f in todas if len(palavras(f)) > fz]
    if longas:
        avisos.append(f"{len(longas)} frase(s) com mais de {fz} palavras: " + " | ".join(l[:60] for l in longas[:3]))
    texto = " ".join(blocos.get(b, "") for b in ordem)
    nums = len(re.findall(r"\d+(?:[.,]\d+)*", texto)) + len(re.findall(NUM_EXTENSO, sem_acento(texto.lower())))
    (ok if nums >= R["numeros_concretos_min"] else avisos).append(
        f"números concretos: {nums} (mín {R['numeros_concretos_min']})")
    citadas = len(re.findall(r"[\"“”«»]([^\"“”«»]+)[\"“”«»]", texto)) or len(re.findall(r"—\s", texto))
    (ok if citadas <= R["falas_citadas_max"] else avisos).append(f"falas citadas: {citadas} (máx {R['falas_citadas_max']})")
    baixo = sem_acento(texto.lower())
    proib = [p for p in R["proibido"] if re.search(r"\b" + re.escape(sem_acento(p)) + r"\b", baixo)]  # palavra inteira ("chocolate" não é "olá")
    (avisos if proib else ok).append("expressões proibidas: " + (", ".join(proib) if proib else "nenhuma"))
    gancho = blocos.get("gancho", "")
    if gancho and len(frases(gancho)) > 1:
        avisos.append("gancho tem mais de 1 frase")
    tem_expl = re.search(r"sabe por qu[eê]|[ée] que\b", texto, re.I)
    if tem_expl:
        pos = tem_expl.start() / max(1, len(texto))
        ok.append(f"explicação em {pos:.0%} do texto → variante {'A' if pos < 0.2 else 'B' if pos > 0.6 else '?'}"
                  + ("" if pos < 0.2 or pos > 0.6 else " (originais: <20% ou >60%)"))
    else:
        avisos.append("sem \"Sabe por quê?\" / \"É que\": use um deles para abrir a explicação")
    if titulo:
        n = len(palavras(titulo))
        a, z = R["titulo_palavras"]
        (ok if a <= n <= z else avisos).append(f"título: {n} palavras (alvo {a}-{z})")
    else:
        avisos.append("sem linha TÍTULO:")
    if re.search(r"\?\s*$", blocos.get("virada", "")):
        avisos.append("a virada termina em pergunta; os originais terminam com afirmação seca")

    print(f"\n{'batida':14s} {'tempo':9s} {'palavras':>8s} {'alvo':>7s} {'frases':>6s}  situação")
    for l in linhas:
        print(f"{l[0]:14s} {l[1]:9s} {l[2]:8d} {l[3]:>7s} {l[4]:6d}  {l[5]}")
    print("\nOK:")
    for o in ok:
        print("  ✓", o)
    print("\nAJUSTAR:" if avisos else "\nNada para ajustar.")
    for a_ in avisos:
        print("  ✗", a_)
    return not avisos


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    sys.exit(0 if checar(sys.argv[1]) else 2)
