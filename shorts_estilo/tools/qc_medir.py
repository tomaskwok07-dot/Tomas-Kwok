"""
Controle de qualidade: mede o vídeo final quadro a quadro com o mesmo método usado nos 20
originais e compara com as faixas da bíblia (style_config.QC).

    pip install opencv-python numpy
    python tools/qc_medir.py final.mp4 [--csv medicoes.csv]

Mede: duração, brilho/contraste/saturação/estouro (luma Y' BT.709), movimento de câmera
(fluxo óptico + modelo de similaridade com RANSAC), trocas de plano (aproximado), loudness e
silêncios (ffmpeg). As trocas de plano aqui usam só histogramas (versão rápida); nos originais
o detector também casava pontos-chave, então trate a contagem como aproximada.
"""
import argparse
import os
import re
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style_config as C  # noqa: E402

FW, FH = 180, 320   # resolução do fluxo óptico (igual à usada nos originais)
SW, SH = 360, 640   # resolução das estatísticas de cor
K = 6               # janela (quadros) para trocas de plano

gy, gx = np.mgrid[4:FH - 4:6, 4:FW - 4:6]
GRID = np.stack([gx.ravel(), gy.ravel()], 1).astype(np.float32)


def hist(bgr):
    h = cv2.calcHist([cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)], [0, 1, 2], None, [16, 8, 8], [0, 180, 0, 256, 0, 256])
    return cv2.normalize(h, h)


