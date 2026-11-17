"""
Funções do Blender que aplicam a bíblia de estilo (Blender 4.2+ e 5.x).

Uso típico: rode build.py (ele importa este módulo). As funções também podem
ser chamadas no Text Editor do Blender, depois de:
    import sys; sys.path.append(r"C:/caminho/para/shorts_estilo/blender")
    import shorts_lib as S
"""
import csv
import json
import math
import os
import re
import sys

import bpy
from mathutils import Vector, Quaternion, Euler

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQUI))
import style_config as C  # noqa: E402

W, H, FPS = C.ENTREGA["largura"], C.ENTREGA["altura"], C.ENTREGA["fps"]


# =========================================================== utilidades
def hex_rgb(h, alpha=None):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return tuple(lin) + ((alpha,) if alpha is not None else ())


def hex_srgb(h, alpha=1.0):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (alpha,)


def kelvin_rgb(k):
    """Cor aproximada de um corpo negro (Tanner Helland), em RGB linear."""
    t = k / 100.0
    r = 255 if t <= 66 else 329.698727446 * ((t - 60) ** -0.1332047592)
    g = 99.4708025861 * math.log(t) - 161.1195681661 if t <= 66 else 288.1221695283 * ((t - 60) ** -0.0755148492)
    b = 255 if t >= 66 else (0 if t <= 19 else 138.5177312231 * math.log(t - 10) - 305.0447927307)
    srgb = [max(0, min(255, v)) / 255 for v in (r, g, b)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


def strips_of(scene):
    se = scene.sequence_editor or scene.sequence_editor_create()
    return se.strips if hasattr(se, "strips") else se.sequences


def new_effect(col, name, kind, channel, start, end, a=None, b=None):
    """new_effect com assinatura de 4.x (frame_end, seq1/seq2) ou 5.x (length, input1/input2)."""
    try:
        return col.new_effect(name=name, type=kind, channel=channel, frame_start=start,
                              length=end - start, input1=a, input2=b)
    except TypeError:
        kw = dict(name=name, type=kind, channel=channel, frame_start=start, frame_end=end)
        if a is not None:
            kw["seq1"] = a
        if b is not None:
            kw["seq2"] = b
        return col.new_effect(**kw)


def frame_width_m(cam_obj, distance):
    """Largura do quadro (em metros) a uma distância da câmera."""
    cam = cam_obj.data
    sensor = cam.sensor_width if cam.sensor_fit != "VERTICAL" else cam.sensor_height * W / H
    return 2 * distance * math.tan(math.atan(sensor / 2 / cam.lens))


def px_to_m(cam_obj, distance, px):
    return px / W * frame_width_m(cam_obj, distance)


def look_quat(eye, target, roll_deg=0.0):
    d = (Vector(target) - Vector(eye)).normalized()
    q = d.to_track_quat("-Z", "Y")
    if roll_deg:
        q = q @ Quaternion((0, 0, 1), math.radians(roll_deg))
    return q


# =========================================================== 1. projeto
def configurar_cena(scene, eevee=True):
    r = scene.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = W, H, 100
    r.fps, r.fps_base = FPS, 1.0
    if eevee:
        for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
            try:
                r.engine = eng
                break
            except TypeError:
                pass
        ev = scene.eevee
        for k, v in (("taa_render_samples", 64), ("use_raytracing", True), ("use_shadows", True),
                     ("use_volumetric_shadows", True), ("volumetric_tile_size", "8")):
            if hasattr(ev, k):
                try:
                    setattr(ev, k, v)
                except Exception:
                    pass
    # borrão de movimento (chicotes e objetos rápidos)
    if hasattr(r, "use_motion_blur"):
        r.use_motion_blur = True
        r.motion_blur_shutter = C.EFEITOS["borrao"]["shutter"]
    elif hasattr(scene.eevee, "use_motion_blur"):
        scene.eevee.use_motion_blur = True
        scene.eevee.motion_blur_shutter = C.EFEITOS["borrao"]["shutter"]
    # gestão de cor: AgX + Medium High Contrast
    vs = scene.view_settings
    try:
        vs.view_transform = C.LUZ["view_transform"]
        looks = [e.identifier for e in vs.bl_rna.properties["look"].enum_items]
        alvo = next((l for l in looks if C.LUZ["look"] in l), None)
        if alvo:
            vs.look = alvo
    except TypeError:
        print("[aviso] AgX não disponível nesta instalação; mantendo", vs.view_transform)
    configurar_bloom(scene)


def configurar_bloom(scene):
    """Bloom pelo compositor (Eevee 4.2+ não tem mais bloom na cena)."""
    thr = C.LUZ["bloom_threshold"][0]
    forca = C.LUZ["bloom_forca"]
    try:
        if hasattr(scene, "compositing_node_group"):          # Blender 5.x
            ng = bpy.data.node_groups.new(scene.name + "_comp", "CompositorNodeTree")
            ng.interface.new_socket("Image", in_out="INPUT", socket_type="NodeSocketColor")
            ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
            gi, go = ng.nodes.new("NodeGroupInput"), ng.nodes.new("NodeGroupOutput")
            gl = ng.nodes.new("CompositorNodeGlare")
            gl.inputs["Type"].default_value = "Bloom"
            gl.inputs["Threshold"].default_value = thr
            gl.inputs["Strength"].default_value = forca
            ng.links.new(gi.outputs[0], gl.inputs["Image"])
            ng.links.new(gl.outputs[0], go.inputs[0])
            scene.compositing_node_group = ng
        else:                                                 # Blender 4.x
            scene.use_nodes = True
            nt = scene.node_tree
            rl = next((n for n in nt.nodes if n.bl_idname == "CompositorNodeRLayers"), None) or nt.nodes.new("CompositorNodeRLayers")
            co = next((n for n in nt.nodes if n.bl_idname == "CompositorNodeComposite"), None) or nt.nodes.new("CompositorNodeComposite")
            gl = nt.nodes.new("CompositorNodeGlare")
            gl.glare_type = "BLOOM" if "BLOOM" in [e.identifier for e in gl.bl_rna.properties["glare_type"].enum_items] else "FOG_GLOW"
            gl.threshold = thr
            if hasattr(gl, "strength"):
                gl.strength = forca
            nt.links.new(rl.outputs["Image"], gl.inputs["Image"])
            nt.links.new(gl.outputs["Image"], co.inputs["Image"])
    except Exception as e:  # o bloom é estético; não deve travar o build
        print("[aviso] bloom não configurado:", e)


# =========================================================== 5. cenário e luz
def criar_cenario(nome, paleta="ambar", interior=False, nevoa=None, total_quadros=1800):
    """Cria uma cena por cenário, com luz principal quente, preenchimento azulado e névoa."""
    P = C.PALETAS[paleta]
    sc = bpy.data.scenes.get(nome) or bpy.data.scenes.new(nome)
    sc.frame_start, sc.frame_end = 0, total_quadros
    configurar_cena(sc)
    # mundo: céu na cor da paleta + névoa volumétrica leve
    world = bpy.data.worlds.new(nome + "_mundo")
    sc.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = hex_rgb(P["ceu"], 1.0)
    bg.inputs["Strength"].default_value = 0.6
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(bg.outputs[0], out.inputs["Surface"])
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = nevoa if nevoa is not None else (
        C.LUZ["nevoa_densidade"][0] if interior else C.LUZ["nevoa_externa"])
    vol.inputs["Color"].default_value = hex_rgb(P["ceu"], 1.0)
    nt.links.new(vol.outputs[0], out.inputs["Volume"])
    # luzes
    col = bpy.data.collections.new(nome + "_luz")
    sc.collection.children.link(col)
    temp = P["temp_k"]
    sol = bpy.data.lights.new(nome + "_principal", "SUN")
    sol.energy = C.LUZ["principal_forca_sol"]
    _cor_luz(sol, temp)
    o = bpy.data.objects.new(sol.name, sol)
    o.rotation_euler = Euler((math.radians(90 - C.LUZ["principal_elevacao_graus"][1]), 0, math.radians(150)))
    col.objects.link(o)
    fill = bpy.data.lights.new(nome + "_preenchimento", "SUN")
    fill.energy = C.LUZ["principal_forca_sol"] * C.LUZ["preenchimento_fracao"][0]
    _cor_luz(fill, C.LUZ["preenchimento_temp_k"])
    fill.angle = math.radians(30)
    if hasattr(fill, "use_shadow"):
        fill.use_shadow = False
    of = bpy.data.objects.new(fill.name, fill)
    of.rotation_euler = Euler((math.radians(55), 0, math.radians(-30)))
    col.objects.link(of)
    sc["paleta"] = paleta
    return sc


def _cor_luz(light, kelvin):
    if hasattr(light, "use_temperature"):
        light.use_temperature = True
        light.temperature = kelvin
        light.color = (1, 1, 1)
    else:
        light.color = kelvin_rgb(kelvin)


def luz_pratica(scene, nome, local, energia=150.0, raio=0.1):
    """Lâmpada visível (lampião, vela, janela) a 2700 K."""
    L = bpy.data.lights.new(nome, "POINT")
    L.energy, L.shadow_soft_size = energia, raio
    _cor_luz(L, C.LUZ["pratica_temp_k"])
    o = bpy.data.objects.new(nome, L)
    o.location = local
    scene.collection.objects.link(o)
    return o


def mudar_luz(light_obj, quadro, de, para, quadros=None):
    """Mudança de luz dentro do plano (lâmpada acende, dia vira noite)."""
    q = quadros or C.EFEITOS["mudanca_luz"]["quadros"][1]
    L = light_obj.data
    L.energy = de
    L.keyframe_insert("energy", frame=quadro)
    L.energy = para
    L.keyframe_insert("energy", frame=quadro + q)


def material_toon(nome, hex_cor, rugosidade=None):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = hex_rgb(hex_cor, 1.0)
    b.inputs["Roughness"].default_value = rugosidade if rugosidade is not None else sum(C.LUZ["rugosidade"]) / 2
    b.inputs["Metallic"].default_value = 0.0
    return m


# =========================================================== 4. personagem recortado
def _plano_imagem(nome, caminho, altura_m, scene, parent=None, z=0.0):
    img = bpy.data.images.load(caminho, check_existing=True)
    w, h = img.size
    asp = w / h if h else 1
    me = bpy.data.meshes.new(nome)
    hw, hh = altura_m * asp / 2, altura_m / 2
    me.from_pydata([(-hw, 0, -hh), (hw, 0, -hh), (hw, 0, hh), (-hw, 0, hh)], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new()
    for i, c in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv.data[i].uv = c
    m = bpy.data.materials.new(nome + "_mat")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Closest" if max(w, h) < 256 else "Linear"
    em = nt.nodes.new("ShaderNodeEmission")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tex.outputs["Color"], em.inputs["Color"])
    nt.links.new(tex.outputs["Alpha"], mix.inputs[0])
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    for k, v in (("surface_render_method", "DITHERED"), ("blend_method", "HASHED")):
        if hasattr(m, k):
            try:
                setattr(m, k, v)
            except Exception:
                pass
    me.materials.append(m)
    o = bpy.data.objects.new(nome, me)
    o.location.y = -z  # camadas da frente ficam mais perto da câmera (-Y)
    if parent:
        o.parent = parent
    scene.collection.objects.link(o)
    return o


def criar_personagem(nome, pasta_png, scene, altura_m=1.7, local=(0, 0, 0)):
    """
    Monta um personagem recortado a partir de PNGs com fundo transparente:
      corpo.png, cabeca.png, acessorio.png (opcional),
      olhos_<nome>.png (neutro, feliz, entediado, arregalado, bravo, preocupado),
      boca_<nome>.png  (neutra, sorriso, sorriso_aberto, convencido, surpresa, dentes, fala_a, fala_o)
    Todos os PNGs do mesmo tamanho de tela (ex.: 1024x2048), já posicionados, para empilhar sem ajuste.
    """
    raiz = bpy.data.objects.new(nome, None)
    raiz.location = local
    raiz.empty_display_size = 0.3
    scene.collection.objects.link(raiz)
    raiz["olhos"] = {}
    raiz["bocas"] = {}
    ordem = [("corpo", 0.000), ("cabeca", 0.002), ("acessorio", 0.008)]
    for parte, z in ordem:
        p = os.path.join(pasta_png, parte + ".png")
        if os.path.exists(p):
            _plano_imagem(f"{nome}_{parte}", p, altura_m, scene, raiz, z)
    olhos, bocas = {}, {}
    for f in sorted(os.listdir(pasta_png)):
        m = re.match(r"(olhos|boca)_(.+)\.png$", f)
        if not m:
            continue
        o = _plano_imagem(f"{nome}_{m.group(1)}_{m.group(2)}", os.path.join(pasta_png, f), altura_m, scene, raiz,
                          0.004 if m.group(1) == "olhos" else 0.005)
        (olhos if m.group(1) == "olhos" else bocas)[m.group(2)] = o.name
    raiz["olhos"], raiz["bocas"] = olhos, bocas
    expressao(raiz, 0, olhos="neutro", boca="neutra")
    respiracao(raiz, scene.frame_start, scene.frame_end)
    return raiz


def _mostrar(obj, visivel, quadro):
    obj.hide_render = obj.hide_viewport = not visivel
    obj.keyframe_insert("hide_render", frame=quadro)
    obj.keyframe_insert("hide_viewport", frame=quadro)
    for fc in _fcurves(obj):
        for k in fc.keyframe_points:
            k.interpolation = "CONSTANT"


def _fcurves(obj):
    ad = obj.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    if hasattr(act, "fcurves"):
        try:
            return list(act.fcurves)
        except Exception:
            pass
    out = []  # Blender 4.4+/5.x: actions em camadas
    for layer in getattr(act, "layers", []):
        for strip in layer.strips:
            for bag in getattr(strip, "channelbags", []):
                out.extend(bag.fcurves)
    return out


def expressao(personagem, quadro, olhos=None, boca=None):
    """Troca seca de olhos e/ou boca no quadro dado (sem interpolação)."""
    for grupo, alvo in (("olhos", olhos), ("bocas", boca)):
        if alvo is None:
            continue
        for k, nome in dict(personagem[grupo]).items():
            ob = bpy.data.objects.get(nome)
            if ob:
                _mostrar(ob, k == alvo, quadro)


def falar(personagem, inicio, fim, boca_final="neutra"):
    """Alterna fala_a/fala_o a cada 3–4 quadros durante uma fala citada."""
    passo = C.PERSONAGEM["troca_boca_fala_quadros"][0]
    f, i = inicio, 0
    while f < fim:
        expressao(personagem, f, boca="fala_a" if i % 2 == 0 else "fala_o")
        f += passo + (i % 2)
        i += 1
    expressao(personagem, fim, boca=boca_final)


def respiracao(obj, inicio, fim):
    amp = C.PERSONAGEM["respiracao_escala"]
    per = int(C.PERSONAGEM["respiracao_periodo_s"] * FPS)
    f = inicio
    while f <= fim:
        obj.scale = (1, 1, 1)
        obj.keyframe_insert("scale", frame=f)
        obj.scale = (1, 1, 1 + amp)
        obj.keyframe_insert("scale", frame=f + per // 2)
        f += per


# =========================================================== 6. câmera
def _lente_para(tipo):
    a, b = C.CAMERA["lente_mm"][tipo]
    return (a + b) / 2


def camera_plano(scene, nome, alvo, inicio, fim, tipo="medio", distancia=4.0, altura=1.4, azimute=0.0,
                 dolly_pct=None, pan_pct=0.0, tilt_pct=0.0, roll_graus=0.0, lente=None, alcas=None):
    """
    Uma câmera por plano, já em movimento na entrada e assentando no fim.
      alvo: objeto ou (x, y, z)
      dolly_pct: aumento de escala no plano todo (padrão 20%, faixa 10–30)
      pan_pct / tilt_pct: deslocamento lateral / vertical em % da largura do quadro no alvo
      roll_graus: giro no eixo da lente ao longo do plano (2–5)
    """
    al = alcas if alcas is not None else C.EDICAO["alcas_render_quadros"]
    t = Vector(alvo.matrix_world.translation if hasattr(alvo, "matrix_world") else alvo)
    t.z += 0 if not hasattr(alvo, "matrix_world") else 1.2
    cam = bpy.data.cameras.new(nome)
    cam.lens = lente or _lente_para(tipo)
    cam.sensor_fit = "VERTICAL"
    cam.sensor_height = C.CAMERA["sensor_mm"]
    cam.dof.use_dof = True
    cam.dof.aperture_fstop = C.LUZ["dof_fstop"][1]
    cam.dof.focus_distance = distancia
    ob = bpy.data.objects.new(nome, cam)
    scene.collection.objects.link(ob)
    ob.rotation_mode = "QUATERNION"

    dolly = (dolly_pct if dolly_pct is not None else sum(C.CAMERA["dolly_por_plano_pct"]) / 2) / 100
    az = math.radians(azimute)
    dirv = Vector((math.sin(az), -math.cos(az), 0))
    fw = frame_width_m(ob, distancia)
    lateral = Vector((math.cos(az), math.sin(az), 0)) * (pan_pct / 100 * fw)
    vertical = Vector((0, 0, tilt_pct / 100 * fw * H / W))

    def pose(frac):
        d = distancia / (1 + dolly * frac)
        eye = t + dirv * d + Vector((0, 0, altura - 1.2)) + lateral * (frac - 0.5) + vertical * (frac - 0.5)
        tgt = t + lateral * (frac - 0.5) + vertical * (frac - 0.5)
        return eye, look_quat(eye, tgt, roll_graus * frac), d

    # chaves nas alças: o plano visível já começa em movimento e assenta no fim
    f0, f1 = inicio - al, fim + al
    span = max(1, f1 - f0)
    for f, frac in ((f0, 0.0), (f1, 1.0)):
        eye, q, d = pose(frac)
        ob.location, ob.rotation_quaternion = eye, q
        cam.dof.focus_distance = d
        ob.keyframe_insert("location", frame=f)
        ob.keyframe_insert("rotation_quaternion", frame=f)
        cam.keyframe_insert("dof.focus_distance", frame=f)
    for fc in _fcurves(ob):
        for k in fc.keyframe_points:
            k.interpolation = "SINE"
            k.easing = "EASE_OUT"
    ob["plano"] = {"inicio": inicio, "fim": fim, "alvo": list(t), "distancia": distancia}
    return ob


def tremor(cam_obj, quadro, quadros=None, pico_px=None):
    """Tremor só no impacto: ruído na posição, decaindo até zero."""
    q = quadros or C.CAMERA["tremor_quadros"][0] + 2
    px = pico_px or C.CAMERA["tremor_pico_px"]
    d = cam_obj["plano"]["distancia"] if "plano" in cam_obj else 4.0
    amp = px_to_m(cam_obj, d, px)
    for fc in _fcurves(cam_obj):
        if fc.data_path != "location" or fc.array_index == 1:
            continue
        mod = fc.modifiers.new("NOISE")
        mod.scale, mod.strength, mod.phase = 1.5, amp * 2, 7 * (fc.array_index + 1) + quadro
        mod.use_restricted_range = True
        mod.frame_start, mod.frame_end = quadro, quadro + q
        mod.blend_in, mod.blend_out = 1, q - 2


def chicote(cam_obj, quadro_fim, lado=1, quadros=None, px_por_quadro=None):
    """Chicote nos últimos quadros do plano: deslize lateral rápido com borrão."""
    q = quadros or C.CAMERA["chicote_quadros"][1]
    v = px_por_quadro or C.CAMERA["chicote_px_por_quadro"][1]
    d = cam_obj["plano"]["distancia"] if "plano" in cam_obj else 4.0
    desloc = px_to_m(cam_obj, d, v * q) * lado
    scene = cam_obj.users_scene[0]
    scene.frame_set(quadro_fim - q)
    loc0 = cam_obj.matrix_world.translation.copy()
    rot = cam_obj.matrix_world.to_quaternion()
    direita = rot @ Vector((1, 0, 0))
    cam_obj.location = loc0
    cam_obj.keyframe_insert("location", frame=quadro_fim - q)
    cam_obj.location = loc0 + direita * desloc
    cam_obj.keyframe_insert("location", frame=quadro_fim)
    for fc in _fcurves(cam_obj):
        if fc.data_path == "location":
            for k in fc.keyframe_points:
                if quadro_fim - q <= k.co.x <= quadro_fim:
                    k.interpolation = "QUAD"
                    k.easing = "EASE_IN"


def flash(scene, local, quadro, pico_energia=None):
    """Clarão: luz forte por 2 quadros, volta em ~9."""
    L = bpy.data.lights.new("flash_%d" % quadro, "POINT")
    L.shadow_soft_size = 0.5
    pico_energia = pico_energia or C.EFEITOS["flash"]["energia_w"]
    _cor_luz(L, 5500)
    o = bpy.data.objects.new(L.name, L)
    o.location = local
    scene.collection.objects.link(o)
    sub = C.EFEITOS["flash"]["subida_quadros"]
    des = sum(C.EFEITOS["flash"]["descida_quadros"]) // 2
    for f, e in ((quadro - 1, 0.0), (quadro + sub, pico_energia), (quadro + sub + des, 0.0)):
        L.energy = e
        L.keyframe_insert("energy", frame=f)
    return o


# =========================================================== 7. montagem a partir da decupagem
CAMPOS = ["plano", "inicio", "fim", "cenario", "alvo", "tipo", "distancia", "altura", "azimute", "dolly_pct",
          "pan_pct", "tilt_pct", "roll_graus", "transicao_saida", "transicao_quadros", "efeito", "frase"]


def ler_decupagem(caminho):
    with open(caminho, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        for k in ("plano", "inicio", "fim", "transicao_quadros"):
            r[k] = int(float(r[k])) if r.get(k) not in (None, "") else None
        for k in ("distancia", "altura", "azimute", "dolly_pct", "pan_pct", "tilt_pct", "roll_graus"):
            r[k] = float(r[k]) if r.get(k) not in (None, "") else None
    return rows


def _alvo(scene, alvo):
    if not alvo:
        return (0, 0, 1.2)
    if re.match(r"^\s*-?[\d.]+\s*,", alvo):
        return tuple(float(x) for x in alvo.split(","))
    ob = scene.objects.get(alvo) or bpy.data.objects.get(alvo)
    if not ob:
        raise ValueError(f"alvo '{alvo}' não existe na cena '{scene.name}'")
    return ob


def validar_decupagem(rows):
    erros = []
    for i, r in enumerate(rows):
        dur = (r["fim"] - r["inicio"] + 1) / FPS
        if dur > C.EDICAO["plano_max_s"]:
            erros.append(f"plano {r['plano']}: {dur:.1f} s (máx {C.EDICAO['plano_max_s']} s)")
        if i and r["inicio"] != rows[i - 1]["fim"] + 1:
            erros.append(f"plano {r['plano']}: começa em {r['inicio']}, anterior termina em {rows[i - 1]['fim']}")
    cortes = sum(1 for r in rows[:-1] if (r["transicao_saida"] or "").lower() == "corte")
    if cortes > C.EDICAO["cortes_secos_max_por_video"]:
        erros.append(f"{cortes} cortes secos (máx {C.EDICAO['cortes_secos_max_por_video']})")
    return erros


def montar(decupagem_csv, nome_edicao="EDICAO"):
    """Cria as câmeras de cada plano e a cena de edição com faixas e fusões."""
    rows = ler_decupagem(decupagem_csv)
    for e in validar_decupagem(rows):
        print("[decupagem]", e)
    total = rows[-1]["fim"] + 1
    ed = bpy.data.scenes.get(nome_edicao) or bpy.data.scenes.new(nome_edicao)
    configurar_cena(ed, eevee=False)
    ed.frame_start, ed.frame_end = 0, total - 1
    col = strips_of(ed)
    al = C.EDICAO["alcas_render_quadros"]
    strips = []
    for i, r in enumerate(rows):
        sc = bpy.data.scenes.get(r["cenario"])
        if sc is None:
            raise ValueError(f"cenário '{r['cenario']}' não existe; crie com criar_cenario()")
        sc.frame_start, sc.frame_end = 0, max(sc.frame_end, total + al)
        cam = camera_plano(sc, f"cam_{r['plano']:02d}", _alvo(sc, r["alvo"]), r["inicio"], r["fim"],
                           tipo=r["tipo"] or "medio", distancia=r["distancia"] or 4.0, altura=r["altura"] or 1.4,
                           azimute=r["azimute"] or 0.0, dolly_pct=r["dolly_pct"], pan_pct=r["pan_pct"] or 0.0,
                           tilt_pct=r["tilt_pct"] or 0.0, roll_graus=r["roll_graus"] or 0.0)
        ef = (r.get("efeito") or "").strip().lower()
        for item in [x for x in ef.split(";") if x]:
            nome_ef, _, arg = item.partition(":")
            q = int(arg) if arg.isdigit() else (r["inicio"] + r["fim"]) // 2
            if nome_ef == "tremor":
                tremor(cam, q)
            elif nome_ef == "chicote":
                chicote(cam, r["fim"] + al // 2)
            elif nome_ef == "flash":
                flash(sc, cam["plano"]["alvo"], q)
        # faixa da cena com a câmera deste plano
        prev = rows[i - 1] if i else None
        t_in = 0 if not prev or (prev["transicao_saida"] or "").lower() == "corte" else (
            prev["transicao_quadros"] or C.EDICAO["fusao_padrao_quadros"])
        t_out = 0 if i == len(rows) - 1 or (r["transicao_saida"] or "").lower() == "corte" else (
            r["transicao_quadros"] or C.EDICAO["fusao_padrao_quadros"])
        st = col.new_scene(name=f"plano_{r['plano']:02d}", scene=sc, channel=1 + (i % 2), frame_start=0)
        st.scene_camera = cam
        st.frame_final_start = max(0, r["inicio"] - t_in // 2)
        st.frame_final_end = min(total, r["fim"] + 1 + (t_out - t_out // 2))
        strips.append((st, t_out))
    # fusões no meio do movimento (a câmera das duas faixas já está andando)
    for i in range(len(strips) - 1):
        a, t_out = strips[i]
        b, _ = strips[i + 1]
        if t_out:
            ini = b.frame_final_start
            fim = a.frame_final_end
            if fim > ini:
                new_effect(col, f"fusao_{i + 1:02d}", "CROSS", 3, ini, fim, a, b)
    return ed


# =========================================================== 8. legendas
def ler_palavras(caminho):
    """
    Aceita:
      - JSON do Whisper com timestamps por palavra (segments[].words[].{word,start,end})
      - JSON simples: [{"word": "...", "start": s, "end": s}, ...]
      - CSV com colunas word,start,end (segundos)
      - SRT palavra por palavra (legenda automática do CapCut/Premiere exportada)
    """
    ext = os.path.splitext(caminho)[1].lower()
    words = []
    if ext == ".json":
        d = json.load(open(caminho, encoding="utf-8"))
        if isinstance(d, dict) and "segments" in d:
            for s in d["segments"]:
                for w in s.get("words", []):
                    words.append((w["word"].strip(), float(w["start"]), float(w["end"])))
        else:
            words = [(w["word"].strip(), float(w["start"]), float(w["end"])) for w in d]
    elif ext == ".csv":
        with open(caminho, newline="", encoding="utf-8") as f:
            words = [(r["word"].strip(), float(r["start"]), float(r["end"])) for r in csv.DictReader(f)]
    elif ext == ".srt":
        def ts(x):
            h, m, s = x.replace(",", ".").split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
        blocos = re.split(r"\n\s*\n", open(caminho, encoding="utf-8").read().strip())
        for b in blocos:
            ls = b.strip().splitlines()
            if len(ls) >= 3 and "-->" in ls[1]:
                a, z = [ts(x.strip()) for x in ls[1].split("-->")]
                toks = " ".join(ls[2:]).split()
                dur = (z - a) / max(1, len(toks))
                for k, tk in enumerate(toks):
                    words.append((tk, a + k * dur, a + (k + 1) * dur))
    return [w for w in words if w[0]]


def agrupar_palavras(words):
    """
    Blocos de 1–3 palavras, como nos originais:
      - palavras curtas (de, o, a, em, que…) vão junto da palavra seguinte;
      - o bloco fecha depois de uma palavra "cheia", numa pontuação, em 3 palavras
        ou quando passaria do limite de caracteres.
    """
    L = C.LEGENDA
    curtas = set(L["palavras_curtas_juntam"])
    blocos, atual = [], []

    def fecha():
        if atual:
            blocos.append((" ".join(w for w, _, _ in atual), atual[0][1], atual[-1][2]))
            atual.clear()

    for w, a, b in words:
        if atual and len(" ".join(x for x, _, _ in atual) + " " + w) > L["caracteres_max_bloco"]:
            fecha()
        atual.append((w, a, b))
        limpa = re.sub(r"[^0-9a-zà-ÿ]", "", w.lower())
        if re.search(r"[.!?,;:…]$", w) or limpa not in curtas or len(atual) >= L["palavras_por_bloco"][1]:
            fecha()
    fecha()
    return blocos


def legendas(cena_edicao, palavras_arquivo, fonte=None, canal=8, deslocamento_s=0.0):
    """Cria as faixas de texto queimadas, no estilo da bíblia."""
    L = C.LEGENDA
    blocos = agrupar_palavras(ler_palavras(palavras_arquivo))
    col = strips_of(cena_edicao)
    font = bpy.data.fonts.load(fonte, check_existing=True) if fonte and os.path.exists(fonte) else None
    feitos = []
    for i, (txt, a, b) in enumerate(blocos):
        f0 = int(round((a + deslocamento_s) * FPS))
        f1 = int(round((blocos[i + 1][1] + deslocamento_s) * FPS)) if i + 1 < len(blocos) else int(round((b + deslocamento_s) * FPS)) + 1
        f1 = max(f1, f0 + 1)
        s = new_effect(col, f"leg_{i:03d}", "TEXT", canal + (i % 2), f0, f1)
        s.text = txt
        s.font_size = L["corpo_fonte_px"]
        if font:
            s.font = font
        else:
            s.use_bold = True
        s.color = hex_srgb(L["cor"])
        for k, v in (("anchor_x", "CENTER"), ("anchor_y", "CENTER"), ("alignment_x", "CENTER"),
                     ("align_x", "CENTER"), ("align_y", "CENTER")):
            if hasattr(s, k):
                try:
                    setattr(s, k, v)
                except Exception:
                    pass
        s.location = (0.5, 1 - L["centro_y_fracao"])
        s.use_outline = True
        s.outline_color = hex_srgb(L["contorno_cor"])
        if hasattr(s, "outline_width"):
            # 4.2+/5.x: largura relativa ao corpo da fonte
            s.outline_width = min(1.0, L["contorno_px"] / L["corpo_fonte_px"])
        s.use_shadow = True
        s.shadow_color = (0, 0, 0, L["sombra_opacidade"])
        if hasattr(s, "shadow_offset"):
            s.shadow_offset = L["sombra_offset_px"] / L["corpo_fonte_px"]
            s.shadow_angle = math.radians(90)
        if hasattr(s, "shadow_blur"):
            s.shadow_blur = min(1.0, L["sombra_desfoque_px"] / L["corpo_fonte_px"])
        feitos.append(s)
    return feitos


def narracao(cena_edicao, wav, canal=12):
    col = strips_of(cena_edicao)
    snd = col.new_sound(name="narracao", filepath=wav, channel=canal, frame_start=0)
    return snd


def configurar_saida(cena_edicao, caminho_mp4):
    r = cena_edicao.render
    r.filepath = caminho_mp4
    try:
        r.image_settings.file_format = "FFMPEG"
        r.ffmpeg.format = "MPEG4"
        r.ffmpeg.codec = "H264"
        r.ffmpeg.constant_rate_factor = "HIGH"
        r.ffmpeg.audio_codec = "AAC"
        r.ffmpeg.audio_bitrate = C.ENTREGA["audio_kbps"]
        r.ffmpeg.audio_mixrate = C.ENTREGA["audio_hz"]
    except Exception as e:
        pasta = os.path.join(os.path.dirname(caminho_mp4), "quadros", "q_")
        r.filepath = pasta
        r.image_settings.file_format = "PNG"
        print("[aviso] este Blender não grava MP4 (", e, "); renderizando PNG em", pasta,
              "- junte com tools/mixar_audio.py --quadros")
