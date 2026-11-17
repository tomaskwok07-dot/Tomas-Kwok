// Planos 9 a 14: sofá de coração + estátua, cachorro, "cansei", disfarce, três segundos, corrida pra casa.
import React from 'react';
import * as THREE from 'three';
import {back, camKeys, clamp, eIn, eIO, eOut, lerp, orb, PI, pop, prog, quique, rnd, V3} from '../anim';
import {Arco, Arvore, Billboard, Brilho, Caixa, Chao, Cil, CoracaoSolido, Coracoes, Disc, Domo, Esfera, Estrela2D, Forma, garota, K, LEO, Luzes, Nuvem, OculosEscuros, Parede, Personagem, Peruca, PlanoFlat, Poeira, rrect, Stick, verniz} from '../kit';
import {Bairro, CenaDef, CenaP, CEU, DOMO} from './tipos';

// ------------------------------------------------------------------ 9. sofá de coração + estátua de chocolate
export const SofaCoracao = ({p = [0, 0, 0] as V3, s = 1, sy = 1}: {p?: V3; s?: number; sy?: number}) => <group position={p} scale={[s, s * sy, s]}>
  <CoracaoSolido p={[0, 1.42, -0.2]} s={2.7} depth={0.5} cor="#E8274B" />
  <Caixa p={[0, 0.48, 0.55]} s={[2.3, 0.5, 1.1]} cor="#D61F45" r={0.2} />
  <Caixa p={[-1.2, 0.62, 0.5]} s={[0.4, 0.8, 1.15]} cor="#E8274B" r={0.18} /><Caixa p={[1.2, 0.62, 0.5]} s={[0.4, 0.8, 1.15]} cor="#E8274B" r={0.18} />
  <CoracaoSolido p={[-0.5, 0.95, 0.5]} s={0.5} depth={0.16} cor="#FF7FB0" rot={[-0.2, 0.2, 0.15]} /><CoracaoSolido p={[0.55, 0.95, 0.5]} s={0.5} depth={0.16} cor="#FFFFFF" rot={[-0.2, -0.2, -0.15]} />
</group>;
export const Estatua = ({p = [0, 0, 0] as V3, rot = 0}: {p?: V3; rot?: number}) => {
  const m = verniz('#5E2F14');
  return <group position={p}>
    <Caixa p={[0, 0.3, 0]} s={[1.05, 0.6, 1.05]} cor="#FFFFFF" r={0.06} /><Caixa p={[0, 0.3, 0.535]} s={[0.7, 0.24, 0.02]} cor="#FFD23F" r={0.01} rough={0.3} />
    <group position={[0, 0.6, 0]} rotation={[0, rot, 0]}>
      <Cil p={[-0.09, 0.22, 0]} r={0.035} h={0.46} mat={m} seg={8} /><Cil p={[0.09, 0.22, 0]} r={0.035} h={0.46} mat={m} seg={8} />
      <Esfera p={[0, 0.72, 0]} r={1} escala={[0.25, 0.36, 0.2]} mat={m} />
      <Cil p={[-0.32, 0.72, 0]} r={0.03} h={0.42} rot={[0, 0, -0.5]} mat={m} seg={8} /><Cil p={[0.32, 0.72, 0]} r={0.03} h={0.42} rot={[0, 0, 0.5]} mat={m} seg={8} />
      <Esfera p={[0, 1.33, 0]} r={0.35} mat={m} />
      {[-70, -42, -14, 14, 42, 70].map((a, i) => <Cil key={i} p={[0.36 * Math.sin((a * PI) / 180), 1.33 + 0.36 * Math.cos((a * PI) / 180), 0]} rot={[0, 0, (-a * PI) / 180]} r={0.001} r2={0.13} h={0.3} mat={m} seg={8} />)}
      <Esfera p={[-0.12, 1.37, 0.31]} r={0.045} cor="#2B1408" rough={0.2} /><Esfera p={[0.12, 1.37, 0.31]} r={0.045} cor="#2B1408" rough={0.2} />
      <Caixa p={[0, 1.2, 0.33]} s={[0.14, 0.03, 0.03]} cor="#2B1408" r={0.01} />
    </group>
  </group>;
};
const Sala = ({cor = '#FF7FA8', chao = '#F4A261'}: {cor?: string; chao?: string}) => <>
  <Chao cor={chao} s={40} pad="madeira" lado={2} />
  <Parede p={[0, 4, -2.2]} s={[40, 10]} cor={cor} pad="coracoes" />
  <Caixa p={[0, 0.11, -2.15]} s={[40, 0.22, 0.08]} cor="#FFFFFF" sombra={false} />
  <mesh position={[1.4, 0.016, 0.9]} rotation={[-PI / 2, 0, 0]} scale={[3.4, 1.8, 1]} receiveShadow><circleGeometry args={[1, 40]} /><meshStandardMaterial color="#FFD166" roughness={0.9} /></mesh>