def medir(path):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    escala = 1080 / FW
    linhas, hists, grays = [], [], []
    prev = None
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        small = cv2.resize(fr, (SW, SH), interpolation=cv2.INTER_AREA)
        rgb = small[..., ::-1].astype(np.float32)
        Y = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
        S = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)[..., 1] / 255.0
        p5, p95 = np.percentile(Y, [5, 95])
        g = cv2.cvtColor(cv2.resize(small, (FW, FH), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        r = dict(brilho=Y.mean(), contraste=Y.std(), faixa=p95 - p5, sat=S.mean(),
                 sombras=(Y < 40).mean() * 100, estouro=(Y >= 250).mean() * 100,
                 cam_vel=np.nan, cam_zoom=np.nan, cam_ok=False)
        if prev is not None:
            flow = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            d = flow[GRID[:, 1].astype(int), GRID[:, 0].astype(int)]
            M, inl = cv2.estimateAffinePartial2D(GRID, GRID + d, method=cv2.RANSAC, ransacReprojThreshold=1.0)
            if M is not None and inl.mean() >= 0.3:
                c = np.array([FW / 2, FH / 2])
                sh = M[:, :2] @ c + M[:, 2] - c
                r.update(cam_vel=float(np.hypot(*sh)) * escala, cam_zoom=(float(np.hypot(M[0, 0], M[1, 0])) - 1) * 100,
                         cam_ok=True)
        hists.append(hist(small))
        grays.append(cv2.resize(g, (36, 64)).astype(np.float32).ravel())
        linhas.append(r)
        prev = g
    cap.release()
    return fps, linhas, hists, grays


def trocas(hists, grays):
    n = len(hists)
    G = np.array(grays)
    G = (G - G.mean(1, keepdims=True)) / (G.std(1, keepdims=True) + 1e-6)

    def dist(a, b):
        return 0.5 * cv2.compareHist(hists[a], hists[b], cv2.HISTCMP_BHATTACHARYYA) + 0.5 * (1 - float((G[a] * G[b]).mean()))

    score = np.zeros(n)
    for i in range(K, n - K):
        score[i] = dist(i - K, i + K)
    picos = []
    for i in range(K, n - K):
        if score[i] == score[max(0, i - 9):i + 10].max() and score[i] > 0.5:
            bef, aft = dist(max(0, i - 3 * K), i - K), dist(i + K, min(n - 1, i + 3 * K))
            if score[i] / (max(bef, aft) + 0.05) >= 1.4:
                d1 = [dist(j - 1, j) for j in range(max(1, i - K), min(n, i + K + 1))]
                seco = max(d1) / (sum(d1) + 1e-9) >= 0.6
                picos.append((i, seco))
    return picos


def loudness(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
                        f"ebur128,silencedetect=n={C.ENTREGA['silencio_limiar_db']}dB:d={C.ENTREGA['silencio_max_s']}",
                        "-f", "null", "-"], capture_output=True, text=True).stderr
    try:
        I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", p)[-1])
        lra = float(re.findall(r"LRA:\s+([\d.]+) LU", p)[-1])
    except IndexError:
        return None, None, None
    return I, lra, len(re.findall(r"silence_start", p))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--csv")
    a = ap.parse_args()
    fps, L, H, G = medir(a.video)
    n = len(L)
    dur = n / fps
    arr = {k: np.array([r[k] for r in L], dtype=float) for k in L[0]}
    cam = arr["cam_ok"].astype(bool)
    parada = ((arr["cam_vel"] < 0.75) & (np.abs(arr["cam_zoom"]) < 0.1))[cam]
    tr = trocas(H, G)
    planos = len(tr) + 1
    I, lra, sil = loudness(a.video)
    Q = C.QC
    res = [
        ("duração (s)", dur, Q["duracao_s"]),
        ("planos por minuto (aprox.)", planos / dur * 60, Q["planos_por_minuto"]),
        ("plano médio (s, aprox.)", dur / planos, Q["plano_medio_s"]),
        ("cortes secos / trocas", (sum(1 for _, s in tr if s) / len(tr)) if tr else 0, Q["cortes_secos_fracao"]),
        ("brilho médio (Y' 0–255)", arr["brilho"].mean(), Q["brilho_medio"]),
        ("contraste RMS", arr["contraste"].mean(), Q["contraste_rms"]),
        ("saturação média", arr["sat"].mean(), Q["saturacao_media"]),
        ("sombras, Y' < 40 (%)", arr["sombras"].mean(), Q.get("sombras_pct", (2, 29))),
        ("branco estourado (%)", arr["estouro"].mean(), Q["branco_estourado_pct"]),
        ("câmera parada (% quadros)", parada.mean() * 100 if parada.size else np.nan, Q["camera_parada_pct"]),
        ("velocidade da câmera (px/quadro, 1080)", np.nanmean(arr["cam_vel"]), Q["camera_vel_px_q_1080"]),
    ]
    if I is not None:
        res += [("loudness (LUFS)", I, Q["lufs"]), ("faixa de loudness (LU)", lra, Q["lra"]),
                ("silêncios ≥ 0,25 s", sil, Q["silencios"])]
    falhas = 0
    print(f"\n{'medida':42s} {'seu vídeo':>10s}   {'faixa dos originais':>20s}")
    for nome, v, (lo, hi) in res:
        ok = lo <= v <= hi if v == v else False
        falhas += not ok
        print(f"{nome:42s} {v:10.2f}   {lo:>9} – {hi:<9}  {'ok' if ok else 'FORA'}")
    if fps and abs(fps - C.ENTREGA["fps"]) > 0.01:
        print(f"\n[aviso] fps = {fps}, alvo {C.ENTREGA['fps']}")
        falhas += 1
    print(f"\ntrocas de plano detectadas em: " + ", ".join(f"{i / fps:.1f}s{'(corte)' if s else ''}" for i, s in tr))
    if a.csv:
        import csv
        with open(a.csv, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["quadro", "t"] + list(L[0]))
            for i, r in enumerate(L):
                w.writerow([i, round(i / fps, 3)] + [round(float(r[k]), 4) for k in r])
        print("medições por quadro em", a.csv)
    print("\nresultado:", "dentro do estilo" if not falhas else f"{falhas} medida(s) fora da faixa")
    sys.exit(0 if not falhas else 2)


if __name__ == "__main__":
    main()
