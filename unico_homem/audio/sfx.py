"""Efeitos sonoros sintetizados por código (sem bancos de som), alinhados aos quadros da decupagem.

    python audio/sfx.py   ->  audio/sfx.wav (todos os efeitos já posicionados) e audio/ambiente.wav (leito trocável por trilha)
"""
import json, os, subprocess
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
SR, FPS = 48000, 30
TOTAL = 1905
rng = np.random.default_rng(7)
mix = np.zeros((int(TOTAL / FPS * SR) + SR, 2), dtype=np.float64)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.005, r=0.1):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, k):  # passa-baixa de um polo
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc); y[i] = acc
    return y


def put(q, x, g=1.0, pan=0.0):
    i = int(q / FPS * SR)
    x = x * g
    n = min(len(x), len(mix) - i)
    if n <= 0: return
    mix[i:i + n, 0] += x[:n] * (1 - max(0, pan)) ; mix[i:i + n, 1] += x[:n] * (1 + min(0, pan))


def pop(f0=700):
    t = t_(0.09); fr = f0 * np.exp(-t * 14) + 180
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 38)

def plim(f0=1568):
    t = t_(0.45)
    return (np.sin(2 * np.pi * f0 * t) + 0.5 * np.sin(2 * np.pi * f0 * 1.5 * t) + 0.25 * np.sin(2 * np.pi * f0 * 2.01 * t)) * np.exp(-t * 9) * 0.6

def whoosh(d=0.3, lo=0.02, hi=0.35):
    n = int(d * SR); x = rng.standard_normal(n)
    k = lo + (hi - lo) * np.sin(np.linspace(0, np.pi, n)) ** 2
    y = np.zeros(n); acc = 0.0
    for i in range(n):
        acc += k[i] * (x[i] - acc); y[i] = acc
    y = y - lp(y, 0.01)
    return y * np.sin(np.linspace(0, np.pi, n)) ** 1.5 * 2.2

def boing(f0=190):
    t = t_(0.42); fr = f0 * (1 + 0.5 * np.exp(-t * 6) * np.sin(2 * np.pi * 11 * t)) * (1 + 0.6 * np.exp(-t * 9))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 7) * env(len(t), 0.004, 0.05)

def riser(d=0.6):
    t = t_(d); fr = 220 * 2 ** (t / d * 2.4)
    s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * 0.5 + lp(rng.standard_normal(len(t)), 0.25) * 0.8
    return s * (t / d) ** 2 * env(len(t), 0.01, 0.02)

def scratch():
    t = t_(0.5); u = t / 0.5
    fr = 900 * np.abs(np.sin(u * np.pi * 2.5)) + 120
    s = np.sign(np.sin(2 * np.pi * np.cumsum(fr) / SR)) * 0.35 + lp(rng.standard_normal(len(t)), 0.5) * np.abs(np.sin(u * np.pi * 2.5))
    return lp(s, 0.45) * env(len(t), 0.004, 0.08) * 1.3

def thud(f0=85, d=0.3):
    t = t_(d); fr = f0 * np.exp(-t * 7) + 38
    return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 11) + lp(rng.standard_normal(len(t)), 0.08) * np.exp(-t * 30) * 0.6) * 1.4

def tick(f0=1050, d=0.05):
    t = t_(d)
    return np.sin(2 * np.pi * f0 * t) * np.exp(-t * 70)

def buzzer():
    t = t_(0.32)
    return lp(np.sign(np.sin(2 * np.pi * 155 * t)), 0.3) * env(len(t), 0.005, 0.03) * 0.6

def sparkle(n=6, f0=1400):
    out = np.zeros(int(0.9 * SR))
    for i in range(n):
        p = plim(f0 * 2 ** (i * 2 / 12)) * 0.5
        j = int(i * 0.055 * SR); out[j:j + len(p)] += p[:len(out) - j]
    return out

def passo(f0=260):
    t = t_(0.05)
    return (lp(rng.standard_normal(len(t)), 0.2) * 0.9 + np.sin(2 * np.pi * f0 * t) * 0.6) * np.exp(-t * 75)

def chirp():
    t = t_(0.11); fr = 2600 + 1400 * np.sin(2 * np.pi * 9 * t)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(len(t), 0.01, 0.04) * 0.35

def mwah():
    t = t_(0.16); fr = 500 * 2 ** (t / 0.16 * 1.6)
    return np.concatenate([np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(len(t), 0.02, 0.01) * 0.6, pop(1100) * 1.2])

def latido():
    t = t_(0.13); fr = 420 * np.exp(-t * 6) + 160
    return lp(np.sign(np.sin(2 * np.pi * np.cumsum(fr) / SR)), 0.25) * env(len(t), 0.005, 0.05) * 0.8

def chime():
    out = np.zeros(int(1.3 * SR))
    for i, f in enumerate([880, 660, 784]):
        t = t_(0.7); p = np.tanh(2.5 * np.sin(2 * np.pi * f * t)) * np.exp(-t * 4.5) * 0.5
        j = int(i * 0.26 * SR); out[j:j + len(p)] += p[:len(out) - j]
    return lp(out, 0.4)