</>;
const Sofa = ({f, fundo, frente}: CenaP) => {
  const infla = back(prog(f, 2, 22), 2.8), gira = lerp(-0.35, PI - 0.35, eIO(prog(f, 58, 100)));
  return <>
    <Luzes cor={K.k4500} kI={2.9} dir={[5, 8, 9]} fill="#FFD0E0" chao="#C96A2B" fI={1.1} raio={10} />
    {fundo ? <>
      <Sala />
      <Caixa p={[-3.6, 2.6, -2.15]} s={[1.9, 2.1, 0.1]} cor="#FFFFFF" /><Caixa p={[-3.6, 2.6, -2.1]} s={[1.6, 1.8, 0.08]} cor="#5EC2FF" rough={0.2} sombra={false} />
      <Caixa p={[2.1, 2.9, -2.15]} s={[1.1, 1.4, 0.08]} cor="#FFD23F" /><Caixa p={[2.1, 2.9, -2.1]} s={[0.85, 1.15, 0.06]} cor="#8E5BE8" sombra={false} />
    </> : null}
    {frente ? <>
      <SofaCoracao p={[-0.45, 0, 0]} s={Math.max(0.001, infla * 0.72)} sy={1 + 0.12 * Math.sin(f / 2) * (1 - prog(f, 10, 30))} />
      <Personagem {...LEO} f={f} pos={[1.15, 0, 1.2]} olhos={f > 62 ? 'arregalado' : 'entediado'} boca={f > 62 ? 'surpresa' : 'neutra'} bracoE={f > 62 ? 1.4 : 0.2} bracoD={f > 62 ? 1.4 : 0.2} cabecaRot={f > 62 ? -0.12 : 0.1} flip={f <= 62} />
      <Estatua p={[4.3, 0, 0]} rot={gira} />
      {f > 70 && f < 96 ? <Brilho pos={[4.3 + 0.3 * Math.sin(gira), 1.95, 0.4]} s={1.6 * Math.sin(prog(f, 70, 96) * PI)} cor="#FFFFFF" op={0.8} /> : null}
      {[0, 1, 2, 3].map((i) => <Billboard key={i} pos={[4.3 + 0.9 * Math.cos(i * 1.6 + f / 14), 1.2 + 0.5 * Math.sin(i * 2.2 + f / 9) + 0.5, 0.4 * Math.sin(i * 1.6 + f / 14)]}><Estrela2D s={f > 58 ? 0.24 + 0.1 * Math.sin(f / 3 + i) : 0} rot={f / 6} cor="#FFD23F" /></Billboard>)}
      <Coracoes f={f} n={10} seed={2} centro={[-0.6, 1.3, 0.4]} area={[3, 1]} altura={2.6} s={0.26} />
    </> : null}
  </>;
};
const sofa: CenaDef = {
  Cena: Sofa, ceu: '#FF7FA8', dof: 4,
  cam: (f, dur) => camKeys(f, [
    [-6, {p: [-0.9, 1.5, 6.3], l: [-0.7, 1.1, 0.4], mm: 35, roll: -2}],
    [48, {p: [0.4, 1.45, 5.3], l: [0.3, 1.1, 0.4], mm: 35, roll: 0}],
    [61, {p: [3.5, 1.55, 5.6], l: [3.75, 1.35, 0], mm: 40, roll: 0}, eIO],
    [dur + 8, {p: [4.7, 1.6, 4.5], l: [4.65, 1.45, 0], mm: 40, roll: 3}],
  ]),
};

