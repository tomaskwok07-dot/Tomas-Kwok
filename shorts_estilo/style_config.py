"""
Bíblia de estilo dos Shorts animados, em forma de configuração.

Todos os scripts deste pacote leem os valores daqui. Cada valor tem a origem:
  # M = medido nos 20 vídeos de referência (convertido para 1080x1920 quando em pixel)
  # R = recomendado (escolha para chegar ao mesmo resultado)
Mude os valores R à vontade; os M são o alvo do estilo.
"""

ESCALA_720_PARA_1080 = 1.5

# ---------------------------------------------------------------- 1. Entrega
ENTREGA = {
    "largura": 1080,                 # R (originais: 720)
    "altura": 1920,                  # R (originais: 1280)
    "fps": 30,                       # M
    "duracao_s": (55, 65),           # R (originais 41–78 s, mediana 63)  M
    "codec": "H.264 High",           # R
    "bitrate_mbps": (10, 16),        # R
    "audio_hz": 48000,               # R
    "audio_kbps": 192,               # R
    "lufs_integrado": -14.0,         # M
    "lufs_tolerancia": 0.5,          # R
    "lra_lu": (1.7, 3.2),            # M
    "true_peak_dbtp": -1.0,          # R
    "silencio_max_s": 0.25,          # M: nenhum trecho abaixo de -35 dB por 0,25 s ou mais
    "silencio_limiar_db": -35,       # M
    "quadros_apos_ultima_palavra": 5,  # R
    "fade_para_preto": False,        # M: nunca usado
}

ZONAS_SEGURAS_PX = {                 # R (interface do Shorts)
    "topo": 220,
    "base": 380,
    "direita": 120,
}

# ---------------------------------------------------------------- 2. Roteiro
ROTEIRO = {
    "palavras_total": (190, 220),            # R para PT-BR (originais EN: 175–480, mediana ~300)  M
    "palavras_por_minuto_en": (230, 280),    # M
    "palavras_por_segundo_pt": 3.5,          # R
    "palavras_por_frase": (6, 15),           # R
    "numeros_concretos_min": 3,              # R
    "falas_citadas_max": 3,                  # R
    "batidas": [                             # tempos R para 60 s
        {"nome": "gancho",       "inicio_s": 0,  "fim_s": 3,  "palavras": (10, 15), "frases": (1, 1)},
        {"nome": "contexto",     "inicio_s": 3,  "fim_s": 15, "palavras": (40, 50), "frases": (4, 5)},
        {"nome": "desconfianca", "inicio_s": 15, "fim_s": 35, "palavras": (60, 70), "frases": (6, 8)},
        {"nome": "prova",        "inicio_s": 35, "fim_s": 52, "palavras": (50, 60), "frases": (5, 6)},
        {"nome": "virada",       "inicio_s": 52, "fim_s": 60, "palavras": (20, 25), "frases": (1, 2)},
    ],
    "variantes": {
        "A": "explicação antes de 20% do texto (9 de 20 originais)",   # M
        "B": "explicação depois de 60% do texto (8 de 20 originais)",  # M
    },
    "conectores": ["Sabe por quê?", "É que", "Mas", "Então", "Até que", "E foi assim que", "Só que"],  # R
    "proibido": ["olá", "neste vídeo", "se inscreva", "inscreva-se", "deixa o like", "comenta aí",
                 "até a próxima", "fala galera"],  # R
    "titulo_palavras": (4, 9),   # M
    "titulo_formulas": [
        "Como [objeto] [fez algo grande]",
        "Por que [grupo] [faz algo estranho]",
        "O/A [coisa] que [fez algo]",
        "Este/Esta [coisa] [fez algo]",
    ],
}

# ---------------------------------------------------------------- 3. Áudio
AUDIO = {
    "voz_passa_alta_hz": 80,             # R
    "voz_compressor": {"ratio": 3, "attack_ms": 5, "release_ms": 80, "threshold_db": -20},  # R
    "voz_pico_dbfs": -6,                 # R
    "trilha_abaixo_da_voz_db": (18, 22), # R
    "sfx_abaixo_da_voz_db": (6, 10),     # R
    "ducking": {"ratio": 4, "threshold": 0.05, "attack_ms": 20, "release_ms": 300},  # R
    "voz_sintetica": {"estabilidade": 0.5, "estilo": 0.15, "velocidade": (1.10, 1.15)},  # R
    "pausa_entre_frases_max_s": 0.15,    # R
    "pausa_entre_batidas_max_s": 0.25,   # R (M: nenhum silêncio >= 0,25 s)
}

