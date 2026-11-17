// Kit do estilo: personagens 2D recortados (malhas planas viradas para a câmera) em cenários 3D low-poly.
import * as THREE from 'three';
import React, {createContext, useContext} from 'react';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {PI, V3, rnd, clamp} from './anim';

export const CamCtx = createContext({yaw: 0, pitch: 0});
export const TintCtx = createContext<string | undefined>(undefined);

// ------------------------------------------------------------------ caches
const mats = new Map<string, any>();
const geos = new Map<string, any>();
const memo = <T,>(m: Map<string, any>, k: string, f: () => T): T => {
  let v = m.get(k);
  if (!v) { v = f(); m.set(k, v); }
  return v;
};
export const flat = (cor: string, op = 1, tint?: string) =>
  memo(mats, `f|${cor}|${op.toFixed(2)}|${tint}`, () => {
    const c = new THREE.Color(cor);
    if (tint) c.multiply(new THREE.Color(tint));
    return new THREE.MeshBasicMaterial({color: c, transparent: op < 1, opacity: op, side: THREE.DoubleSide, toneMapped: false, depthWrite: op >= 1});
  });
export const std = (cor: string, rough = 0.62, op = 1) =>
  memo(mats, `s|${cor}|${rough}|${op.toFixed(2)}`, () => new THREE.MeshStandardMaterial({color: cor, roughness: rough, metalness: 0, transparent: op < 1, opacity: op}));
export const verniz = (cor: string) =>
  memo(mats, `v|${cor}`, () => new THREE.MeshPhysicalMaterial({color: cor, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.4}));
const gPlane = () => memo(geos, 'plane', () => new THREE.PlaneGeometry(1, 1));
const gDisc = () => memo(geos, 'disc', () => new THREE.CircleGeometry(1, 40));
const gArc = (r0: number, r1: number, a0: number, len: number) => memo(geos, `arc|${r0}|${r1}|${a0}|${len}`, () => new THREE.RingGeometry(r0, r1, 28, 1, a0, len));
const gShape = (k: string, mk: () => THREE.Shape) => memo(geos, 'sh|' + k, () => new THREE.ShapeGeometry(mk(), 12));
const gRBox = (w: number, h: number, d: number, r: number) => memo(geos, `rb|${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)));
const gCyl = (rt: number, rb: number, h: number, seg = 20) => memo(geos, `cy|${rt}|${rb}|${h}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
const gSph = (seg = 20) => memo(geos, 'sp' + seg, () => new THREE.SphereGeometry(1, seg, Math.max(8, seg / 2 | 0)));
const gIco = (d = 1) => memo(geos, 'ico' + d, () => new THREE.IcosahedronGeometry(1, d));
const gExt = (k: string, mk: () => THREE.Shape, depth: number, bevel = 0.05) =>
  memo(geos, `ex|${k}|${depth}|${bevel}`, () => {
    const g = new THREE.ExtrudeGeometry(mk(), {depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 16});
    g.translate(0, 0, -depth / 2);
    return g;
  });

// ------------------------------------------------------------------ formas 2D
export const rrect = (w: number, h: number, r: number) => () => {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
};
export const coracaoShape = () => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.45);
  s.bezierCurveTo(-0.62, -0.05, -0.56, 0.46, -0.26, 0.46);
  s.bezierCurveTo(-0.09, 0.46, 0, 0.33, 0, 0.2);
  s.bezierCurveTo(0, 0.33, 0.09, 0.46, 0.26, 0.46);
  s.bezierCurveTo(0.56, 0.46, 0.62, -0.05, 0, -0.45);
  return s;
};
const estrelaShape = () => {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? 0.16 : 0.5, a = (i * PI) / 4;
    i ? s.lineTo(r * Math.sin(a), r * Math.cos(a)) : s.moveTo(r * Math.sin(a), r * Math.cos(a));
  }
  return s;
};
const poli = (pts: number[][]) => () => {
  const s = new THREE.Shape();
  pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  return s;
};

type P2 = {x?: number; y?: number; z?: number; cor: string; op?: number; rot?: number};
export const Disc = ({x = 0, y = 0, z = 0, r = 1, rx, ry, cor, op = 1, rot = 0}: P2 & {r?: number; rx?: number; ry?: number}) => {
  const tint = useContext(TintCtx);
  return <mesh dispose={null} geometry={gDisc()} material={flat(cor, op, tint)} position={[x, y, z]} scale={[rx ?? r, ry ?? r, 1]} rotation={[0, 0, rot]} />;
};
export const Stick = ({a, b, w = 0.035, cor = '#111111', z = 0}: {a: number[]; b: number[]; w?: number; cor?: string; z?: number}) => {
  const tint = useContext(TintCtx);
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return <mesh dispose={null} geometry={gPlane()} material={flat(cor, 1, tint)} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} rotation={[0, 0, Math.atan2(dy, dx)]} scale={[Math.hypot(dx, dy) + w * 0.7, w, 1]} />;
};
export const Forma = ({k, mk, x = 0, y = 0, z = 0, cor, op = 1, rot = 0, s = 1, sx, sy}: P2 & {k: string; mk: () => THREE.Shape; s?: number; sx?: number; sy?: number}) => {
  const tint = useContext(TintCtx);
  return <mesh dispose={null} geometry={gShape(k, mk)} material={flat(cor, op, tint)} position={[x, y, z]} rotation={[0, 0, rot]} scale={[sx ?? s, sy ?? s, 1]} />;
};
export const Arco = ({x = 0, y = 0, z = 0, r0, r1, a0, len, cor, rot = 0, s = 1}: P2 & {r0: number; r1: number; a0: number; len: number; s?: number}) => {
  const tint = useContext(TintCtx);
  return <mesh dispose={null} geometry={gArc(r0, r1, a0, len)} material={flat(cor, 1, tint)} position={[x, y, z]} rotation={[0, 0, rot]} scale={s} />;
};
export const Coracao2D = (p: P2 & {s?: number}) => <Forma k="cor" mk={coracaoShape} {...p} />;
export const Estrela2D = (p: P2 & {s?: number}) => <Forma k="est" mk={estrelaShape} {...p} />;

// vira o conteúdo para a câmera (yaw sempre; pitch opcional para planos de cima)
export const Billboard = ({pos = [0, 0, 0] as V3, k = 1, children, escala = 1 as number | V3}: {pos?: V3; k?: number; children: React.ReactNode; escala?: number | V3}) => {
  const cam = useContext(CamCtx);
  return <group position={pos} scale={escala} rotation={new THREE.Euler(-cam.pitch * k, cam.yaw, 0, 'YXZ')}>{children}</group>;
};