// ------------------------------------------------------------------ 10. cachorro igualzinho
const Cachorro = ({pos, f}: {pos: V3; f: number}) => {
  const hop = 0.12 * Math.abs(Math.sin(f / 5)), rabo = 0.6 * Math.sin(f / 1.6);
  const leoHair = [[0.36, -0.08], [0.46, 0.1], [0.3, 0.2], [0.36, 0.4], [0.16, 0.34], [0.1, 0.5], [-0.05, 0.36], [-0.2, 0.46], [-0.24, 0.3], [-0.42, 0.3], [-0.34, 0.12], [-0.46, -0.02], [-0.33, 0.1], [-0.22, 0.2], [-0.11, 0.1], [0, 0.2], [0.11, 0.1], [0.22, 0.2], [0.33, 0.1]];
  return <group position={pos}>
    <mesh position={[0, 0.015, 0]} rotation={[-PI / 2, 0, 0]} scale={[0.5, 0.2, 1]}><circleGeometry args={[1, 24]} /><meshBasicMaterial color="#000" transparent opacity={0.3} /></mesh>
    <Billboard>
      <group position={[0, hop, 0]}>
        {[-0.28, -0.14, 0.14, 0.28].map((x, i) => <Stick key={i} a={[x, 0.38]} b={[x + 0.03 * Math.sin(f / 5 + i), 0]} z={-0.004} />)}
        <Stick a={[-0.4, 0.5]} b={[-0.4 - 0.22 * Math.cos(rabo * 0.5), 0.5 + 0.26 + 0.1 * Math.sin(rabo)]} w={0.05} />
        <Forma k="dgO" mk={rrect(0.85, 0.42, 0.2)} y={0.5} cor="#111111" /><Forma k="dg" mk={rrect(0.8, 0.37, 0.18)} y={0.5} z={0.004} cor="#F7F5F0" />
        <Disc x={-0.16} y={0.55} z={0.006} r={0.1} cor="#B5763A" /><Disc x={0.1} y={0.44} z={0.006} r={0.06} cor="#B5763A" />
        <Stick a={[0.24, 0.66]} b={[0.4, 0.6]} w={0.07} cor="#E8274B" z={0.008} />
        <group position={[0.4, 0.92, 0]} scale={0.8} rotation={[0, 0, 0.1 * Math.sin(f / 9)]}>
          <Disc x={-0.36} y={-0.1} z={0.015} rx={0.1} ry={0.2} rot={0.3} cor="#111111" /><Disc x={-0.36} y={-0.1} z={0.017} rx={0.075} ry={0.17} rot={0.3} cor="#B5763A" />
          <Disc x={0.36} y={-0.1} z={0.015} rx={0.1} ry={0.2} rot={-0.3} cor="#111111" /><Disc x={0.36} y={-0.1} z={0.017} rx={0.075} ry={0.17} rot={-0.3} cor="#B5763A" />
          <Disc z={0.02} r={0.357} cor="#111111" /><Disc z={0.024} r={0.33} cor="#F7F5F0" />
          <Forma k="dgh" mk={() => { const s = new THREE.Shape(); leoHair.forEach((q, i) => (i ? s.lineTo(q[0], q[1]) : s.moveTo(q[0], q[1]))); return s; }} z={0.03} cor="#3A2A22" />
          {[-1, 1].map((s) => <group key={s}><Disc x={s * 0.125} y={0.02} z={0.036} r={0.034} cor="#111111" /><Stick a={[s * 0.125 - 0.065, 0.065]} b={[s * 0.125 + 0.065, 0.065]} w={0.024} z={0.038} /></group>)}
          <Disc y={-0.07} z={0.036} rx={0.05} ry={0.035} cor="#111111" />
          <Stick a={[-0.055, -0.15]} b={[0.055, -0.15]} w={0.028} z={0.036} />
          <Disc x={0.02} y={-0.2} z={0.035} rx={0.04} ry={0.06} cor="#FF7C9C" />
        </group>
      </group>
    </Billboard>
  </group>;
};
const Cao = ({f, fundo, frente}: CenaP) => <>
  <Luzes cor={K.k4800} kI={3.0} dir={[5, 9, 8]} fill="#BFE4FF" fI={1.1} />
  {fundo ? <>
    <Domo cores={DOMO.azul} /><Chao cor="#3FAE49" s={120} />
    {[-6, -2.5, 3, 7].map((x, i) => <Arvore key={i} p={[x, 0, -4 - (i % 2) * 2]} s={1.5 + (i % 2) * 0.3} f={f} cor={i % 2 ? '#2E9E44' : '#49B84F'} />)}
    {[-4, 0.5, 5].map((x, i) => <Esfera key={i} p={[x, 0.3, -2.5]} r={0.9} escala={[1.3, 0.8, 1]} cor="#2E9E44" />)}
    <Nuvem p={[-4, 6.5, -12]} s={1.5} /><Nuvem p={[5, 7.5, -13]} s={1.8} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <group key={i} position={[-5 + i * 1.7, 0.02, -1.2 + (i % 3) * 0.5]}><Esfera r={0.09} cor={['#FF4F8B', '#FFD23F', '#FFFFFF'][i % 3]} p={[0, 0.2, 0]} /><Cil p={[0, 0.1, 0]} r={0.015} h={0.2} cor="#2E9E44" seg={5} /></group>)}
  </> : null}
  {frente ? <>
    <Personagem {...garota(17)} corpo="#E056C1" cabelo="rabo" cabeloCor="#F2C94C" acess="laco" f={f} pos={[1.4, 0, 0]} flip olhos="coracao" boca="sorriso_aberto" bracoD={2.3 + 0.2 * Math.sin(f / 4)} bracoE={1.9} pulo={0.15 * Math.abs(Math.sin(f / 5))} />
    <Cachorro pos={[0.35, 0, 0.3]} f={f} />
    <Personagem {...LEO} f={f} pos={[-0.8, 0, 0.2]} olhos={f < 30 ? 'arregalado' : 'entediado'} boca={f < 30 ? 'surpresa' : 'neutra'} cabecaRot={0.1 * Math.sin(f / 9)} squash={f < 8 ? 0.9 + 0.1 * prog(f, 0, 8) : 1} />
    <Coracoes f={f} n={8} seed={6} centro={[1.4, 1.6, 0]} area={[1.4, 0.4]} altura={2} s={0.24} vida={50} />
    {f > 30 ? <Billboard pos={[-0.45, 1.75, 0.3]}><group scale={pop(f, 30, 7)}><Stick a={[-0.12, 0]} b={[0.12, 0]} w={0.07} cor="#FFD23F" /><Stick a={[-0.12, 0.14]} b={[0.12, 0.14]} w={0.07} cor="#FFD23F" /></group></Billboard> : null}
  </> : null}
