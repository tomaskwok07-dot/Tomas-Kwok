// Linha do tempo: planos (dados/planos.json), transições variadas, efeitos de impacto, vinheta e legendas.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import '@fontsource/montserrat/900.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/600.css';
import planos from './dados/planos.json';
import {Cam, clamp, eIO, eIn, eOut, lerp, PI, prog, punch, sIO, tremorXY} from './anim';
import {CamCtx} from './kit';
import {CENAS} from './cenas';
import {Legendas} from './Legendas';

export const W = 1080, H = 1920;
type Plano = (typeof planos)[number] & {origem?: number[]; dir?: string};
const PLANOS = planos as Plano[];
export const TOTAL = PLANOS[PLANOS.length - 1].fim + 1;
// grade global (ajustada pelo QC: saturação 0,52–0,58 · brilho 110–120 · contraste 60–64)
export const GRADE = 'contrast(1.13) saturate(1.02) brightness(0.97)';

const Camera = ({cam}: {cam: Cam}) => {
  const {camera} = useThree();
  const c = camera as any;
  c.position.set(cam.p[0], cam.p[1], cam.p[2]);
  c.up.set(0, 1, 0);
  c.lookAt(cam.l[0], cam.l[1], cam.l[2]);
  c.rotateZ(((cam.roll ?? 0) * PI) / 180);
  c.fov = (2 * Math.atan(18 / cam.mm) * 180) / PI; // sensor de 36 mm na altura (quadro vertical)
  c.near = 0.1; c.far = 400;
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  return null;
};

const Tela3D = ({cena, f, dur, cam, fundo, frente, blur}: {cena: string; f: number; dur: number; cam: Cam; fundo: boolean; frente: boolean; blur?: number}) => {
  const def = CENAS[cena];
  const yaw = Math.atan2(cam.p[0] - cam.l[0], cam.p[2] - cam.l[2]);
  const pitch = Math.atan2(cam.p[1] - cam.l[1], Math.hypot(cam.p[0] - cam.l[0], cam.p[2] - cam.l[2]));
  return (
    <ThreeCanvas width={W} height={H} flat shadows gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
      style={{position: 'absolute', left: 0, top: 0, filter: blur ? `blur(${blur}px)` : undefined, transform: blur ? 'scale(1.04)' : undefined}}>
      <Camera cam={cam} />
      <CamCtx.Provider value={{yaw, pitch}}>
        <def.Cena f={f} dur={dur} fundo={fundo} frente={frente} />
      </CamCtx.Provider>
    </ThreeCanvas>
  );
};

const efeitos = (ef: string, F: number) => {
  let tx = 0, ty = 0, z = 0, flash = 0;
  ef.split(';').filter(Boolean).forEach((e) => {
    const [nome, q] = e.split(':'), Q = Number(q);
    if (nome === 'tremor') { const t = tremorXY(F, Q, 20, 10); tx += t[0]; ty += t[1]; if (F >= Q && F <= Q + 10) z += 0.035; }
    if (nome === 'punch') z += punch(F, Q, 0.08);
    if (nome === 'flash') flash = Math.max(flash, F < Q ? 0 : F < Q + 2 ? 0.9 : Math.max(0, 0.9 * (1 - (F - Q - 2) / 6)));
  });
  return {tx, ty, z, flash};
};

const PlanoView = ({idx, F, estilo, fLocal}: {idx: number; F: number; estilo?: React.CSSProperties; fLocal?: number}) => {
  const p = PLANOS[idx], def = CENAS[p.cena], dur = p.fim - p.inicio + 1, f = fLocal ?? F - p.inicio;
  const cam = def.cam(f, dur);
  const fx = efeitos(p.efeito, F);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', ...estilo}}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${fx.tx}px,${fx.ty}px) scale(${1 + fx.z})`, filter: def.grade}}>
        <div style={{position: 'absolute', inset: 0, background: typeof def.ceu === 'function' ? def.ceu(f, dur) : def.ceu}} />
        {def.dof ? <>
          <Tela3D cena={p.cena} f={f} dur={dur} cam={cam} fundo frente={false} blur={def.dof} />
          <Tela3D cena={p.cena} f={f} dur={dur} cam={cam} fundo={false} frente />
        </> : <Tela3D cena={p.cena} f={f} dur={dur} cam={cam} fundo frente />}
        {def.Overlay ? <def.Overlay f={f} dur={dur} /> : null}
      </div>
      {fx.flash > 0 ? <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: fx.flash}} /> : null}
    </div>
  );
};