def microfonia():
    t = t_(0.28)
    return np.sin(2 * np.pi * (2300 + 300 * t / 0.28) * t) * env(len(t), 0.08, 0.1) * 0.25

def megafone(d=1.4):  # "voz" de megafone: ruído modulado em sílabas
    t = t_(d); sil = (np.sin(2 * np.pi * 5.5 * t) > -0.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.7 * t))
    s = np.tanh(3 * (np.sin(2 * np.pi * 240 * t) * 0.6 + lp(rng.standard_normal(len(t)), 0.35)))
    s = s - lp(s, 0.05)
    return s * sil * env(len(t), 0.02, 0.1) * 0.35

def acorde():  # piano pousando: cluster desafinado
    t = t_(1.2); out = np.zeros(len(t))
    for f in [65.4, 98, 130.8, 155.6, 185, 233, 311]:
        out += np.sin(2 * np.pi * f * t) * np.exp(-t * (2.5 + f / 150)) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 5)
    return out * 0.3

def suspiro():
    t = t_(0.7)
    return lp(rng.standard_normal(len(t)), 0.12) * np.sin(np.linspace(0, np.pi, len(t))) ** 0.7 * np.linspace(1, 0.3, len(t)) * 1.5

def ronco(d=1.0):
    t = t_(d)
    return lp(rng.standard_normal(len(t)), 0.012) * (t / d) * env(len(t), 0.05, 0.15) * 6


W = lambda q, d=0.3, g=0.9, pan=0.0: put(q, whoosh(d), g, pan)