</>;
const cachorro: CenaDef = {
  Cena: Cao, ceu: CEU.azul, dof: 5,
  cam: (f, dur) => camKeys(f, [[-6, orb([1.25, 1.1, 0], 4.6, 1.3, 5, 40, 2)], [dur + 8, orb([-0.3, 0.95, 0.2], 3.8, 1.15, -1, 40, -2)]]),
};

// ------------------------------------------------------------------ 11. "eu cansei dessa vida"
const Cansado = ({f, fundo, frente}: CenaP) => {
  const basta = f >= 54, s = back(prog(f, 54, 64), 2.6);
  return <>
    <hemisphereLight args={['#4A5FD0', '#141B4D', 0.9]} />
    <pointLight color={K.k2700} intensity={34} distance={12} position={[2.0, 1.9, 0.9]} castShadow />
    <directionalLight color="#8FA8FF" intensity={0.9} position={[-5, 6, -4]} />
    {fundo ? <>
      <Chao cor="#1C2466" s={40} />
      <Parede p={[0, 4, -2.2]} s={[40, 10]} cor="#1E2A6B" pad="listras" />
      <Caixa p={[-2.9, 2.7, -2.15]} s={[1.9, 2.2, 0.1]} cor="#39499E" /><Caixa p={[-2.9, 2.7, -2.1]} s={[1.6, 1.9, 0.08]} cor="#0F1540" sombra={false} />
      <Billboard pos={[-2.6, 3.1, -2.0]} k={0}><Disc r={0.3} cor="#FFF4C2" /></Billboard><Brilho pos={[-2.6, 3.1, -1.95]} s={2.2} cor="#FFF4C2" op={0.5} />
      <Cil p={[2.4, 0.75, -0.6]} r={0.035} h={1.5} cor="#C9A227" /><Cil p={[2.4, 0.03, -0.6]} r={0.28} h={0.06} cor="#C9A227" />
      <mesh position={[2.4, 1.75, -0.6]}><cylinderGeometry args={[0.24, 0.44, 0.55, 24, 1, true]} /><meshBasicMaterial color="#FFC561" side={2} toneMapped={false} /></mesh>
      <Brilho pos={[2.4, 1.7, -0.4]} s={6.5} cor="#FFB04A" op={0.6} />
      {Array.from({length: 9}).map((_, i) => { const t = f + 14 - i * 6; if (t < 0) return null;
        return <group key={i} position={[4 - t * 0.14, 3.4 - t * 0.035 + 0.3 * Math.sin(t / 6 + i), -1.4 + (i % 3) * 0.3]} rotation={[0.3 * Math.sin(t / 5), 0.4, 0.5 * Math.sin(t / 7 + i)]}><PlanoFlat p={[0, 0, 0]} s={[0.5, 0.6]} cor="#DCE3FF" /><PlanoFlat p={[0, 0.22, 0.002]} s={[0.5, 0.16]} cor="#E8274B" /></group>; })}
    </> : null}
    {frente ? <>
      <Caixa p={[0, 0.45, 0.25]} s={[2.9, 0.55, 1.1]} cor="#3557E0" r={0.18} /><Caixa p={[0, 1.05, -0.3]} s={[2.9, 1.2, 0.4]} cor="#2C49C4" r={0.18} />
      <Caixa p={[-1.5, 0.68, 0.2]} s={[0.4, 0.85, 1.15]} cor="#3557E0" r={0.16} /><Caixa p={[1.5, 0.68, 0.2]} s={[0.4, 0.85, 1.15]} cor="#3557E0" r={0.16} />
      <Personagem {...LEO} f={f} pos={[0, 0.42, 0.35]} tint="#DCE0FF" olhos={basta ? 'bravo' : 'entediado'} boca={basta ? 'dentes' : 'triste'} sombra={false}
        squash={basta ? 1 + 0.12 * (1 - s) * (f < 64 ? 1 : 0) : 0.93 + 0.03 * Math.sin(f / 12)} cabecaRot={basta ? 0 : 0.16} inclina={basta ? 0 : 0.07}
        bracoE={basta ? lerp(0.1, 2.75, s) : 0.05} bracoD={basta ? lerp(0.1, 2.75, s) : 0.05} halo="#FFB04A" />
      {!basta ? [0, 1].map((i) => { const t = ((f + i * 20) % 40) / 40; return <Billboard key={i} pos={[0.3 + t * 0.5, 1.6 + t * 0.5, 0.5]}><Disc r={0.08 + t * 0.1} cor="#C9D3FF" op={0.6 * (1 - t)} /></Billboard>; }) : null}
    </> : null}
  </>;
};
const cansado: CenaDef = {
  Cena: Cansado, ceu: '#1E2A6B', dof: 5,
  cam: (f, dur) => camKeys(f, [
    [-8, {p: [-2.3, 1.7, 6.8], l: [-1.0, 1.3, 0.2], mm: 35, roll: -2}],
    [50, {p: [-0.3, 1.6, 4.9], l: [0.1, 1.45, 0.3], mm: 40, roll: 0}],
    [dur - 1, {p: [0, 1.78, 2.7], l: [0, 1.75, 0.35], mm: 50, roll: 0}],
    [dur + 8, {p: [0, 1.78, 2.6], l: [0, 1.75, 0.35], mm: 50, roll: 0}],
  ]),
};