# ---------------------------------------------------------------- 4. Personagens (estimado nos quadros: R)
PERSONAGEM = {
    "cabeca_cor": "#F7F5F0",
    "contorno_cor": "#111111",
    "cabeca_fracao_altura": (0.35, 0.40),
    "contorno_fracao_cabeca": 0.025,
    "corpo_altura_x_cabeca": 1.2,
    "corpo_saturacao": (0.5, 0.7),
    "bocas": ["neutra", "sorriso", "sorriso_aberto", "convencido", "surpresa", "dentes", "fala_a", "fala_o"],
    "olhos": ["neutro", "feliz", "entediado", "arregalado", "bravo", "preocupado"],
    "troca_boca_fala_quadros": (3, 4),
    "poses_chave_a_cada_quadros": (6, 12),
    "respiracao_escala": 0.015,
    "respiracao_periodo_s": 1.5,
    "por_video": (2, 4),
    "max_por_plano": 3,
    "movimento_interno_px_q": 3.7,       # M (mediana, descontada a câmera)
}

# ---------------------------------------------------------------- 5. Imagem final (M) e luz (R)
IMAGEM_ALVO = {                          # M: média e faixa por vídeo
    "brilho_medio":      {"alvo": 115, "faixa": (92, 139)},
    "contraste_rms":     {"alvo": 52,  "faixa": (46, 64)},
    "faixa_dinamica":    {"alvo": 166, "faixa": (148, 191)},
    "saturacao_media":   {"alvo": 0.47, "faixa": (0.38, 0.65)},
    "saturacao_p90":     {"alvo": 0.76, "faixa": (0.63, 0.90)},
    "sombras_pct":       {"alvo": 13,  "faixa": (2, 29)},      # Y' < 40
    "altas_luzes_pct":   {"alvo": 8,   "faixa": (4, 19)},      # Y' > 215
    "preto_esmagado_pct": {"alvo": 0.5, "faixa": (0.2, 2.3)},  # Y' <= 5
    "branco_estourado_pct": {"alvo": 0.9, "faixa": (0.3, 3.7)},  # Y' >= 250
    "brilho_dp_entre_quadros": {"alvo": 31, "faixa": (18, 40)},
}

PALETAS = {                              # R: cor dominante por cenário (~50–60% da imagem)
    "ambar":   {"dominante": "#C98A3A", "ceu": "#F2C98A", "temp_k": 3400},
    "rosa":    {"dominante": "#E58FB5", "ceu": "#F7D3E3", "temp_k": 4500},
    "azul":    {"dominante": "#23336E", "ceu": "#3A55B0", "temp_k": 6500},
    "verde":   {"dominante": "#5E9E3A", "ceu": "#9FD0F0", "temp_k": 4200},
    "tijolo":  {"dominante": "#A4482E", "ceu": "#F0B080", "temp_k": 3600},
}

LUZ = {                                  # R
    "principal_temp_k": (3200, 4500),
    "principal_elevacao_graus": (30, 45),
    "principal_forca_sol": 3.0,
    "preenchimento_fracao": (0.2, 0.3),
    "preenchimento_temp_k": 9000,
    "pratica_temp_k": 2700,
    "pratica_por_interior": (1, 3),
    "nevoa_densidade": (0.002, 0.006),   # só interiores: a névoa do mundo no Eevee vai até o céu
    "nevoa_externa": 0.0,                # exteriores: use um cubo de volume local para raios de luz
    "bloom_threshold": (0.8, 1.0),
    "bloom_forca": 0.35,
    "dof_fstop": (2.8, 5.6),
    "view_transform": "AgX",
    "look": "Medium High Contrast",
    "rugosidade": (0.5, 0.8),
}

# ---------------------------------------------------------------- 6. Câmera
CAMERA = {
    "tempo_parada_pct": 27,              # M
    "tempo_em_movimento_pct": 73,        # M
    "estados_pct": {"zoom_in": 32, "parada": 27, "pan": 18, "tilt": 13, "zoom_out": 11},  # M
    "planos_com": {"zoom_in": 52, "pan": 35, "tilt": 21, "roll_3graus": 27, "estatico": 22},  # M
    "aproximacao_pct_por_quadro": 0.33,  # M (≈ 10% por segundo)
    "aproximacao_pico_pct_por_quadro": 2.3,  # M
    "dolly_por_plano_pct": (10, 30),     # R
    "pan_px_por_quadro": 3.2,            # M (mediana)
    "pan_pico_px_por_quadro": 20,        # M
    "chicote_px_por_quadro": (15, 38),   # M
    "chicote_quadros": (6, 10),          # R
    "roll_graus": (2, 5),                # R
    "tremor_quadros": (6, 13),           # M
    "tremor_pico_px": 20,                # M (mediana; faixa 11–48)
    "tremor_fora_impacto_px_p95": 3.4,   # M
    "movimento_minimo_fracao_plano": 0.5,  # M: 81% dos planos se movem por mais da metade do tempo
    "lente_mm": {"aberto": (24, 28), "medio": (35, 50), "close": (50, 70)},  # R
    "sensor_mm": 36,                     # R
    "plano_longo_s_dois_movimentos": 4,  # R
}