// brilho aditivo (bloom barato: só em fontes de luz, corações e telas)
let texBrilho: THREE.Texture | null = null;
const brilhoTex = () => {
  if (!texBrilho) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d')!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    texBrilho = new THREE.CanvasTexture(c);
  }
  return texBrilho;
};
export const Brilho = ({pos = [0, 0, 0] as V3, s = 1, cor = '#ffffff', op = 0.5}: {pos?: V3; s?: number; cor?: string; op?: number}) => {
  const m = memo(mats, `b|${cor}|${op.toFixed(2)}`, () => new THREE.MeshBasicMaterial({map: brilhoTex(), color: cor, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false}));
  return <Billboard pos={pos}><mesh dispose={null} geometry={gPlane()} material={m} scale={s} renderOrder={5} /></Billboard>;
};

// textura de texto/desenho 2D (precisa das fontes já carregadas)
export const texDesenho = (k: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) =>
  memo(mats, 'tx|' + k, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d')!);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  });
export const Placa = ({k, w, h, px = 512, draw, pos = [0, 0, 0] as V3, rot = [0, 0, 0] as V3, lit = false, escala = 1 as number | V3}: {k: string; w: number; h: number; px?: number; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; pos?: V3; rot?: V3; lit?: boolean; escala?: number | V3}) => {
  const W = px, H = Math.round((px * h) / w);
  const t = texDesenho(k, W, H, (g) => draw(g, W, H));
  const m = memo(mats, `pl|${k}|${lit}`, () => (lit ? new THREE.MeshStandardMaterial({map: t, roughness: 0.8, transparent: true}) : new THREE.MeshBasicMaterial({map: t, toneMapped: false, transparent: true})));
  return <mesh dispose={null} geometry={gPlane()} material={m} position={pos} rotation={rot} scale={typeof escala === 'number' ? [w * escala, h * escala, 1] : [w * escala[0], h * escala[1], 1]} />;
};

// ------------------------------------------------------------------ personagem
export type Olhos = 'neutro' | 'feliz' | 'entediado' | 'arregalado' | 'bravo' | 'preocupado' | 'coracao' | 'fechado' | 'nenhum';
export type Boca = 'neutra' | 'sorriso' | 'sorriso_aberto' | 'convencido' | 'surpresa' | 'dentes' | 'fala_a' | 'fala_o' | 'beijo' | 'triste';
export type Cabelo = 'leo' | 'longo' | 'coque' | 'rabo' | 'chanel' | 'cachos' | 'maria' | 'bone' | 'careca' | 'grisalho';
const PELE = '#F7F5F0', PRETO = '#111111';
const R = 0.33;

const capShape = (yc: number, r = 0.368) => () => {
  const s = new THREE.Shape(), t0 = Math.asin(yc / r);
  for (let i = 0; i <= 24; i++) {
    const a = t0 + ((PI - 2 * t0) * i) / 24;
    i ? s.lineTo(r * Math.cos(a), r * Math.sin(a)) : s.moveTo(r * Math.cos(a), r * Math.sin(a));
  }
  return s;
};
const leoHair = () => {
  const pts: number[][] = [];
  for (let i = 0; i <= 10; i++) {
    const a = ((-12 + i * 20.4) * PI) / 180, r = i % 2 ? 0.47 : 0.37;
    pts.push([r * Math.cos(a), r * Math.sin(a) + 0.0]);
  }
  for (let i = 0; i <= 6; i++) pts.push([-0.33 + i * 0.11, i % 2 ? 0.2 : 0.1]);
  return poli(pts)();
};

const OlhosV = ({tipo}: {tipo: Olhos}) => {
  const e = 0.125, y = 0.035, z = 0.036;
  if (tipo === 'nenhum') return null;
  return <>
    {[-1, 1].map((s) => {
      const x = s * e;
      switch (tipo) {
        case 'feliz': return <Arco key={s} x={x} y={y - 0.03} z={z} r0={0.05} r1={0.078} a0={0.12 * PI} len={0.76 * PI} cor={PRETO} />;
        case 'fechado': return <Stick key={s} a={[x - 0.055, y]} b={[x + 0.055, y]} w={0.026} z={z} />;
        case 'entediado': return <group key={s}><Disc x={x} y={y - 0.012} z={z} r={0.034} cor={PRETO} /><Stick a={[x - 0.065, y + 0.03]} b={[x + 0.065, y + 0.03]} w={0.024} z={z + 0.002} /></group>;
        case 'arregalado': return <group key={s}><Disc x={x} y={y} z={z} r={0.098} cor={PRETO} /><Disc x={x} y={y} z={z + 0.002} r={0.08} cor="#FFFFFF" /><Disc x={x} y={y} z={z + 0.004} r={0.026} cor={PRETO} /></group>;
        case 'bravo': return <group key={s}><Disc x={x} y={y - 0.01} z={z} r={0.036} cor={PRETO} /><Stick a={[x - s * 0.075, y + 0.04]} b={[x + s * 0.05, y + 0.1]} w={0.03} z={z} /></group>;
        case 'preocupado': return <group key={s}><Disc x={x} y={y - 0.01} z={z} r={0.036} cor={PRETO} /><Stick a={[x - s * 0.07, y + 0.105]} b={[x + s * 0.055, y + 0.06]} w={0.026} z={z} /></group>;
        case 'coracao': return <Coracao2D key={s} x={x} y={y} z={z} s={0.17} cor="#FF2E6E" />;
        default: return <Disc key={s} x={x} y={y} z={z} r={0.036} cor={PRETO} />;
      }
    })}
  </>;
};
const BocaV = ({tipo}: {tipo: Boca}) => {
  const y = -0.135, z = 0.036;
  switch (tipo) {
    case 'sorriso': return <Arco y={y + 0.07} z={z} r0={0.085} r1={0.112} a0={1.18 * PI} len={0.64 * PI} cor={PRETO} />;
    case 'triste': return <Arco y={y - 0.1} z={z} r0={0.085} r1={0.11} a0={0.2 * PI} len={0.6 * PI} cor={PRETO} />;
    case 'sorriso_aberto': return <group><mesh dispose={null} geometry={memo(geos, 'half', () => new THREE.CircleGeometry(1, 24, PI, PI))} material={flat(PRETO)} position={[0, y + 0.045, z]} scale={0.118} /><mesh dispose={null} geometry={memo(geos, 'half', () => new THREE.CircleGeometry(1, 24, PI, PI))} material={flat('#9C1F3A')} position={[0, y + 0.036, z + 0.002]} scale={0.092} /><Disc y={y - 0.03} z={z + 0.004} rx={0.045} ry={0.022} cor="#FF7C9C" /></group>;
    case 'surpresa': return <Disc y={y - 0.01} z={z} rx={0.05} ry={0.066} cor={PRETO} />;
    case 'fala_a': return <group><Disc y={y - 0.01} z={z} rx={0.078} ry={0.088} cor={PRETO} /><Disc y={y - 0.015} z={z + 0.002} rx={0.058} ry={0.066} cor="#9C1F3A" /><Disc y={y - 0.05} z={z + 0.004} rx={0.036} ry={0.02} cor="#FF7C9C" /></group>;
    case 'fala_o': return <group><Disc y={y} z={z} r={0.05} cor={PRETO} /><Disc y={y} z={z + 0.002} r={0.03} cor="#9C1F3A" /></group>;
    case 'dentes': return <group><Forma k="dn" mk={rrect(0.2, 0.09, 0.035)} y={y} z={z} cor={PRETO} /><Forma k="dn2" mk={rrect(0.165, 0.055, 0.02)} y={y} z={z + 0.002} cor="#FFFFFF" /><Stick a={[-0.08, y]} b={[0.08, y]} w={0.012} z={z + 0.004} /></group>;
    case 'convencido': return <Stick a={[-0.05, y - 0.02]} b={[0.07, y + 0.025]} w={0.028} z={z} />;
    case 'beijo': return <group><Coracao2D y={y} z={z} s={0.12} cor="#E0245E" /></group>;
    default: return <Stick a={[-0.055, y]} b={[0.055, y]} w={0.028} z={z} />;
  }
};
export const Peruca = ({cor = '#F6C833'}: {cor?: string}) => <group>
  {Array.from({length: 9}).map((_, i) => { const a = ((-25 + i * 28.5) * PI) / 180; return <group key={i}><Disc x={0.4 * Math.cos(a)} y={0.4 * Math.sin(a)} z={0.012} r={0.17} cor={PRETO} /><Disc x={0.4 * Math.cos(a)} y={0.4 * Math.sin(a)} z={0.014} r={0.148} cor={cor} /></group>; })}
  {[-1, 1].map((s) => [0, 1, 2].map((j) => <group key={s + '' + j}><Disc x={s * 0.42} y={-0.18 - j * 0.2} z={0.012} r={0.15} cor={PRETO} /><Disc x={s * 0.42} y={-0.18 - j * 0.2} z={0.014} r={0.128} cor={cor} /></group>))}
  <Forma k="capP" mk={capShape(0.15, 0.375)} z={0.045} cor={cor} />
  {[-0.2, -0.07, 0.06, 0.19].map((x, i) => <Disc key={i} x={x} y={0.19} z={0.047} r={0.085} cor={cor} />)}
</group>;
export const OculosEscuros = () => <group>
  {[-1, 1].map((s) => <group key={s}><Forma k="oe" mk={rrect(0.24, 0.17, 0.06)} x={s * 0.135} y={0.035} z={0.05} cor={PRETO} /><Stick a={[s * 0.09, 0.07]} b={[s * 0.16, 0.0]} w={0.02} cor="#5B6B8C" z={0.052} /></group>)}
  <Stick a={[-0.05, 0.05]} b={[0.05, 0.05]} w={0.035} z={0.05} />
  <Stick a={[-0.36, 0.06]} b={[-0.2, 0.05]} w={0.03} z={0.05} /><Stick a={[0.2, 0.05]} b={[0.36, 0.06]} w={0.03} z={0.05} />
</group>;

const CabeloV = ({tipo, cor}: {tipo: Cabelo; cor: string}) => {
  const O = ({x, y, r}: {x: number; y: number; r: number}) => <group><Disc x={x} y={y} z={0.01} r={r + 0.024} cor={PRETO} /><Disc x={x} y={y} z={0.012} r={r} cor={cor} /></group>;
  const cap = <Forma k="cap13" mk={capShape(0.13)} z={0.03} cor={cor} />;
  switch (tipo) {
    case 'leo': return <Forma k="leo" mk={leoHair} z={0.03} cor={cor} />;
    case 'longo': return <group><Forma k="lgO" mk={rrect(0.93, 1.1, 0.4)} y={-0.2} z={-0.014} cor={PRETO} /><Forma k="lg" mk={rrect(0.88, 1.05, 0.38)} y={-0.2} z={-0.012} cor={cor} />{cap}</group>;
    case 'chanel': return <group><Forma k="chO" mk={rrect(0.9, 0.8, 0.36)} y={-0.06} z={0.008} cor={PRETO} /><Forma k="ch" mk={rrect(0.85, 0.75, 0.34)} y={-0.06} z={0.01} cor={cor} />{cap}</group>;
    case 'coque': return <group><O x={0} y={0.45} r={0.16} />{cap}</group>;
    case 'rabo': return <group><Disc x={0.42} y={-0.06} z={0.01} rx={0.155} ry={0.33} rot={-0.3} cor={PRETO} /><Disc x={0.42} y={-0.06} z={0.012} rx={0.13} ry={0.305} rot={-0.3} cor={cor} />{cap}</group>;
    case 'maria': return <group><O x={-0.41} y={-0.1} r={0.15} /><O x={0.41} y={-0.1} r={0.15} />{cap}</group>;
    case 'cachos': return <group>{Array.from({length: 8}).map((_, i) => { const a = ((-18 + i * 30.8) * PI) / 180; return <O key={i} x={0.37 * Math.cos(a)} y={0.37 * Math.sin(a)} r={0.13} />; })}{cap}</group>;
    case 'grisalho': return <group><O x={-0.32} y={0.02} r={0.09} /><O x={0.32} y={0.02} r={0.09} /><Stick a={[-0.1, -0.075]} b={[0.1, -0.075]} w={0.05} cor={cor} z={0.04} /></group>;
    case 'bone': return <group><Disc x={-0.31} y={0.02} z={0.012} r={0.075} cor="#111111" /><Disc x={-0.31} y={0.02} z={0.014} r={0.052} cor="#5A3A22" /><Forma k="cap06" mk={capShape(0.07, 0.385)} z={0.03} cor={PRETO} /><Forma k="cap08" mk={capShape(0.085, 0.365)} z={0.032} cor={cor} /><Forma k="aba" mk={rrect(0.4, 0.1, 0.05)} x={0.33} y={0.1} z={0.031} cor={PRETO} /><Forma k="aba2" mk={rrect(0.36, 0.062, 0.03)} x={0.33} y={0.1} z={0.033} cor={cor} /><Disc y={0.37} z={0.034} r={0.035} cor="#FFFFFF" /></group>;
    default: return null;
  }
};
const AcessV = ({tipo, cor}: {tipo?: string | null; cor: string}) => {
  switch (tipo) {
    case 'laco': return <group position={[0.2, 0.34, 0.05]} rotation={[0, 0, -0.35]}><Forma k="tri" mk={poli([[0, 0], [-0.17, 0.11], [-0.17, -0.11]])} cor={cor} /><Forma k="tri2" mk={poli([[0, 0], [0.17, 0.11], [0.17, -0.11]])} cor={cor} /><Disc r={0.045} z={0.002} cor={PRETO} /><Disc r={0.03} z={0.004} cor={cor} /></group>;
    case 'flor': return <group position={[-0.25, 0.24, 0.05]}>{[0, 1, 2, 3, 4].map((i) => <Disc key={i} x={0.07 * Math.cos(i * 1.257)} y={0.07 * Math.sin(i * 1.257)} r={0.055} cor={cor} />)}<Disc r={0.04} z={0.002} cor="#FFD23F" /></group>;
    case 'oculos': return <group>{[-1, 1].map((s) => <Arco key={s} x={s * 0.125} y={0.035} z={0.045} r0={0.088} r1={0.112} a0={0} len={2 * PI} cor={cor} />)}<Stick a={[-0.03, 0.04]} b={[0.03, 0.04]} w={0.022} cor={cor} z={0.045} /></group>;
    case 'tiara': return <Arco z={0.046} r0={0.34} r1={0.385} a0={0.14 * PI} len={0.72 * PI} cor={cor} />;
    default: return null;
  }
};

export type PersonagemP = {
  pos?: V3; escala?: number; flip?: boolean; f?: number; fase?: number;
  corpo: string; cabelo?: Cabelo; cabeloCor?: string; acess?: string | null; acessCor?: string;
  olhos?: Olhos; boca?: Boca; bracoE?: number; bracoD?: number; corrida?: number; passo?: number;
  pulo?: number; squash?: number; escalaX?: number; inclina?: number; cabecaRot?: number; cabecaDx?: number;
  segura?: React.ReactNode; naCabeca?: React.ReactNode; tint?: string; sombra?: boolean; halo?: string | null; piscar?: boolean; k?: number;
  faixa?: string; frontal?: boolean;
};
export const Personagem = (p: PersonagemP) => {
  const f = p.f ?? 0, fase = p.fase ?? 0;
  const resp = 1 + 0.018 * Math.sin((f / 45 + fase) * 2 * PI);
  const per = 62 + Math.floor(rnd(fase * 7.1 + 3) * 56);
  const bl = (((f + 9 + Math.floor(fase * 97)) % per) + per) % per;
  let olhos = p.olhos ?? 'neutro';
  if (bl < 2 && p.piscar !== false && olhos !== 'coracao' && olhos !== 'feliz' && olhos !== 'nenhum') olhos = 'fechado';
  const run = p.corrida ?? 0, ph = (f / 8) * 2 * PI * (p.passo ?? 1) + fase * 6.28;
  const sway = 0.022 * Math.sin((f / 70 + fase) * 2 * PI) * (1 - run) + (p.inclina ?? 0) - (p.frontal ? 0 : run * 0.21);
  const cab = 0.035 * Math.sin((f / 52 + fase * 1.7) * 2 * PI) + (p.cabecaRot ?? 0);
  const hop = run * 0.09 * Math.abs(Math.sin(ph));
  const sq = (p.squash ?? 1) * resp, sx = (p.escalaX ?? 1) / Math.sqrt(p.squash ?? 1);
  const hip = 0.47, L = 0.47;
  const perna = (s: number) => {
    const a = run * 0.95 * Math.sin(ph + (s > 0 ? PI : 0));
    const pe = [s * 0.09 + L * Math.sin(a), hip - L * Math.cos(a) + run * 0.1 * Math.max(0, Math.sin(ph + (s > 0 ? PI : 0) + 1.2))];
    return <group key={s}><Stick a={[s * 0.09, hip]} b={pe} z={-0.004} /><Stick a={pe} b={[pe[0] + 0.09, pe[1]]} z={-0.004} /></group>;
  };
  const braco = (s: number, ang?: number) => {
    const a = (ang ?? 0.2 + 0.05 * Math.sin((f / 60 + fase) * 2 * PI)) + run * (0.9 * Math.sin(ph + (s > 0 ? 0 : PI)));
    const o = [s * 0.19, 0.93], e = [o[0] + s * 0.42 * Math.sin(a), o[1] - 0.42 * Math.cos(a)];
    return <group key={s}><Stick a={o} b={e} z={0.008} /><Disc x={e[0]} y={e[1]} z={0.009} r={0.03} cor={PRETO} />{s > 0 && p.segura ? <group position={[e[0], e[1], 0.012]}>{p.segura}</group> : null}</group>;
  };
  const corpo = <>
    <Forma k="cpO" mk={rrect(0.47, 0.67, 0.2)} y={0.75} z={0} cor={PRETO} />
    <Forma k="cp" mk={rrect(0.42, 0.62, 0.18)} y={0.75} z={0.004} cor={p.corpo} />
    {p.faixa ? <Stick a={[-0.17, 1.0]} b={[0.17, 0.55]} w={0.07} cor={p.faixa} z={0.006} /> : null}
  </>;
  return <group position={p.pos ?? [0, 0, 0]} scale={p.escala ?? 1}>
    {p.sombra !== false ? <mesh dispose={null} geometry={gDisc()} material={flat('#000000', 0.3)} position={[0, 0.015, 0]} rotation={[-PI / 2, 0, 0]} scale={[0.36 * clamp(1 - (p.pulo ?? 0) * 0.25, 0.4, 1), 0.2 * clamp(1 - (p.pulo ?? 0) * 0.25, 0.4, 1), 1]} /> : null}
    {p.halo ? <Brilho pos={[0, 1.0, -0.15]} s={2.6} cor={p.halo} op={0.3} /> : null}
    <Billboard k={p.k ?? 0.85}>
      <TintCtx.Provider value={p.tint}>
        <group position={[0, (p.pulo ?? 0) + hop, 0]} scale={[(p.flip ? -1 : 1) * sx, sq, 1]} rotation={[0, 0, sway]}>
          {perna(-1)}{perna(1)}
          {corpo}
          {braco(-1, p.bracoE)}{braco(1, p.bracoD)}
          <group position={[p.cabecaDx ?? 0, 1.33 + 0.012 * Math.sin((f / 45 + fase) * 2 * PI), 0]} rotation={[0, 0, cab]}>
            <Disc z={0.02} r={R + 0.027} cor={PRETO} />
            <Disc z={0.024} r={R} cor={PELE} />
            <CabeloV tipo={p.cabelo ?? 'careca'} cor={p.cabeloCor ?? '#3A2A22'} />
            <OlhosV tipo={olhos} />
            <BocaV tipo={p.boca ?? 'neutra'} />
            <AcessV tipo={p.acess} cor={p.acessCor ?? '#FF4F8B'} />
            {p.naCabeca}
          </group>
        </group>
      </TintCtx.Provider>
    </Billboard>
  </group>;
};

export const LEO = {corpo: '#2F6BE0', cabelo: 'leo' as Cabelo, cabeloCor: '#3A2A22'};
export const NOVATO = {corpo: '#FF8A1F', cabelo: 'bone' as Cabelo, cabeloCor: '#17C3B2'};
const CORPOS = ['#FF4F8B', '#8E5BE8', '#17C3B2', '#FFB020', '#3FA7F5', '#F25C54', '#43B66B', '#E056C1', '#FF8A3D', '#5B6EE8'];
const CABELOS = ['#3B2314', '#151515', '#C8742A', '#F2C94C', '#8A3B12', '#E0567A', '#6B3FA0'];
const TIPOS: Cabelo[] = ['longo', 'coque', 'rabo', 'chanel', 'cachos', 'maria'];
const ACESS = ['laco', 'flor', null, 'tiara', 'oculos', null, 'laco'];
export const garota = (i: number) => ({
  corpo: CORPOS[Math.floor(rnd(i * 1.3 + 1) * CORPOS.length)],
  cabelo: TIPOS[Math.floor(rnd(i * 2.7 + 2) * TIPOS.length)],
  cabeloCor: CABELOS[Math.floor(rnd(i * 3.9 + 5) * CABELOS.length)],
  acess: ACESS[Math.floor(rnd(i * 5.1 + 7) * ACESS.length)],
  acessCor: CORPOS[Math.floor(rnd(i * 6.3 + 9) * CORPOS.length)],
  fase: rnd(i * 9.7 + 4),
  escala: 0.94 + rnd(i * 4.4 + 8) * 0.12,
});

// corações subindo com leve rotação, tamanho variado e fade
export const Coracoes = ({f, n = 24, seed = 1, centro = [0, 0, 0] as V3, area = [6, 6] as [number, number], altura = 5, vida = 70, s = 0.34, cores = ['#FF2E6E', '#FF4F8B', '#E8274B'], brilho = true}: {f: number; n?: number; seed?: number; centro?: V3; area?: [number, number]; altura?: number; vida?: number; s?: number; cores?: string[]; brilho?: boolean}) => <>
  {Array.from({length: n}).map((_, i) => {
    const k = i + seed * 100, v = vida * (0.7 + rnd(k * 1.7) * 0.6);
    const t = (((f + rnd(k * 2.3) * v) % v) + v) % v / v;
    const sc = s * (0.55 + rnd(k * 3.1) * 0.9) * Math.min(1, t * 6) * (t > 0.7 ? (1 - t) / 0.3 : 1);
    if (sc < 0.01) return null;
    const x = centro[0] + (rnd(k * 4.7) - 0.5) * area[0] + 0.25 * Math.sin(t * 7 + k);
    const z = centro[2] + (rnd(k * 5.9) - 0.5) * area[1];
    const y = centro[1] + t * altura * (0.6 + rnd(k * 6.1) * 0.6);
    return <group key={i}>
      {brilho && i % 2 === 0 ? <Brilho pos={[x, y, z - 0.05]} s={sc * 3} cor="#FF5C8A" op={0.3} /> : null}
      <Billboard pos={[x, y, z]}><Coracao2D s={sc} rot={0.35 * Math.sin(t * 5 + k)} cor={cores[i % cores.length]} /></Billboard>
    </group>;
  })}
</>;
export const Poeira = ({f, pos, n = 5, seed = 0, cor = '#FFFFFF'}: {f: number; pos: V3; n?: number; seed?: number; cor?: string}) => <>
  {Array.from({length: n}).map((_, i) => {
    const t = (((f + i * 3 + seed * 5) % 14) + 14) % 14 / 14;
    return <Billboard key={i} pos={[pos[0] - t * 0.9 - i * 0.12, pos[1] + 0.1 + t * 0.35 + rnd(i + seed) * 0.15, pos[2] + 0.02 * i]}><Disc r={0.16 * (1 - t) + 0.03} cor={cor} op={0.75 * (1 - t)} /></Billboard>;
  })}
</>;

// ------------------------------------------------------------------ cenário 3D
type P3 = {p?: V3; rot?: V3; escala?: number | V3};
export const Caixa = ({p = [0, 0, 0] as V3, s, cor, r = 0.06, rot = [0, 0, 0] as V3, rough = 0.62, sombra = true, recebe = true, escala = 1 as number | V3, mat}: {p?: V3; s: V3; cor?: string; r?: number; rot?: V3; rough?: number; sombra?: boolean; recebe?: boolean; escala?: number | V3; mat?: THREE.Material}) =>
  <mesh dispose={null} geometry={gRBox(s[0], s[1], s[2], r)} material={mat ?? std(cor!, rough)} position={p} rotation={rot} scale={escala} castShadow={sombra} receiveShadow={recebe} />;
export const Cil = ({p = [0, 0, 0] as V3, r, r2, h, cor, rot = [0, 0, 0] as V3, seg = 20, rough = 0.62, mat, escala = 1 as number | V3}: {p?: V3; r: number; r2?: number; h: number; cor?: string; rot?: V3; seg?: number; rough?: number; mat?: THREE.Material; escala?: number | V3}) =>
  <mesh dispose={null} geometry={gCyl(r, r2 ?? r, h, seg)} material={mat ?? std(cor!, rough)} position={p} rotation={rot} scale={escala} castShadow receiveShadow />;
export const Esfera = ({p = [0, 0, 0] as V3, r, cor, escala, rough = 0.6, mat, seg = 20}: {p?: V3; r: number; cor?: string; escala?: V3; rough?: number; mat?: THREE.Material; seg?: number}) =>
  <mesh dispose={null} geometry={gSph(seg)} material={mat ?? std(cor!, rough)} position={p} scale={escala ? [r * escala[0], r * escala[1], r * escala[2]] : r} castShadow receiveShadow />;
// texturas procedurais tom sobre tom (dão detalhe ao fundo e deixam o movimento de câmera legível)
export type Padrao = 'manchas' | 'bolinhas' | 'listras' | 'madeira' | 'ladrilho' | 'coracoes' | 'liso';
const texPadrao = (tipo: Padrao, cor: string, rx: number, ry: number) =>
  memo(mats, `pd|${tipo}|${cor}|${rx.toFixed(2)}|${ry.toFixed(2)}`, () => {
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d')!, hsl = {h: 0, s: 0, l: 0};
    new THREE.Color(cor).getHSL(hsl, THREE.SRGBColorSpace);
    const tom = (dl: number) => '#' + new THREE.Color().setHSL(hsl.h, hsl.s, clamp(hsl.l + dl * 1.4, 0.02, 0.97), THREE.SRGBColorSpace).getHexString();
    g.fillStyle = cor; g.fillRect(0, 0, N, N);
    const rep = (fn: (ox: number, oy: number) => void) => { for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) fn(ox, oy); };
    if (tipo === 'manchas') for (let i = 0; i < 16; i++) { g.fillStyle = tom(i % 2 ? -0.075 : 0.065); const x = rnd(i * 3.1) * N, y = rnd(i * 5.3) * N, r = 12 + rnd(i * 7.7) * 26; rep((ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, r, r * 0.62, 0, 0, 7); g.fill(); }); }
    if (tipo === 'bolinhas') for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = tom((i + j) % 2 ? 0.075 : -0.06); g.beginPath(); g.arc(i * 64 + (j % 2 ? 32 : 0) + 16, j * 64 + 32, 15, 0, 7); g.fill(); }
    if (tipo === 'listras') for (let i = 0; i < 4; i++) { g.fillStyle = tom(-0.06); g.fillRect(i * 64, 0, 28, N); g.fillStyle = tom(0.05); g.fillRect(i * 64 + 40, 0, 8, N); }
    if (tipo === 'madeira') for (let j = 0; j < 4; j++) { g.fillStyle = tom(j % 2 ? -0.05 : 0.035); g.fillRect(0, j * 64, N, 64); g.fillStyle = tom(-0.14); g.fillRect(0, j * 64, N, 5); g.fillRect((j * 97 + 40) % N, j * 64, 5, 64); }
    if (tipo === 'ladrilho') for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = tom((i + j) % 2 ? -0.06 : 0.05); g.fillRect(i * 128 + 4, j * 128 + 4, 120, 120); }
    if (tipo === 'coracoes') for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { g.fillStyle = tom((i + j) % 2 ? 0.08 : -0.065); g.save(); g.translate(i * 85.3 + (j % 2 ? 42 : 0) + 22, j * 85.3 + 40); g.scale(30, -30); g.beginPath(); g.moveTo(0, -0.45); g.bezierCurveTo(-0.62, -0.05, -0.56, 0.46, -0.26, 0.46); g.bezierCurveTo(-0.09, 0.46, 0, 0.33, 0, 0.2); g.bezierCurveTo(0, 0.33, 0.09, 0.46, 0.26, 0.46); g.bezierCurveTo(0.56, 0.46, 0.62, -0.05, 0, -0.45); g.fill(); g.restore(); }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return new THREE.MeshStandardMaterial({map: t, roughness: 0.88});
  });