// ------------------------------------------------------------------ 12. disfarce
const Disfarce = ({f, fundo, frente}: CenaP) => {
  const pr = f < 8 ? 9 : 2.4 * (1 - quique(prog(f, 8, 24))), oc = f < 26 ? 9 : 1.6 * (1 - quique(prog(f, 26, 40)));
  return <>
    <Luzes cor={K.k4500} kI={2.6} dir={[4, 7, 9]} fill="#FFD0E6" chao="#D65A8E" fI={1.3} />
    {fundo ? <>
      <Parede p={[0, 3, -1.6]} s={[40, 14]} cor="#FF8FBF" pad="coracoes" lado={1.3} /><Chao cor="#F06AA0" s={30} />
      <Brilho pos={[0, 1.5, -1.4]} s={7} cor="#FFE9A8" op={0.5} />
      {Array.from({length: 18}).map((_, i) => <Billboard key={i} pos={[(rnd(i * 2) - 0.5) * 6.5, 0.4 + rnd(i * 3) * 3.4, -1.3 + rnd(i * 5) * 0.8]}><Estrela2D s={(0.16 + rnd(i) * 0.26) * (0.6 + 0.4 * Math.sin(f / 4 + i * 2))} rot={f / 9 + i} cor={i % 3 ? '#FFD23F' : '#FFFFFF'} /></Billboard>)}
    </> : null}
    {frente ? <>
      <Personagem {...LEO} cabelo={f >= 20 ? 'careca' : 'leo'} f={f} olhos={f >= 37 ? 'nenhum' : f >= 8 ? 'arregalado' : 'neutro'} boca={f < 40 ? 'neutra' : f < 52 ? 'convencido' : 'sorriso'}
        squash={f >= 20 && f < 28 ? 0.9 + 0.1 * prog(f, 20, 28) : f >= 37 && f < 44 ? 0.94 + 0.06 * prog(f, 37, 44) : 1} bracoE={f > 44 ? 0.95 : 0.2} bracoD={f > 44 ? 0.95 : 0.2} halo="#FFE9A8"
        naCabeca={<><group position={[0, pr, 0]} rotation={[0, 0, 0.06 * Math.sin(f / 3) * (f < 30 ? 1 : 0)]}><Peruca /></group><group position={[0, oc, 0]}><OculosEscuros /></group></>} />
      {[[20, 0.55, 1.75], [22, -0.6, 1.6], [37, 0.5, 1.4], [39, -0.5, 1.3], [41, 0, 2.0]].map((e, i) => { const t = prog(f, e[0], e[0] + 12); return t > 0 && t < 1 ? <Billboard key={i} pos={[e[1], e[2], 0.3]}><Estrela2D s={0.5 * Math.sin(t * PI)} rot={f / 3} cor="#FFD23F" /></Billboard> : null; })}
      {f > 20 ? <Brilho pos={[0, 1.6, 0.2]} s={3.2} cor="#FFE08A" op={0.25} /> : null}
    </> : null}
  </>;
};
const disfarce: CenaDef = {
  Cena: Disfarce, ceu: '#FF8FBF', dof: 4,
  cam: (f, dur) => camKeys(f, [[-4, {p: [0, 1.36, 2.45], l: [0, 1.33, 0], mm: 50, roll: 0}], [dur + 6, {p: [0.5, 1.35, 3.7], l: [0.3, 1.25, 0], mm: 50, roll: 4}]]),
};

