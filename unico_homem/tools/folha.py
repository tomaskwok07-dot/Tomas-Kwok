"""Junta quadros avulsos numa folha de contato:  python tools/folha.py saida.jpg q1.jpg q2.jpg ... [--cols 7]"""
import sys
from PIL import Image
a = sys.argv[1:]
cols = 7
if '--cols' in a:
    i = a.index('--cols'); cols = int(a[i + 1]); del a[i:i + 2]
out, fs = a[0], a[1:]
ims = [Image.open(f).convert('RGB') for f in fs]
w = 270; h = 480
rows = (len(ims) + cols - 1) // cols
s = Image.new('RGB', (cols * w, rows * h))
for i, im in enumerate(ims):
    s.paste(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
s.save(out, quality=85)