# ---- 1 abertura
put(4, whoosh(1.3, 0.01, 0.2), 0.9); put(6, riser(1.0), 0.35)
for q in (22, 52, 84): put(q, sparkle(5, 1500), 0.45)
put(40, boing(210), 0.8); put(74, boing(240), 0.7)
W(101, 0.4)
# ---- 2 porta e montanha
put(111, pop(420), 0.9)
for i, q in enumerate(range(114, 290, 4)): put(q + rng.integers(0, 2), pop(500 + rng.integers(0, 500)), 0.38 + 0.2 * rng.random(), rng.uniform(-0.5, 0.5))
W(190, 0.8, 0.9); put(224, boing(260), 0.9)
W(291, 0.35)
# ---- 3 sala
for q in (300, 312, 327, 341, 356, 370, 381): put(q, boing(170 + rng.integers(0, 120)), 0.55, rng.uniform(-0.6, 0.6)); put(q + 5, pop(900), 0.5, rng.uniform(-0.6, 0.6))
for q in range(298, 388, 3): put(q, passo(200 + rng.integers(0, 150)), 0.35, rng.uniform(-0.5, 0.5))
W(387, 0.3)
# ---- 4 lista
for q in range(398, 436, 6): put(q, tick(1700, 0.03), 0.35)
put(439, thud(120, 0.2), 0.9); put(440, pop(300), 0.8)
W(456, 0.3)
# ---- 5 celular
CHEGA = [2, 16, 29, 41, 52, 62, 71, 78, 84, 89, 93, 97, 101, 105, 109, 113, 117, 121, 125, 129, 133]
for i, c in enumerate(CHEGA): put(461 + c, plim(1568 * 2 ** ((i % 5) * 2 / 12)), 0.55 if i < 8 else 0.4, 0.3 * (-1) ** i)
for q in range(541, 585, 2): put(q, tick(600 + (q - 541) * 28, 0.03), 0.3)
put(541, riser(1.45), 0.5); put(585, plim(1046), 1.0); put(585, thud(110, 0.2), 0.7)
put(596, pop(380), 0.8)
# ---- 6 calendário
W(610, 0.45, 0.6); put(624, pop(880), 0.8); put(634, sparkle(6, 1300), 0.6); put(634, boing(300), 0.6)
W(655, 0.35)
# ---- 7 lei
put(692, thud(140, 0.22), 1.2); put(693, tick(700, 0.08), 0.9)
W(705, 0.5, 0.8); put(722, sparkle(7, 1200), 0.65)
for q in (726, 736, 746, 756): put(q, pop(700 + rng.integers(0, 400)), 0.5, rng.uniform(-0.6, 0.6))
W(760, 0.4)
# ---- 8 presentes
for q in (772, 783, 794): put(q, boing(260 + 30 * ((q // 11) % 3)), 0.55)
W(805, 0.45)
for i, q in enumerate(np.arange(816, 862, 2.4)): put(float(q), pop(520 + i * 28), 0.42, rng.uniform(-0.4, 0.4))
for i, q in enumerate(range(854, 890, 5)): put(q, tick(760 if i % 2 else 560, 0.06), 0.6, -0.5 + i * 0.07)
W(884, 0.9, 0.8); put(912, thud(70, 0.4), 1.3); put(912, acorde(), 1.0); put(916, sparkle(4, 1700), 0.4)
W(916, 0.45, 0.8); put(922, sparkle(6, 1250), 0.5)
# ---- 9 sofá e estátua
put(926, boing(150), 0.9); W(970, 0.45); put(984, sparkle(7, 1500), 0.55); put(1012, plim(2093), 0.6)
W(1024, 0.3)
# ---- 10 cachorro
put(1036, latido(), 0.8, -0.2); put(1041, latido(), 0.7, -0.2); put(1059, pop(900), 0.7); put(1078, latido(), 0.7, -0.2)
# ---- 11 cansei
for q in range(1106, 1150, 15): put(q, tick(820, 0.04), 0.4); put(q + 7, tick(640, 0.04), 0.3)
put(1146, scratch(), 1.0); put(1158, thud(90, 0.3), 1.1)
put(1191, pop(420), 0.8)
# ---- 12 disfarce
W(1199, 0.4, 0.7); put(1211, boing(230), 0.9); W(1217, 0.36, 0.6); put(1229, plim(1760), 0.8); put(1233, sparkle(6, 1400), 0.6)
# ---- 13 três segundos
for i, q in enumerate((1258, 1269, 1280)): put(q, tick(1000 + i * 180, 0.07), 1.0); put(q, pop(600), 0.5)
put(1291, buzzer(), 0.9); put(1293, boing(280), 0.8); put(1308, riser(1.1), 0.55); put(1341, pop(300), 1.0); put(1342, boing(330), 0.8); put(1345, sparkle(6, 1300), 0.5)
for q in range(1262, 1314, 9): put(q, passo(240), 0.3)
W(1353, 0.3)
# ---- 14 corre pra casa
for i, q in enumerate(range(1358, 1402, 3)): put(q, passo(230 + 60 * (i % 2)), 0.6, 0.6 - i * 0.08)
W(1384, 0.5, 0.6); put(1402, thud(75, 0.35), 1.3); put(1403, tick(500, 0.08), 0.9)
for q in (1406, 1409, 1412, 1415): put(q, thud(150, 0.12), 0.5, rng.uniform(-0.4, 0.4))
W(1414, 0.3)
# ---- 15 alto-falantes
put(1422, microfonia(), 0.8); put(1430, chime(), 0.9); put(1466, megafone(1.2), 0.6)
W(1500, 0.35)
# ---- 16 novato + correria
put(1519, pop(700), 0.8); put(1519, sparkle(7, 1250), 0.6); put(1532, megafone(0.5), 0.35)
put(1540, ronco(0.9), 0.8); put(1556, thud(60, 0.4), 1.2); put(1560, boing(300), 0.8)
for i, q in enumerate(np.arange(1556, 1606, 1.5)): put(float(q), passo(180 + rng.integers(0, 160)), 0.42, rng.uniform(-0.7, 0.7))
W(1599, 0.4)
# ---- 17 sossego
put(1606, suspiro(), 0.9); put(1633, sparkle(5, 1500), 0.4)
W(1658, 0.35)
# ---- 18 rua
for q in (1668, 1674, 1683, 1690): put(q, chirp(), 0.6, 0.4); put(q + 2, chirp(), 0.5, 0.4)
put(1676, boing(140), 0.45)
for i, q in enumerate(range(1696, 1746, 4)): put(q, passo(240 + 50 * (i % 2)), 0.15 + i * 0.045, -0.3)
put(1722, riser(0.8), 0.5); W(1742, 0.3)
# ---- 19 ME DÁ UM BEIJO!
put(1749, pop(520), 1.0); put(1750, sparkle(5, 1700), 0.45); put(1777, scratch(), 1.1); put(1783, riser(0.52), 0.7)
# ---- 20 close do Leo
put(1799, thud(65, 0.45), 1.5); put(1799, whoosh(0.5, 0.2, 0.6), 0.8); put(1800, plim(2600), 0.5)
# ---- 21 perseguição
for i, q in enumerate(np.arange(1831, 1890, 2.0)): put(float(q), passo(220 + 70 * (i % 2)), 0.5, 0.3 * (-1) ** i)
for q in (1838, 1852, 1866): put(q, mwah(), 0.75, -0.3); put(q + 6, plim(1975), 0.35, 0.3)
W(1869, 0.55, 0.9); put(1886, pop(380), 0.9); W(1889, 0.45, 0.7); put(1891, sparkle(7, 1200), 0.55)

pico = np.abs(mix).max()
mix = mix / pico * 0.8
out = mix[: int(TOTAL / FPS * SR)]

def gravar(nome, x):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s24le", os.path.join(AQUI, nome)], stdin=subprocess.PIPE)
    p.communicate(x.astype(np.float32).tobytes())

gravar("sfx.wav", out)
# leito de ambiência (ocupa o lugar da trilha; troque por uma música quando quiser)
n = len(out)
amb = np.stack([lp(rng.standard_normal(n), 0.03), lp(rng.standard_normal(n), 0.03)], 1)
amb = amb - np.stack([lp(amb[:, 0], 0.002), lp(amb[:, 1], 0.002)], 1)
amb *= (0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * np.arange(n) / SR))[:, None]
gravar("ambiente.wav", amb / np.abs(amb).max() * 0.5)
print("sfx.wav e ambiente.wav gerados:", round(n / SR, 2), "s")