// ------------------------------------------------------------------ 13. durou três segundos
const leoX13 = (f: number) => lerp(-4.2, 0.5, prog(f, -6, 58));
const Tres = ({f}: CenaP) => {
  const anda = f < 58, voa = f >= 84, t = Math.max(0, f - 84);
  return <>
    <Luzes cor={K.k4800} kI={3.0} dir={[6, 9, 8]} fill="#BFE4FF" fI={1.05} />
    <Bairro f={f} />
    <Personagem {...LEO} cabelo={voa ? 'leo' : 'careca'} f={f} pos={[leoX13(f), 0, 6.3]} corrida={anda ? 0.5 : 0} passo={0.7} olhos={voa ? 'arregalado' : 'nenhum'} boca={voa ? 'surpresa' : f > 62 ? 'sorriso' : f % 16 < 8 ? 'fala_o' : 'sorriso'}
      squash={f >= 60 && f < 66 ? 0.92 : voa && t < 6 ? 1.12 : 1} bracoE={voa ? 2.7 : undefined} bracoD={voa ? 2.7 : undefined}
      naCabeca={<>
        <group position={[voa ? t * 0.05 : 0, voa ? 0.3 + t * 0.16 - t * t * 0.004 : 0, 0]} rotation={[0, 0, voa ? t * 0.2 : 0]}><Peruca /></group>
        <group position={[voa ? -t * 0.03 : 0, voa ? -Math.min(0.9, t * 0.07) : 0, 0]} rotation={[0, 0, voa ? -0.5 * prog(t, 0, 8) : 0]}><OculosEscuros /></group>
        {f > 64 && f < 90 ? <Arco y={-0.135} z={0.06} r0={0.17} r1={0.2} a0={0} len={2 * PI} cor="#FFD23F" s={1 + 0.12 * Math.sin(f / 1.5)} /> : null}
      </>} />
    {f >= 36 ? <Personagem {...garota(41)} f={f} pos={[2.3, lerp(-1.3, 0, back(prog(f, 36, 46), 2.4)), 4.7]} flip olhos={f > 62 ? 'coracao' : 'arregalado'} boca={f > 62 ? 'sorriso_aberto' : 'surpresa'} bracoD={1.75} bracoE={0.4} sombra={false} /> : null}
    {f >= 40 && f < 62 ? <Billboard pos={[2.3, 2.15, 4.7]}><group scale={pop(f, 40, 6)}><Stick a={[0, 0.12]} b={[0, 0.5]} w={0.12} cor="#E8274B" /><Disc r={0.07} cor="#E8274B" /></group></Billboard> : null}
    {[-2.2, -0.9, 0.9, 3.6, 4.7].map((x, i) => f >= 70 + i * 4 ? <Personagem key={i} {...garota(i + 50)} f={f} pos={[x, lerp(-1.3, 0, back(prog(f, 70 + i * 4, 80 + i * 4), 2.4)), 4.7 - (i % 2) * 0.4]} flip={x > 0.5} olhos="coracao" boca="sorriso_aberto" bracoE={2.6} bracoD={2.6} sombra={false} /> : null)}
    {f > 84 ? <Coracoes f={f} n={18} seed={8} centro={[0.5, 1.4, 5.2]} area={[7, 1.5]} altura={3} vida={36} s={0.34} /> : null}
  </>;
};
const Crono = ({f}: {f: number}) => {
  if (f < 1 || f > 50) return null;
  const n = f < 12 ? 3 : f < 23 ? 2 : f < 34 ? 1 : 0, q = f < 12 ? 1 : f < 23 ? 12 : f < 34 ? 23 : 34;
  const s = back(prog(f, q, q + 6), 3), sai = prog(f, 42, 50);
  return <div style={{position: 'absolute', left: 340, top: 250 - sai * 500, width: 400, height: 470, transform: `rotate(${n === 0 ? (rnd(f) - 0.5) * 10 : -4 + 3 * Math.sin(f / 3)}deg)`}}>
    <svg width={400} height={470} viewBox="0 0 400 470" style={{position: 'absolute', filter: 'drop-shadow(0 10px 0 rgba(0,0,0,0.35))'}}>
      <rect x={170} y={8} width={60} height={50} rx={12} fill="#111" /><rect x={130} y={0} width={140} height={30} rx={14} fill="#111" />
      <circle cx={200} cy={260} r={190} fill="#111" /><circle cx={200} cy={260} r={166} fill={n === 0 ? '#E8274B' : '#fff'} />
      <path d={`M200 260 L200 110 A150 150 0 ${f - 1 > 16.5 ? 1 : 0} 1 ${200 + 150 * Math.sin(((f - 1) / 33) * 2 * PI)} ${260 - 150 * Math.cos(((f - 1) / 33) * 2 * PI)} Z`} fill={n === 0 ? 'none' : '#FFD23F'} />
    </svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: 138, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 230, lineHeight: 1, color: n === 0 ? '#fff' : '#111', transform: `scale(${s})`}}>{n === 0 ? '✕' : n}</div>
  </div>;
};
const tres: CenaDef = {
  Cena: Tres, Overlay: Crono, ceu: CEU.azul,
  cam: (f, dur) => camKeys(f, [
    [-6, {p: [-2.6, 1.5, 11.6], l: [-3.8, 1.15, 6.3], mm: 35, roll: -2}],
    [36, {p: [0.5, 1.5, 11.2], l: [-0.8, 1.15, 6.3], mm: 35, roll: 0}],
    [58, {p: [1.3, 1.5, 10.8], l: [0.9, 1.2, 6.0], mm: 35, roll: 1}],
    [67, {p: [0.5, 1.3, 9.5], l: [0.5, 1.25, 6.3], mm: 70, roll: 0}, eIO],
    [84, {p: [0.52, 1.28, 9.1], l: [0.5, 1.23, 6.3], mm: 70, roll: 2}],
    [92, {p: [0.9, 1.5, 10.6], l: [0.6, 1.3, 6.0], mm: 35, roll: 3}, eOut],
    [dur + 8, {p: [1.2, 1.5, 10.2], l: [0.7, 1.3, 6.0], mm: 35, roll: 1}],
  ]),
};

