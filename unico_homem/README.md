# O único homem da cidade — remake premium

Short 1080×1920, 30 fps, ~63,5 s, feito com **Remotion + three.js** (`@remotion/three`) no estilo do pacote
`shorts_estilo` (personagens 2D recortados em cenários 3D low-poly, legendas queimadas, narração PT-BR).
As ferramentas Python do pacote (`checar_roteiro.py`, `mixar_audio.py`, `qc_medir.py`, `style_config.py`) continuam em uso;
a parte de Blender (`blender/`) não é usada neste projeto.

## Arquivos

| arquivo | o que é |
| --- | --- |
| `roteiro.txt` | roteiro novo (abertura com a multidão, sem o carro, final do beijo) |
| `decupagem.csv` | 21 planos com tipo de transição de cada troca (gerado de `src/dados/planos.json`) |
| `audio/gerar_voz.py` | narração na voz **Will** (ElevenLabs, `eleven_multilingual_v2`) + tempo de cada palavra |
| `audio/montar_voz.py` | aperta pausas, acelera 1,10× e abre o espaço da fala "ME DÁ UM BEIJO!" |
| `audio/sfx.py` | efeitos sonoros sintetizados por código + leito de ambiência (no lugar da trilha) |
| `audio/mixar.sh` | mixagem −14 LUFS / −1 dBTP e curva de dinâmica (LRA 2–3 LU) |
| `src/kit.tsx` | personagens, objetos, luz de 3 pontos, corações, brilhos |
| `src/cenas/` | uma cena por plano (câmera por quadros-chave com ease) |
| `src/Video.tsx` | linha do tempo, transições (wipe por personagem, zoom-through, whip pan, match, íris), impacto, vinheta |
| `src/Legendas.tsx` | legendas com pop, palavra-chave em cor e emojis |
| `tools/` | quadros de teste, folha de contato, exportar decupagem, render final |

## Refazer do zero

```bash
npm install
python ../shorts_estilo/tools/checar_roteiro.py roteiro.txt
python audio/gerar_voz.py && python audio/gerar_voz.py beijo   # precisa de acesso à API do ElevenLabs
python audio/montar_voz.py && python audio/sfx.py && sh audio/mixar.sh
python tools/exportar_decupagem.py
node tools/quadros.mjs 78 588 1768 --scale=1                    # quadros de teste em out/q/
sh tools/render_final.sh                                        # out/O_unico_homem_da_cidade_premium.mp4 + QC
```

Para pôr uma trilha musical, troque `audio/ambiente.wav` pela música em `audio/mixar.sh` (`--trilha`).
O render usa WebGL por software (`swangle`); ajuste o caminho do navegador em `remotion.config.ts` se precisar.
