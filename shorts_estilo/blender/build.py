"""
Linha de comando do pacote no Blender. Rode sempre com:
    blender -b SEU_PROJETO.blend -P blender/build.py -- <comando> [opções]

Comandos
  projeto      configura a cena atual (1080x1920, 30 fps, Eevee, AgX, bloom, motion blur)
  cenario      cria uma cena de cenário com luz e névoa da paleta
                 --nome mina --paleta ambar [--interior]
  personagem   monta um personagem recortado a partir de PNGs
                 --nome ze --pasta personagens/ze --cenario mina --local 0,0,0 [--altura 1.7]
  montar       cria câmeras por plano, cena EDICAO com fusões, legendas e narração
                 --decupagem decupagem.csv [--palavras palavras.json] [--narracao voz.wav]
                 [--fonte Montserrat-Black.ttf] [--saida render/video.mp4] [--render]
Todos os comandos salvam o .blend no fim (use --nao-salvar para testar).
"""
import argparse
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shorts_lib as S  # noqa: E402


def main(argv):
    p = argparse.ArgumentParser(prog="build.py")
    p.add_argument("--nao-salvar", action="store_true")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("projeto")
    c = sub.add_parser("cenario")
    c.add_argument("--nome", required=True)
    c.add_argument("--paleta", default="ambar", choices=sorted(S.C.PALETAS))
    c.add_argument("--interior", action="store_true")
    c.add_argument("--quadros", type=int, default=2000)
    pe = sub.add_parser("personagem")
    pe.add_argument("--nome", required=True)
    pe.add_argument("--pasta", required=True)
    pe.add_argument("--cenario", required=True)
    pe.add_argument("--local", default="0,0,0")
    pe.add_argument("--altura", type=float, default=1.7)
    m = sub.add_parser("montar")
    m.add_argument("--decupagem", required=True)
    m.add_argument("--palavras")
    m.add_argument("--narracao")
    m.add_argument("--fonte")
    m.add_argument("--saida", default="//render/video.mp4")
    m.add_argument("--render", action="store_true")
    a = p.parse_args(argv)

    if a.cmd == "projeto":
        S.configurar_cena(bpy.context.scene)
    elif a.cmd == "cenario":
        S.criar_cenario(a.nome, a.paleta, a.interior, total_quadros=a.quadros)
    elif a.cmd == "personagem":
        sc = bpy.data.scenes[a.cenario]
        S.criar_personagem(a.nome, a.pasta, sc, a.altura, tuple(float(x) for x in a.local.split(",")))
    elif a.cmd == "montar":
        ed = S.montar(a.decupagem)
        if a.palavras:
            S.legendas(ed, a.palavras, a.fonte)
        if a.narracao:
            S.narracao(ed, a.narracao)
        S.configurar_saida(ed, a.saida)
        if a.render:
            _render(ed)
    if not a.nao_salvar and bpy.data.filepath:
        bpy.ops.wm.save_mainfile()
    elif not a.nao_salvar:
        print("[aviso] arquivo .blend sem nome; abra um projeto salvo para gravar as mudanças")


def _render(scene):
    win = bpy.context.window
    if win:
        win.scene = scene
        bpy.ops.render.render(animation=True)
    else:
        with bpy.context.temp_override(scene=scene):
            bpy.ops.render.render(animation=True, scene=scene.name)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    main(argv)