// ------------------------------------------------------------------ 14. corre pra casa e tranca a porta
const caminho = (f: number): V3 => (f < 36 ? [lerp(11, 0.25, clamp(f / 36, -1, 1)), 0, 6.3] : [0.2, 0, lerp(6.3, 1.4, eIn(prog(f, 36, 44)) * 0.4 + 0.6 * prog(f, 36, 44))]);
const Corre = ({f}: CenaP) => {
  const L = caminho(f), dentro = f >= 44;
  const ang = f < 26 ? 0 : f < 38 ? 1.8 * eOut(prog(f, 26, 34)) : 1.8 * (1 - eIn(prog(f, 41, 45)));
  return <>
    <Luzes cor={K.k4800} kI={3.0} dir={[6, 9, 8]} fill="#BFE4FF" fI={1.05} />
    <Bairro f={f} portaAng={ang} />
    {!dentro ? <Personagem {...LEO} f={f} pos={L} flip corrida={1} olhos="arregalado" boca="fala_a" bracoE={2.2} bracoD={2.4} /> : null}
    {!dentro && f < 36 ? <group position={[2 * L[0], 0, 0]} scale={[-1, 1, 1]}><Poeira f={f} pos={[L[0] - 0.5, 0, 6.35]} n={6} /></group> : null}
    {!dentro ? [0, 1, 2, 3].map((i) => <PlanoFlat key={i} p={[L[0] + 1.2 + i * 0.5, 0.7 + i * 0.28, L[2] + 0.05]} s={[1.3 - i * 0.2, 0.035]} cor="#FFFFFF" op={0.7} />) : null}
    {[0, 1, 2, 3, 4].map((i) => { const G = garota(i + 20), d = 4 + i * 1.6, P = caminho(f - d), para = f - d >= 40;
      const px = para ? -0.7 + i * 0.4 : P[0] + (i % 2) * 0.3, pz = para ? 2.55 + (i % 2) * 0.5 : P[2] + (i % 2) * 0.35;
      return <Personagem key={i} {...G} f={f} pos={[px, 0, pz]} flip corrida={para ? 0 : 1} olhos="coracao" boca={para ? 'surpresa' : 'sorriso_aberto'} bracoE={para ? 2.7 : 1.7} bracoD={para ? 2.7 : 1.7}
        squash={para ? 1 - 0.2 * Math.exp(-(f - d - 40) / 3) : 1} pulo={para ? 0.2 * Math.abs(Math.sin(f / 3 + i)) : 0} />; })}
    <Coracoes f={f} n={12} seed={11} centro={[caminho(f - 10)[0] + 1, 1.5, caminho(f - 10)[2]]} area={[4, 1]} altura={2.4} vida={30} s={0.3} />
    {f >= 44 && f < 52 ? <Billboard pos={[0, 1.2, 1.85]}><Estrela2D s={2.2 * (1 - prog(f, 44, 52)) + 0.4} cor="#FFFFFF" rot={f} /></Billboard> : null}
  </>;
};
const corre: CenaDef = {
  Cena: Corre, ceu: CEU.azul,
  cam: (f, dur) => {
    const x = caminho(Math.min(f, 36))[0];
    return camKeys(f, [
      [35, {p: [x + 1.2, 1.6, 12.6], l: [x + 0.5, 1.15, 6.3], mm: 32, roll: -2 + f * 0.08}],
      [46, {p: [1.2, 1.6, 10.4], l: [0, 1.15, 1.9], mm: 35, roll: 2}, eOut],
      [dur + 8, {p: [1.6, 1.6, 9.6], l: [0, 1.2, 1.9], mm: 35, roll: 0}],
    ]);
  },
};

export const cenasB = {sofa, cachorro, cansado, disfarce, tres, corre};
