"""
Projeto de demonstração: monta 6 s de vídeo com dois cenários de blocos, um personagem
de teste, a decupagem e as legendas de exemplo. Serve para ver o pipeline funcionando.

    python exemplo/gerar_personagem_teste.py demo/personagens/ze
    blender -b -P exemplo/demo_projeto.py -- demo/            (cria demo/demo.blend)
    blender -b demo/demo.blend -P blender/build.py -- montar \
        --decupagem templates/decupagem_modelo.csv --palavras exemplo/palavras_exemplo.json \
        --narracao demo/voz_teste.wav --saida //render/demo.mp4 --render
"""
import os
import sys

import bpy

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "blender"))
import shorts_lib as S  # noqa: E402

pasta = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "demo"
pasta = os.path.abspath(pasta)
bpy.ops.wm.read_factory_settings(use_empty=True)

def bloco(sc, nome, loc, dim, cor):
    me = bpy.data.meshes.new(nome)
    x, y, z = [d / 2 for d in dim]
    v = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z), (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
    f = [(0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    me.from_pydata(v, [], f)
    me.materials.append(S.material_toon(nome + "_m", cor))
    o = bpy.data.objects.new(nome, me)
    o.location = loc
    sc.collection.objects.link(o)
    return o

# cenário 1: interior de mina (âmbar), com lampião
mina = S.criar_cenario("mina", "ambar", interior=True, total_quadros=220)
bloco(mina, "chao_mina", (0, 2, -0.05), (20, 20, 0.1), "#8A5A2B")
bloco(mina, "parede_mina", (0, 5, 2), (20, 0.5, 4), "#B07A3E")
bloco(mina, "barril", (-1.6, 1.5, 0.5), (0.8, 0.8, 1.0), "#6E3B1E")
lamp = S.luz_pratica(mina, "lampiao", (1.5, 2.5, 2.2))
S.mudar_luz(lamp, 70, 40, 300)
S.criar_personagem("ze", os.path.join(pasta, "personagens", "ze"), mina, 1.7, (0, 1.5, 0.85))
ze = bpy.data.objects["ze"]
S.expressao(ze, 0, olhos="neutro", boca="convencido")
S.expressao(ze, 60, olhos="arregalado", boca="dentes")

# cenário 2: rua de dia (verde)
rua = S.criar_cenario("rua", "verde", total_quadros=220)
bloco(rua, "chao_rua", (0, 0, -0.05), (40, 40, 0.1), "#C9A46A")
for i, c in enumerate(["#A4482E", "#3A6EA5", "#E0B84A"]):
    bloco(rua, f"casa_{i}", (-4 + i * 4, 6, 1.5), (3, 3, 3), c)

os.makedirs(pasta, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(pasta, "demo.blend"))
print("salvo", os.path.join(pasta, "demo.blend"))
