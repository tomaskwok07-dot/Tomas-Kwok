"""Gera decupagem.csv a partir de src/dados/planos.json (a mesma lista que o vídeo usa)."""
import csv, json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
planos = json.load(open(os.path.join(R, "src", "dados", "planos.json"), encoding="utf-8"))
NOME = {"wipe": "wipe por personagem", "zoom": "zoom-through", "chicote": "whip pan", "match": "match cut", "coracao": "match de forma (corações > sofá)",
        "fusao": "fusão", "corte": "corte seco", "iris": "íris de coração + loop"}
with open(os.path.join(R, "decupagem.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["plano", "inicio", "fim", "duracao_s", "cenario", "tipo", "camera", "transicao_saida", "transicao_quadros", "efeito", "frase"])
    for p in planos:
        w.writerow([p["plano"], p["inicio"], p["fim"], round((p["fim"] - p["inicio"] + 1) / 30, 2), p["cena"], p["tipo"], p["camera"],
                    NOME[p["transicao_saida"]], p["transicao_quadros"] or "", p["efeito"], p["frase"]])
dur = (planos[-1]["fim"] + 1) / 30
print(f"{len(planos)} planos em {dur:.1f} s = {len(planos) / dur * 60:.1f} planos/min; cortes secos:", sum(p["transicao_saida"] == "corte" for p in planos))
