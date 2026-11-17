"""Mede velocidade de câmera de um trecho renderizado (mesmo método do qc_medir):  python tools/medir_trecho.py clip.mp4"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "shorts_estilo", "tools"))
import numpy as np
import qc_medir as Q
for f in sys.argv[1:]:
    fps, L, H, G = Q.medir(f)
    v = np.array([r["cam_vel"] for r in L], dtype=float)
    print(f"{os.path.basename(f):24s} vel média {np.nanmean(v):5.2f} px/q   mediana {np.nanmedian(v):5.2f}   válidos {np.isfinite(v).sum()}/{len(v)}")