# ---------------------------------------------------------------- 7. Edição
EDICAO = {
    "plano_mediana_s": 2.7,              # M
    "plano_p10_s": 1.0,                  # M
    "plano_p25_p75_s": (1.7, 4.8),       # M
    "plano_p90_s": 6.7,                  # M
    "plano_max_s": 7.0,                  # R
    "primeiro_plano_mediana_s": 2.4,     # M
    "trocas_por_minuto": (9, 22),        # M (mediana 17)
    "planos_alvo_60s": (18, 22),         # R
    "fusao_quadros": (6, 11),            # M (mediana 9)
    "fusao_padrao_quadros": 9,           # M
    "wipe_quadros": (4, 8),              # R
    "atravessar_quadros": (5, 10),       # R
    "mudanca_luz_quadros": (15, 30),     # R
    "corte_seco_pct": 6,                 # M
    "cortes_secos_max_por_video": 3,     # R
    "tolerancia_corte_quadros": 3,       # R
    "alcas_render_quadros": 15,          # R: quadros extras em cada ponta do plano
}

# ---------------------------------------------------------------- 8. Legendas
LEGENDA = {
    "centro_y_px": 1351,                 # M (70,4% da altura)
    "centro_y_fracao": 0.7036,           # M
    "altura_maiuscula_px": 54,           # M
    "altura_minuscula_px": 40,           # M
    "corpo_fonte_px": 78,                # M (estimado da altura das letras)
    "largura_mediana_px": 250,           # M
    "largura_max_px": 510,               # M (p90)
    "fontes": ["Montserrat Black", "Poppins ExtraBold", "Nunito Black"],  # R (estimado)
    "cor": "#FFFFFF",                    # M
    "contorno_cor": "#000000",           # M
    "contorno_px": 5.5,                  # R (estimado: 5–6)
    "sombra_opacidade": 0.5,             # R
    "sombra_offset_px": 4,               # R
    "sombra_desfoque_px": 6,             # R
    "palavras_por_bloco": (1, 3),        # M
    "caracteres_max_bloco": 18,          # R
    "troca_mediana_s": 0.3,              # M
    "faixa_livre_y_px": (1260, 1440),    # R
    "palavras_curtas_juntam": ["a", "o", "as", "os", "e", "é", "de", "do", "da", "dos", "das", "em", "no", "na",
                               "nos", "nas", "um", "uma", "ao", "à", "que", "se", "por", "pra", "com", "sem", "seu", "sua"],
}

# ---------------------------------------------------------------- 9. Efeitos
EFEITOS = {                              # M (contagens nos 20 vídeos e amplitudes)
    "mudanca_luz": {"por_video": 8, "brilho_delta": (26, 59), "quadros": (13, 31)},
    "borrao": {"por_video": (2, 3), "fluxo_min_px_q": 9, "shutter": 0.5},
    "tremor": {"por_video": (1, 2), "quadros": (6, 13), "pico_px": 20},
    "flash": {"por_video": (0, 1), "brilho_delta": (20, 53), "subida_quadros": 2, "descida_quadros": (4, 11),
              "energia_w": 3000},
    "tela_preta": {"por_video": 0},
}

# ---------------------------------------------------------------- 11. QC: faixas dos 20 originais (M)
QC = {
    # Alvos "premium" (remake de "O único homem da cidade"): substituem as faixas medidas nos 20 originais.
    # Faixas antigas entre parênteses.
    "duracao_s": (55, 65),                 # (40, 78)
    "planos_por_minuto": (18, 22),         # (9, 22)
    "plano_medio_s": (2.7, 5.9),
    "cortes_secos_fracao": (0.0, 0.45),
    "transicao_media_quadros": (4, 12),
    "brilho_medio": (110, 120),            # (92, 139)
    "contraste_rms": (60, 64),             # (46, 64)
    "saturacao_media": (0.52, 0.58),       # (0.38, 0.65)
    "sombras_pct": (12, 18),               # novo: pixels com Y' < 40
    "branco_estourado_pct": (0.3, 3.7),
    "camera_parada_pct": (0, 48),          # (14, 48): a câmera agora nunca para
    "camera_vel_px_q_1080": (2.8, 4.0),    # (1.9, 5.7)
    "lufs": (-15.2, -13.5),
    "lra": (2.0, 3.0),                     # (1.5, 3.5)
    "silencios": (0, 0),
}