export const Chao = ({cor, s = 80, y = 0, p = [0, 0, 0] as V3, pad = 'manchas' as Padrao, lado = 2.6}: {cor: string; s?: number | [number, number]; y?: number; p?: V3; pad?: Padrao; lado?: number}) => {
  const sx = typeof s === 'number' ? s : s[0], sy = typeof s === 'number' ? s : s[1];
  return <mesh dispose={null} geometry={gPlane()} material={pad === 'liso' ? std(cor, 0.9) : texPadrao(pad, cor, sx / lado, sy / lado)} position={[p[0], y, p[2]]} rotation={[-PI / 2, 0, 0]} scale={[sx, sy, 1]} receiveShadow />;
};
export const Parede = ({p, s, cor, rot = [0, 0, 0] as V3, pad = 'bolinhas' as Padrao, lado = 1.7}: {p: V3; s: [number, number]; cor: string; rot?: V3; pad?: Padrao; lado?: number}) =>
  <mesh dispose={null} geometry={gPlane()} material={pad === 'liso' ? std(cor, 0.85) : texPadrao(pad, cor, s[0] / lado, s[1] / lado)} position={p} rotation={rot} scale={[s[0], s[1], 1]} receiveShadow />;
// céu em domo (gira junto com a câmera) com degradê e nuvens
export const Domo = ({cores, nuvens = 34, k = 'ceu'}: {cores: [string, string, string]; nuvens?: number; k?: string}) => {
  const m = memo(mats, `domo|${cores.join()}|${nuvens}`, () => {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
    const g = c.getContext('2d')!, gr = g.createLinearGradient(0, 0, 0, 1024);
    gr.addColorStop(0, cores[0]); gr.addColorStop(0.3, cores[0]); gr.addColorStop(0.44, cores[1]); gr.addColorStop(0.52, cores[2]); gr.addColorStop(1, cores[2]);
    g.fillStyle = gr; g.fillRect(0, 0, 2048, 1024);
    for (let i = 0; i < nuvens; i++) {
      const x = rnd(i * 3.7 + 1) * 2048, y = 250 + rnd(i * 5.1 + 2) * 215, w = 46 + rnd(i * 7.3) * 70;
      for (const ox of [-2048, 0, 2048]) { g.fillStyle = 'rgba(255,255,255,0.96)';
        for (const [dx, dy, r] of [[-0.6, 0.1, 0.42], [0, -0.1, 0.6], [0.65, 0.1, 0.45], [0.2, 0.2, 0.5], [-0.25, 0.2, 0.45]]) { g.beginPath(); g.ellipse(x + ox + dx * w, y + dy * w * 0.6, r * w, r * w * 0.62, 0, 0, 7); g.fill(); } }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
    return new THREE.MeshBasicMaterial({map: t, side: THREE.BackSide, toneMapped: false, depthWrite: false, fog: false});
  });
  return <mesh dispose={null} geometry={gSph(40)} material={m} scale={260} renderOrder={-10} />;
};
export const PlanoFlat = ({p, s, cor, rot = [0, 0, 0] as V3, op = 1}: {p: V3; s: [number, number]; cor: string; rot?: V3; op?: number}) =>
  <mesh dispose={null} geometry={gPlane()} material={flat(cor, op)} position={p} rotation={rot} scale={[s[0], s[1], 1]} />;

const triShape = (w: number, h: number) => poli([[-w / 2, 0], [w / 2, 0], [0, h]]);
export const Casa = ({p = [0, 0, 0] as V3, parede = '#FFD166', telhado = '#E63946', porta = '#C81D4E', portaAng = 0, w = 4.4, h = 2.9, d = 3, rot = 0, semPorta = false}: {p?: V3; parede?: string; telhado?: string; porta?: string; portaAng?: number; w?: number; h?: number; d?: number; rot?: number; semPorta?: boolean}) =>
  <group position={p} rotation={[0, rot, 0]}>
    <Caixa p={[0, h / 2, 0]} s={[w, h, d]} cor={parede} r={0.08} />
    <mesh dispose={null} geometry={gExt(`tel|${w}|${h}`, triShape(w + 0.7, 1.7), d + 0.5, 0.06)} material={std(telhado, 0.7)} position={[0, h - 0.02, 0]} castShadow receiveShadow />
    <Caixa p={[0, 1.08, d / 2 + 0.01]} s={[1.24, 2.16, 0.1]} cor="#FFFFFF" r={0.04} />
    <Caixa p={[0, 1.04, d / 2 + 0.03]} s={[1.02, 2.0, 0.1]} cor="#2B1820" r={0.03} sombra={false} />
    {!semPorta ? <group position={[-0.5, 0, d / 2 + 0.1]} rotation={[0, -portaAng, 0]}>
      <Caixa p={[0.5, 1.02, 0]} s={[1.0, 1.98, 0.08]} cor={porta} r={0.03} />
      <Caixa p={[0.5, 1.45, 0.05]} s={[0.5, 0.5, 0.03]} cor="#FFE8A3" r={0.02} sombra={false} />
      <Esfera p={[0.86, 1.0, 0.07]} r={0.06} cor="#FFD23F" rough={0.3} />
    </group> : null}
    {[-1, 1].map((s) => <group key={s} position={[s * 1.45, 1.6, d / 2 + 0.02]}>
      <Caixa s={[0.95, 0.95, 0.1]} cor="#FFFFFF" r={0.04} />
      <Caixa p={[0, 0, 0.03]} s={[0.78, 0.78, 0.08]} cor="#7FD4FF" r={0.02} rough={0.2} sombra={false} />
      <Caixa p={[0, 0, 0.06]} s={[0.05, 0.78, 0.05]} cor="#FFFFFF" r={0.01} sombra={false} /><Caixa p={[0, 0, 0.06]} s={[0.78, 0.05, 0.05]} cor="#FFFFFF" r={0.01} sombra={false} />
    </group>)}
    <Caixa p={[0, 0.07, d / 2 + 0.45]} s={[1.7, 0.14, 0.8]} cor="#E8E2D8" r={0.04} />
  </group>;
export const Arvore = ({p = [0, 0, 0] as V3, s = 1, cor = '#2E9E44', f = 0}: {p?: V3; s?: number; cor?: string; f?: number}) =>
  <group position={p} scale={s} rotation={[0, 0, 0.02 * Math.sin(f / 30 + p[0])]}>
    <Cil p={[0, 0.8, 0]} r={0.16} r2={0.22} h={1.6} cor="#8A5A2B" seg={8} />
    <mesh dispose={null} geometry={gIco(1)} material={memo(mats, 'fs|' + cor, () => new THREE.MeshStandardMaterial({color: cor, roughness: 0.8, flatShading: true}))} position={[0, 2.25, 0]} scale={[1.15, 1.05, 1.15]} castShadow receiveShadow />
    <mesh dispose={null} geometry={gIco(1)} material={memo(mats, 'fs|' + cor, () => new THREE.MeshStandardMaterial({color: cor, roughness: 0.8, flatShading: true}))} position={[0.35, 3.05, 0.1]} scale={0.75} castShadow receiveShadow />
  </group>;
export const Cerca = ({p = [0, 0, 0] as V3, n = 10, passo = 0.42, cor = '#FFFFFF'}: {p?: V3; n?: number; passo?: number; cor?: string}) =>
  <group position={p}>
    {Array.from({length: n}).map((_, i) => <Caixa key={i} p={[i * passo, 0.42, 0]} s={[0.16, 0.84, 0.07]} cor={cor} r={0.03} />)}
    <Caixa p={[((n - 1) * passo) / 2, 0.55, -0.03]} s={[n * passo, 0.09, 0.05]} cor={cor} r={0.02} /><Caixa p={[((n - 1) * passo) / 2, 0.25, -0.03]} s={[n * passo, 0.09, 0.05]} cor={cor} r={0.02} />
  </group>;
export const Rua = ({z = 7.5, larg = 5, comp = 120, x = 0}: {z?: number; larg?: number; comp?: number; x?: number}) => <group>
  <mesh dispose={null} geometry={gPlane()} material={texPadrao('ladrilho', '#D9D2C5', comp / 1.8, 1)} position={[x, 0.02, z - larg / 2 - 0.9]} rotation={[-PI / 2, 0, 0]} scale={[comp, 1.8, 1]} receiveShadow />
  <mesh dispose={null} geometry={gPlane()} material={texPadrao('manchas', '#4A4E69', comp / 2.2, larg / 2.2)} position={[x, 0.01, z]} rotation={[-PI / 2, 0, 0]} scale={[comp, larg, 1]} receiveShadow />
  {Array.from({length: 40}).map((_, i) => <mesh key={i} dispose={null} geometry={gPlane()} material={std('#FFFFFF', 0.8)} position={[x - 58 + i * 3, 0.02, z]} rotation={[-PI / 2, 0, 0]} scale={[1.4, 0.16, 1]} />)}
</group>;
export const Nuvem = ({p, s = 1}: {p: V3; s?: number}) => <Billboard pos={p} escala={s} k={0}>
  <Disc x={-0.8} r={0.6} cor="#FFFFFF" /><Disc x={0} y={0.25} r={0.85} cor="#FFFFFF" /><Disc x={0.9} r={0.65} cor="#FFFFFF" /><Forma k="nuv" mk={rrect(2.6, 0.7, 0.3)} y={-0.3} cor="#FFFFFF" />
</Billboard>;
export const Presente = ({p = [0, 0, 0] as V3, s = 0.5, cor = '#FF4F8B', fita = '#FFD23F', rot = [0, 0, 0] as V3, escala = 1 as number | V3}: {p?: V3; s?: number; cor?: string; fita?: string; rot?: V3; escala?: number | V3}) =>
  <group position={p} rotation={rot} scale={escala}>
    <Caixa s={[s, s, s]} cor={cor} r={s * 0.12} rough={0.45} />
    <Caixa s={[s * 1.03, s * 1.03, s * 0.2]} cor={fita} r={0.02} rough={0.35} sombra={false} /><Caixa s={[s * 0.2, s * 1.03, s * 1.03]} cor={fita} r={0.02} rough={0.35} sombra={false} />
    <Esfera p={[-s * 0.16, s * 0.58, 0]} r={s * 0.15} cor={fita} rough={0.35} /><Esfera p={[s * 0.16, s * 0.58, 0]} r={s * 0.15} cor={fita} rough={0.35} />
  </group>;
export const Bolo = ({p = [0, 0, 0] as V3, s = 1, cor = '#FF7FB0', escala = 1 as number | V3}: {p?: V3; s?: number; cor?: string; escala?: number | V3}) =>
  <group position={p} scale={escala}><group scale={s}>
    <Cil p={[0, 0.03, 0]} r={0.36} h={0.05} cor="#FFFFFF" rough={0.3} />
    <Cil p={[0, 0.2, 0]} r={0.3} h={0.3} cor="#8A4B2A" rough={0.5} />
    <Cil p={[0, 0.38, 0]} r={0.315} h={0.09} cor={cor} rough={0.35} />
    <Cil p={[0, 0.52, 0]} r={0.2} h={0.2} cor="#FFF1D6" rough={0.5} />
    <Cil p={[0, 0.64, 0]} r={0.21} h={0.06} cor={cor} rough={0.35} />
    <Esfera p={[0, 0.74, 0]} r={0.075} cor="#E8274B" rough={0.2} />
  </group></group>;
export const Urso = ({p = [0, 0, 0] as V3, s = 1, rot = [0, 0, 0] as V3, cor = '#B5763A'}: {p?: V3; s?: number; rot?: V3; cor?: string}) =>
  <group position={p} rotation={rot} scale={s}>
    <Esfera p={[0, 0.2, 0]} r={0.22} cor={cor} /><Esfera p={[0, 0.5, 0]} r={0.17} cor={cor} />
    <Esfera p={[-0.13, 0.65, 0]} r={0.065} cor={cor} /><Esfera p={[0.13, 0.65, 0]} r={0.065} cor={cor} />
    <Esfera p={[0, 0.47, 0.14]} r={0.07} cor="#F5D7A8" /><Esfera p={[-0.2, 0.26, 0.05]} r={0.08} cor={cor} /><Esfera p={[0.2, 0.26, 0.05]} r={0.08} cor={cor} />
    <Esfera p={[-0.12, 0.03, 0.12]} r={0.09} cor={cor} /><Esfera p={[0.12, 0.03, 0.12]} r={0.09} cor={cor} />
  </group>;
export const Carta = ({p = [0, 0, 0] as V3, rot = [0, 0, 0] as V3, s = 1, cor = '#FFF7E8'}: {p?: V3; rot?: V3; s?: number; cor?: string}) =>
  <group position={p} rotation={rot} scale={s}><Caixa s={[0.52, 0.05, 0.36]} cor={cor} r={0.02} />
    <mesh dispose={null} geometry={gShape('cor', coracaoShape)} material={std('#E8274B', 0.4)} position={[0, 0.03, 0]} rotation={[-PI / 2, 0, 0]} scale={0.2} /></group>;
export const Buque = ({p = [0, 0, 0] as V3, rot = [0, 0, 0] as V3, s = 1}: {p?: V3; rot?: V3; s?: number}) =>
  <group position={p} rotation={rot} scale={s}>
    <Cil p={[0, 0.16, 0]} r={0.13} r2={0.04} h={0.34} cor="#FFFFFF" seg={10} />
    {[['#FF4F8B', -0.1, 0.4, 0], ['#FFD23F', 0.1, 0.42, 0.02], ['#E8274B', 0, 0.47, -0.06], ['#FF8A3D', 0, 0.4, 0.1], ['#B56BFF', 0.02, 0.36, -0.12]].map((c, i) => <Esfera key={i} p={[c[1] as number, c[2] as number, c[3] as number]} r={0.1} cor={c[0] as string} rough={0.5} seg={10} />)}
  </group>;
// buquê 2D para a mão dos personagens recortados
export const Buque2D = () => <group rotation={[0, 0, -0.25]}>
  <Forma k="bq" mk={poli([[-0.1, 0.02], [0.1, 0.02], [0.02, -0.26], [-0.02, -0.26]])} cor="#111111" s={1.12} /><Forma k="bq" mk={poli([[-0.1, 0.02], [0.1, 0.02], [0.02, -0.26], [-0.02, -0.26]])} cor="#FFFFFF" z={0.002} />
  {[['#FF4F8B', -0.1, 0.1], ['#FFD23F', 0.1, 0.1], ['#E8274B', 0, 0.2], ['#B56BFF', -0.16, 0.22], ['#FF8A3D', 0.16, 0.22]].map((c, i) => <group key={i}><Disc x={c[1] as number} y={c[2] as number} z={0.004} r={0.105} cor="#111111" /><Disc x={c[1] as number} y={c[2] as number} z={0.006} r={0.085} cor={c[0] as string} /><Disc x={c[1] as number} y={c[2] as number} z={0.008} r={0.03} cor="#FFF1A8" /></group>)}
</group>;
export const CoracaoSolido = ({p = [0, 0, 0] as V3, s = 1, cor = '#E8274B', rot = [0, 0, 0] as V3, depth = 0.5, escala = 1 as number | V3, mat}: {p?: V3; s?: number; cor?: string; rot?: V3; depth?: number; escala?: number | V3; mat?: THREE.Material}) =>
  <group position={p} rotation={rot} scale={escala}><mesh dispose={null} geometry={gExt('corS', coracaoShape, depth, 0.08)} material={mat ?? std(cor, 0.45)} scale={s} castShadow receiveShadow /></group>;

// luz de 3 pontos: principal quente + preenchimento frio (25–35%) + contraluz branca
export const Luzes = ({cor = '#FFE2C2', kI = 2.7, dir = [5, 9, 7] as V3, fill = '#BBD0FF', chao = '#8A7F9E', fI = 1.0, rim = '#FFFFFF', rI = 1.1, sombra = true, raio = 13}: {cor?: string; kI?: number; dir?: V3; fill?: string; chao?: string; fI?: number; rim?: string; rI?: number; sombra?: boolean; raio?: number}) => <>
  <hemisphereLight args={[fill, chao, fI]} />
  <directionalLight color={cor} intensity={kI} position={dir} castShadow={sombra} shadow-mapSize={[1536, 1536]} shadow-camera-left={-raio} shadow-camera-right={raio} shadow-camera-top={raio} shadow-camera-bottom={-raio} shadow-camera-far={70} shadow-bias={-0.0006} shadow-normalBias={0.04} />
  <directionalLight color={rim} intensity={rI} position={[-dir[0] * 0.7, dir[1] * 0.6, -Math.abs(dir[2]) - 3]} />
</>;
export const K = {k2700: '#FFB46B', k3400: '#FFC78F', k4500: '#FFDCBC', k4800: '#FFE2C6', k6500: '#FFFFFF', k9000: '#D2DEFF'};