// garota em primeiro plano que "limpa" o quadro (wipe por personagem)
const GarotaWipe = ({x, F}: {x: number; F: number}) => (
  <svg width={1500} height={H} viewBox="0 0 1500 1920" style={{position: 'absolute', left: x - 750, top: 0, filter: 'url(#borraoX)'}}>
    <g transform={`translate(750 ${1010 + 40 * Math.sin(F * 1.3)}) rotate(9)`}>
      <rect x={-560} y={-900} width={1120} height={2300} rx={380} fill="#111" />
      <rect x={-520} y={-860} width={1040} height={2300} rx={350} fill="#6B3FA0" />
      <rect x={-330} y={330} width={660} height={1500} rx={250} fill="#111" />
      <rect x={-290} y={370} width={580} height={1500} rx={220} fill="#FF4F8B" />
      <circle r={470} cy={-60} fill="#111" /><circle r={432} cy={-60} fill="#F7F5F0" />
      <path d="M -446 -120 A 450 450 0 0 1 446 -120 Z" fill="#6B3FA0" />
      <path d="M150 -20 c-70 -90 -190 10 0 140 c190 -130 70 -230 0 -140z" fill="#FF2E6E" /><path d="M-170 -20 c-70 -90 -190 10 0 140 c190 -130 70 -230 0 -140z" fill="#FF2E6E" transform="translate(-20 0)" />
      <path d="M -120 190 A 130 130 0 0 0 140 190 Z" fill="#111" />
    </g>
  </svg>
);
const CORACAO_D = 'M0,0.45 C-0.62,0.05 -0.56,-0.46 -0.26,-0.46 C-0.09,-0.46 0,-0.33 0,-0.2 C0,-0.33 0.09,-0.46 0.26,-0.46 C0.56,-0.46 0.62,0.05 0,0.45 Z';

const useFontes = () => {
  const [ok, setOk] = useState(false);
  const [h] = useState(() => delayRender('fontes'));
  useEffect(() => {
    Promise.all([document.fonts.load('900 78px Montserrat', 'ÁÇÃ'), document.fonts.load('800 40px Montserrat', 'ÁÇÃ'), document.fonts.load('600 40px Montserrat', 'ÁÇÃ'), document.fonts.load('40px "Noto Color Emoji"', '💋')])
      .catch(() => null).then(() => { setOk(true); continueRender(h); });
  }, [h]);
  return ok;
};

