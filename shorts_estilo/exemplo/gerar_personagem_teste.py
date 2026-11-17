"""Gera PNGs de um personagem de teste no estilo (cabeça redonda, corpo cápsula, membros de palito).
Use só para testar o pipeline; troque pelos desenhos do seu elenco."""
import os, sys
from PIL import Image, ImageDraw

def gerar(pasta, cor_corpo=(46, 140, 120)):
    os.makedirs(pasta, exist_ok=True)
    W, H = 512, 1024
    preto, branco = (17, 17, 17, 255), (247, 245, 240, 255)
    lw = 10
    def tela(): return Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # corpo + membros
    im = tela(); d = ImageDraw.Draw(im)
    d.line([(200, 760), (180, 1000)], fill=preto, width=lw); d.line([(312, 760), (332, 1000)], fill=preto, width=lw)
    d.line([(150, 520), (90, 720)], fill=preto, width=lw); d.line([(362, 520), (422, 720)], fill=preto, width=lw)
    d.rounded_rectangle([150, 440, 362, 790], radius=100, fill=cor_corpo + (255,), outline=preto, width=lw)
    im.save(f"{pasta}/corpo.png")
    # cabeça (≈38% da altura)
    im = tela(); d = ImageDraw.Draw(im)
    d.ellipse([86, 40, 426, 380], fill=branco, outline=preto, width=lw)
    im.save(f"{pasta}/cabeca.png")
    # olhos
    olhos = {
        "neutro": lambda d: [d.ellipse([186, 170, 210, 200], fill=preto), d.ellipse([302, 170, 326, 200], fill=preto)],
        "feliz": lambda d: [d.arc([176, 170, 220, 210], 200, 340, fill=preto, width=8), d.arc([292, 170, 336, 210], 200, 340, fill=preto, width=8)],
        "entediado": lambda d: [d.line([(180, 190), (216, 190)], fill=preto, width=8), d.line([(296, 190), (332, 190)], fill=preto, width=8)],
        "arregalado": lambda d: [d.ellipse([176, 160, 220, 210], outline=preto, width=6), d.ellipse([292, 160, 336, 210], outline=preto, width=6)],
        "bravo": lambda d: [d.ellipse([186, 175, 210, 200], fill=preto), d.ellipse([302, 175, 326, 200], fill=preto), d.line([(176, 150), (222, 168)], fill=preto, width=9), d.line([(336, 150), (290, 168)], fill=preto, width=9)],
        "preocupado": lambda d: [d.ellipse([186, 175, 210, 200], fill=preto), d.ellipse([302, 175, 326, 200], fill=preto), d.line([(176, 168), (222, 150)], fill=preto, width=9), d.line([(336, 168), (290, 150)], fill=preto, width=9)],
    }
    for k, f in olhos.items():
        im = tela(); f(ImageDraw.Draw(im)); im.save(f"{pasta}/olhos_{k}.png")
    bocas = {
        "neutra": lambda d: d.line([(226, 280), (286, 280)], fill=preto, width=8),
        "sorriso": lambda d: d.arc([216, 240, 296, 300], 20, 160, fill=preto, width=8),
        "sorriso_aberto": lambda d: d.chord([216, 250, 296, 320], 0, 180, fill=preto),
        "convencido": lambda d: d.line([(226, 285), (290, 270)], fill=preto, width=8),
        "surpresa": lambda d: d.ellipse([240, 260, 272, 300], outline=preto, width=7),
        "dentes": lambda d: [d.rectangle([220, 265, 292, 295], fill=branco, outline=preto, width=6)],
        "fala_a": lambda d: d.ellipse([232, 262, 280, 302], fill=preto),
        "fala_o": lambda d: d.ellipse([244, 266, 268, 296], fill=preto),
    }
    for k, f in bocas.items():
        im = tela(); f(ImageDraw.Draw(im)); im.save(f"{pasta}/boca_{k}.png")
    # acessório: chapéu
    im = tela(); d = ImageDraw.Draw(im)
    d.rectangle([150, 70, 362, 100], fill=preto); d.rectangle([196, 0, 316, 80], fill=(140, 40, 40, 255), outline=preto, width=lw)
    im.save(f"{pasta}/acessorio.png")

if __name__ == "__main__":
    gerar(sys.argv[1] if len(sys.argv) > 1 else "personagens/teste")