export const Video = () => {
  const F = useCurrentFrame();
  const ok = useFontes();
  if (!ok) return null;
  let i = PLANOS.findIndex((p) => F >= p.inicio && F <= p.fim);
  if (i < 0) i = PLANOS.length - 1;
  let camadas: React.ReactNode = <PlanoView key={i} idx={i} F={F} />;
  let extra: React.ReactNode = null;
  for (const j of [i - 1, i]) {
    if (j < 0 || j >= PLANOS.length - 1) continue;
    const a = PLANOS[j], N = a.transicao_quadros;
    if (!N) continue;
    const ini = a.fim + 1 - Math.floor(N / 2), p = (F - ini + 0.5) / N;
    if (p <= 0 || p >= 1) continue;
    const sai = (s?: React.CSSProperties) => <PlanoView key={j} idx={j} F={F} estilo={s} />;
    const entra = (s?: React.CSSProperties) => <PlanoView key={j + 1} idx={j + 1} F={F} estilo={s} />;
    const [ox, oy] = a.origem ?? [50, 50];
    if (a.transicao_saida === 'fusao') camadas = <>{sai()}{entra({opacity: sIO(p)})}</>;
    else if (a.transicao_saida === 'chicote') {
      const e = eIO(p), vert = a.dir === 'cima', sg = a.dir === 'dir' ? -1 : 1, fil = vert ? 'url(#borraoY)' : 'url(#borraoX)';
      const tr = (k: number) => (vert ? `translateY(${k * H}px)` : `translateX(${sg * k * W}px)`);
      camadas = <div style={{position: 'absolute', inset: 0, filter: fil}}>{sai({transform: tr(vert ? e : -e)})}{entra({transform: tr(vert ? e - 1 : 1 - e)})}</div>;
    } else if (a.transicao_saida === 'zoom') {
      camadas = <>
        {entra({transform: `scale(${lerp(0.72, 1, eOut(p))})`, transformOrigin: `${ox}% ${oy}%`})}
        {sai({transform: `scale(${1 + 5.5 * eIn(p)})`, transformOrigin: `${ox}% ${oy}%`, opacity: 1 - prog(p, 0.45, 0.95), filter: `blur(${14 * p}px)`})}
      </>;
    } else if (a.transicao_saida === 'wipe') {
      const x = lerp(-700, W + 700, sIO(p));
      camadas = <>{sai()}{entra({clipPath: `inset(0px ${clamp(W - x, 0, W)}px 0px 0px)`})}</>;
      extra = <GarotaWipe x={x} F={F} />;
    } else if (a.transicao_saida === 'coracao') {
      // match de forma: os corações crescem até tomar o quadro e encolhem no sofá de coração
      const s = p < 0.5 ? lerp(120, 5200, eIn(p * 2)) : lerp(5200, 900, eOut((p - 0.5) * 2));
      camadas = p < 0.5 ? sai() : entra();
      extra = <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: p < 0.5 ? clamp(p * 6) : 1 - prog(p, 0.8, 1)}}>
        <path d={CORACAO_D} transform={`translate(${(ox / 100) * W} ${(oy / 100) * H}) scale(${s})`} fill="#E8274B" />
      </svg>;
    }
  }
  // final: íris de coração fecha no Leo e reabre no close da abertura (loop perfeito)
  let iris: React.ReactNode = null;
  const I0 = TOTAL - 35;
  if (F >= I0) {
    const fecha = eIO(prog(F, I0, I0 + 16)), abre = eIO(prog(F, I0 + 19, TOTAL - 3));
    const s = F < I0 + 18 ? lerp(7200, 0, fecha) : lerp(0, 7200, abre);
    if (F >= I0 + 18) camadas = <PlanoView key="loop" idx={0} F={F} fLocal={0} />;
    iris = <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <path fillRule="evenodd" fill="#E8417A" d={`M0,0 H${W} V${H} H0 Z ${s > 1 ? CORACAO_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => `${540 + Number(x) * s},${930 + Number(y) * s}`) : ''}`} />
      {s > 1 && s < 6000 ? <path fill="none" stroke="#FFFFFF" strokeWidth={14} d={CORACAO_D.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x, y) => `${540 + Number(x) * s},${930 + Number(y) * s}`)} /> : null}
    </svg>;
  }
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="borraoX" x="-20%" width="140%"><feGaussianBlur stdDeviation="46 0" /></filter>
        <filter id="borraoY" y="-20%" height="140%"><feGaussianBlur stdDeviation="0 46" /></filter>
      </svg>
      <div style={{position: 'absolute', inset: 0, filter: GRADE}}>
        {camadas}
        {extra}
        {iris}
        {/* vinheta leve nas bordas */}
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(10,0,20,0.34) 100%)'}} />
      </div>
      <Legendas F={F} />
    </AbsoluteFill>
  );
};
