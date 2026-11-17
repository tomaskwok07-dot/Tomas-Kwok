// Planos 15 a 18, 20 e 21: alto-falantes, o novato chega, sossego, a rua, close do Leo e a perseguição final.
import React from 'react';
import {back, camKeys, clamp, eIO, eOut, lerp, orb, PI, pop, prog, rnd, V3} from '../anim';
import {Arvore, Billboard, Brilho, Buque2D, Caixa, Casa, Chao, Cil, Coracao2D, Coracoes, Disc, Domo, Estrela2D, Forma, garota, K, LEO, Luzes, NOVATO, Nuvem, Parede, Personagem, Placa, PlanoFlat, Poeira, rrect, Rua, Stick} from '../kit';
import {Bairro, CenaDef, CenaP, CEU, DOMO} from './tipos';
import {Estatua, SofaCoracao} from './cenas_b';

// ------------------------------------------------------------------ 15. alto-falantes
const Corneta = ({rot, f, on}: {rot: V3; f: number; on: boolean}) => <group rotation={rot}>
  <group scale={on ? 1 + 0.05 * Math.sin(f * 1.7) : 1}>
    <Cil p={[0, 0.25, 0]} r={0.2} h={0.5} cor="#3B3B4F" /><Cil p={[0, 1.0, 0]} r={0.75} r2={0.16} h={1.1} cor="#E8274B" seg={28} rough={0.4} />
    <Cil p={[0, 1.57, 0]} r={0.8} h={0.07} cor="#FFFFFF" seg={28} /><Cil p={[0, 1.5, 0]} r={0.66} h={0.1} cor="#2B1820" seg={28} />
  </group>
  {on ? [0, 1, 2, 3].map((i) => { const t = (((f * 0.045 + i / 4) % 1) + 1) % 1;
    return <mesh key={i} position={[0, 1.7 + t * 4.2, 0]} rotation={[PI / 2, 0, 0]} scale={0.8 + t * 2.6}><ringGeometry args={[0.8, 1, 40]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={Math.round((1 - t * t) * 16) / 16} side={2} toneMapped={false} depthWrite={false} /></mesh>; }) : null}
</group>;
const Alto = ({f}: CenaP) => {
  const on = f > 4;
  return <>
    <Luzes cor="#FFF4D6" kI={3.6} dir={[7, 10, 6]} fill="#BFF0FF" chao="#3FAE49" fI={1.0} rI={0.8} raio={14} />
    <Domo cores={DOMO.ciano} /><Chao cor="#3FAE49" s={160} />
    <Casa p={[-5.5, 0, -6]} parede="#FFD166" telhado="#E63946" /><Casa p={[5, 0, -7]} parede="#FF8FB1" telhado="#7B4BD6" /><Casa p={[0, 0, -12]} parede="#7FD8FF" telhado="#FF8A3D" />
    <Arvore p={[-2.6, 0, -3]} s={1.6} f={f} /><Arvore p={[3.2, 0, -3.5]} s={1.9} f={f} cor="#49B84F" />
    <Cil p={[0, 3.6, 0]} r={0.14} r2={0.2} h={7.2} cor="#5B6078" /><Caixa p={[0, 6.9, 0]} s={[2.2, 0.2, 0.2]} cor="#5B6078" />
    <group position={[-0.95, 6.95, 0.1]}><Corneta rot={[1.0, 0, 0.75]} f={f} on={on} /></group>
    <group position={[0.95, 6.95, 0.1]}><Corneta rot={[1.0, 0, -0.75]} f={f + 5} on={on} /></group>
    <Brilho pos={[4.5, 12, -6]} s={11} cor="#FFF7C2" op={0.9} />
    <Nuvem p={[-6, 10, -10]} s={1.6} /><Nuvem p={[6.5, 7.5, -11]} s={1.3} />
    {[0, 1, 2, 3, 4, 5].map((i) => { const t = f - 6 - i * 2; if (t < 0) return null; const a = 0.35 * Math.sin(f * 0.9 + i);
      return <Billboard key={i} pos={[-1.6 + i * 0.7 + t * (i % 2 ? 0.09 : -0.08), 6.2 + t * 0.07 + (i % 3) * 0.5, 0.6]}><Stick a={[0, 0]} b={[-0.22, 0.12 + a * 0.3]} w={0.045} /><Stick a={[0, 0]} b={[0.22, 0.12 + a * 0.3]} w={0.045} /></Billboard>; })}
  </>;
};
const altofalantes: CenaDef = {
  Cena: Alto, ceu: CEU.ciano,
  cam: (f, dur) => {
    const c = camKeys(f, [[-6, {p: [2.4, 1.0, 7.4], l: [0, 3.2, 0], mm: 30, roll: -2}], [dur + 8, {p: [1.0, 1.3, 5.4], l: [0, 6.5, 0], mm: 34, roll: 3}]]);
    if (f > 4) c.l = [c.l[0] + 0.035 * (rnd(f * 1.3) - 0.5), c.l[1] + 0.035 * (rnd(f * 2.9) - 0.5), c.l[2]]; // micro-tremor do anúncio
    return c;
  },
};

// ------------------------------------------------------------------ 16. o novato chega e as garotas correm atrás
const Mala = () => <group position={[0, -0.2, 0]}><Forma k="mlO" mk={rrect(0.44, 0.34, 0.06)} cor="#111111" /><Forma k="ml" mk={rrect(0.38, 0.28, 0.04)} z={0.002} cor="#8A4B2A" /><Stick a={[-0.1, 0.2]} b={[0.1, 0.2]} w={0.04} /><Stick a={[-0.19, 0]} b={[0.19, 0]} w={0.03} cor="#FFD23F" z={0.004} /></group>;
const Novato = ({f}: CenaP) => {
  const foge = f >= 60, nx = f < 22 ? lerp(-5.2, -0.3, prog(f, -6, 22)) : foge ? -0.3 - (f - 60) * 0.46 : -0.3;
  const susto = f >= 50;
  return <>
    <Luzes cor="#FFF4D6" kI={3.5} dir={[7, 10, 7]} fill="#BFF0FF" chao="#3FAE49" fI={1.0} raio={15} />
    <Domo cores={DOMO.ciano} /><Chao cor="#3FAE49" s={160} />
    <Rua z={2.0} larg={4.4} />
    <Casa p={[6, 0, -4.5]} parede="#FFD166" telhado="#E63946" /><Casa p={[-9, 0, -5]} parede="#FF8FB1" telhado="#7B4BD6" /><Casa p={[15, 0, -5]} parede="#7FD8FF" telhado="#FF8A3D" />
    {[-14, -4.5, 1.8, 10.5, 19].map((x, i) => <Arvore key={i} p={[x, 0, -3.2 - (i % 2)]} s={1.4 + (i % 2) * 0.3} f={f} cor={i % 2 ? '#2E9E44' : '#49B84F'} />)}
    <Nuvem p={[-7, 8.5, -14]} s={1.7} /><Nuvem p={[6, 9.5, -15]} s={2} />
    <Cil p={[-3.6, 1.3, -1.4]} r={0.07} h={2.6} cor="#FFFFFF" /><Cil p={[-0.8, 1.3, -1.4]} r={0.07} h={2.6} cor="#FFFFFF" />
    <Caixa p={[-2.2, 2.25, -1.4]} s={[3.3, 1.15, 0.1]} cor="#0E8F6E" r={0.06} />
    <Placa k="bemvindo" w={3.1} h={0.95} px={640} pos={[-2.2, 2.25, -1.33]} draw={(g, W, H) => { g.fillStyle = '#17C3B2'; g.fillRect(0, 0, W, H); g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.font = '900 104px Montserrat'; g.fillText('BEM-VINDO', W / 2, 135, W - 40); }} />
    <Personagem {...NOVATO} f={f} pos={[nx, 0, 2.0]} flip={foge} corrida={f < 22 ? 0.6 : foge ? 1 : 0} passo={f < 22 ? 0.75 : 1} olhos={susto ? 'arregalado' : 'feliz'} boca={susto ? 'surpresa' : 'sorriso_aberto'}
      bracoE={foge ? 2.6 : susto ? 2.2 : 2.5 + 0.4 * Math.sin(f / 2.6)} bracoD={foge ? 2.6 : 0.25} segura={foge ? undefined : <Mala />}
      squash={f >= 54 && f < 60 ? 1 - 0.18 * Math.sin(prog(f, 54, 60) * PI) : f >= 60 && f < 64 ? 1.12 : 1} halo={susto ? null : '#FFF1B8'} />
    {foge ? <group position={[-0.1, 0.25 * Math.abs(Math.sin(Math.min(PI, (f - 60) / 4))), 2.3]} rotation={[0, 0, Math.min(1.5, (f - 60) * 0.2)]}><Billboard><Mala /></Billboard></group> : null}
    {foge ? <group position={[2 * nx, 0, 0]} scale={[-1, 1, 1]}><Poeira f={f} pos={[nx - 0.5, 0, 2.05]} n={6} /></group> : null}
    {f >= 14 && f < 50 ? <Billboard pos={[-0.3, 2.6, 1.9]}><group scale={pop(f, 14, 7)} rotation={[0, 0, 0.1 * Math.sin(f / 5)]}>
      <Estrela2D s={1.45} cor="#111111" rot={f / 30} /><Estrela2D s={1.3} z={0.004} cor="#FFD23F" rot={f / 30} />
    </group></Billboard> : null}
    {f >= 14 && f < 50 ? <Billboard pos={[-0.3, 2.6, 1.95]}><Placa k="novo" w={0.8} h={0.25} px={320} escala={pop(f, 14, 7)} draw={(g, W, H) => { g.fillStyle = '#E8174B'; g.textAlign = 'center'; g.font = '900 86px Montserrat'; g.fillText('NOVO!', W / 2, 84); }} /></Billboard> : null}
    {Array.from({length: 18}).map((_, i) => { const G = garota(i + 70), x = 13 + i * 0.75 + rnd(i) * 0.6 - Math.max(0, f - 50) * 0.5;
      if (x > 13 || x < -22) return null;
      return <Personagem key={i} {...G} f={f} pos={[x, 0, 0.9 + (i % 4) * 0.75]} flip corrida={1} olhos="coracao" boca="sorriso_aberto" bracoE={1.7 + 0.3 * Math.sin(f / 2 + i)} bracoD={1.7} />; })}
    {f > 54 ? <><group position={[2 * (13 - (f - 50) * 0.5) + 2, 0, 0]} scale={[-1, 1, 1]}><Poeira f={f} pos={[13 - (f - 50) * 0.5, 0, 2.6]} n={7} seed={3} /></group>
      <Coracoes f={f} n={20} seed={12} centro={[17 - (f - 50) * 0.5, 1.5, 2]} area={[9, 3]} altura={2.6} vida={34} s={0.3} /></> : null}
  </>;
};
const novato: CenaDef = {
  Cena: Novato, ceu: CEU.ciano,
  cam: (f, dur) => camKeys(f, [
    [-6, orb([-1.6, 1.2, 2.0], 5.4, 1.4, -12, 40, -2)],
    [44, orb([-0.2, 1.25, 2.0], 4.1, 1.35, 5, 40, 0)],
    [62, {p: [0.9, 1.9, 9.0], l: [-0.6, 1.15, 2.0], mm: 28, roll: 0}, eIO],
    [dur + 10, {p: [-3.9, 1.8, 8.4], l: [-5.4, 1.15, 2.0], mm: 28, roll: 2}],
  ]),
};

// ------------------------------------------------------------------ 17. finalmente, sossego
const Sossego = ({f, fundo, frente}: CenaP) => {
  const ufa = prog(f, 0, 12);
  return <>
    <Luzes cor={K.k4500} kI={2.9} dir={[5, 8, 9]} fill="#FFD0E0" chao="#C96A2B" fI={1.1} raio={10} />
    {fundo ? <>
      <Chao cor="#F4A261" s={40} pad="madeira" lado={2} /><Parede p={[0, 4, -2.2]} s={[40, 10]} cor="#FF7FA8" pad="coracoes" />
      <Caixa p={[1.6, 1.12, -2.15]} s={[1.3, 2.24, 0.12]} cor="#FFFFFF" /><Caixa p={[1.6, 1.07, -2.1]} s={[1.06, 2.06, 0.1]} cor="#C81D4E" /><Caixa p={[1.6, 1.5, -2.03]} s={[0.5, 0.5, 0.03]} cor="#FFE8A3" sombra={false} />
      <Caixa p={[-2.4, 2.6, -2.15]} s={[1.9, 2.1, 0.1]} cor="#FFFFFF" /><Caixa p={[-2.4, 2.6, -2.1]} s={[1.6, 1.8, 0.08]} cor="#5EC2FF" rough={0.2} sombra={false} />
      <SofaCoracao p={[-2.3, 0, -0.9]} s={0.8} /><Estatua p={[3.4, 0, -1.2]} rot={-0.4} />
    </> : null}
    {frente ? <>
      <Personagem {...LEO} f={f} pos={[0, 0, 0.5]} olhos={f < 8 ? 'fechado' : 'feliz'} boca={f < 10 ? 'fala_o' : 'sorriso'} squash={f < 12 ? 1.08 - 0.16 * Math.sin(ufa * PI) : 1}
        bracoE={f < 16 ? 0.2 : lerp(0.2, 2.45, back(prog(f, 16, 28)))} bracoD={f < 16 ? 0.2 : lerp(0.2, 2.45, back(prog(f, 18, 30)))} inclina={f > 20 ? -0.06 : 0} halo="#FFE9A8" />
      {[0, 1, 2].map((i) => { const t = prog(f, 2 + i * 3, 22 + i * 3); return t > 0 && t < 1 ? <Billboard key={i} pos={[0.35 + t * 0.9, 1.2 + t * 0.25 + i * 0.05, 0.6]}><Disc r={0.1 + t * 0.14} cor="#FFFFFF" op={0.8 * (1 - t)} /></Billboard> : null; })}
      {f > 26 ? [0, 1, 2].map((i) => <Billboard key={i} pos={[-0.7 + i * 0.7, 2.15 + 0.12 * Math.sin(f / 5 + i), 0.5]}><Estrela2D s={0.2 + 0.06 * Math.sin(f / 3 + i)} rot={f / 8} cor="#FFD23F" /></Billboard>) : null}
    </> : null}
  </>;
};
const sossego: CenaDef = {
  Cena: Sossego, ceu: '#FF7FA8', dof: 4,
  cam: (f, dur) => camKeys(f, [[-6, orb([-0.5, 1.2, 0.5], 4.7, 1.45, -5, 38, -2)], [dur + 8, orb([0.35, 1.25, 0.5], 3.8, 1.35, 1, 38, 1.5)]]),
};

// ------------------------------------------------------------------ 18. a rua: Leo se alonga, o novato vem correndo ao fundo
const nvX = (f: number) => lerp(-44, -1.5, prog(f, 30, 92));
const RuaAberta = ({f}: CenaP) => {
  const alonga = back(prog(f, 12, 24), 2.4) * (1 - prog(f, 44, 54));
  const ve = f >= 72;
  return <>
    <Luzes cor={K.k4800} kI={3.1} dir={[6, 9, 8]} fill="#BFE4FF" fI={1.05} raio={16} />
    <Bairro f={f} portaAng={1.7} ceu="ciano" />
    <Personagem {...LEO} f={f} pos={[2.5, 0, 6.35]} flip={ve} olhos={ve ? 'arregalado' : f < 44 ? 'fechado' : 'feliz'} boca={ve ? 'surpresa' : 'sorriso'}
      squash={f >= 6 && f < 12 ? 1 - 0.1 * Math.sin(prog(f, 6, 12) * PI) : 1 + 0.07 * alonga} bracoE={lerp(0.2, 2.45, alonga)} bracoD={lerp(0.2, 2.45, alonga)} cabecaRot={ve ? 0.1 : -0.06 * alonga} />
    {f >= 30 ? <>
      <Personagem {...NOVATO} f={f} pos={[nvX(f), 0, 7.7]} corrida={1} frontal olhos="coracao" boca="sorriso_aberto" bracoD={2.5} bracoE={1.6} segura={<group scale={1.3}><Buque2D /></group>} />
      <Coracoes f={f} n={12} seed={13} centro={[nvX(f) - 1.5, 1.6, 7.7]} area={[4, 1]} altura={2.4} vida={30} s={0.34} />
      <Poeira f={f} pos={[nvX(f) - 0.4, 0, 7.7]} n={6} />
    </> : null}
    {f < 30 ? [0, 1].map((i) => <Billboard key={i} pos={[-2 + i * 1.3 + f * 0.05, 4.6 + i * 0.4 + 0.2 * Math.sin(f / 5 + i), 5]}><Stick a={[0, 0]} b={[-0.2, 0.1 + 0.1 * Math.sin(f + i)]} w={0.04} /><Stick a={[0, 0]} b={[0.2, 0.1 + 0.1 * Math.sin(f + i)]} w={0.04} /></Billboard>) : null}
    {ve ? <Billboard pos={[2.5, 2.2, 6.35]}><group scale={pop(f, 72, 6)}><Stick a={[0, 0.12]} b={[0, 0.5]} w={0.12} cor="#E8274B" /><Disc r={0.07} cor="#E8274B" /></group></Billboard> : null}
  </>;
};
const rua: CenaDef = {
  Cena: RuaAberta, ceu: CEU.ciano,
  cam: (f, dur) => camKeys(f, [
    [-6, {p: [6.6, 1.5, 6.5], l: [-6, 1.35, 8.7], mm: 30, roll: -2}],
    [dur + 8, {p: [5.6, 1.45, 7.1], l: [-6, 1.15, 6.3], mm: 33, roll: 2}],
  ]),
};

// ------------------------------------------------------------------ 20. close extremo do Leo
const CloseLeo = ({f}: CenaP) => <>
  <Personagem {...LEO} f={f} olhos="arregalado" boca={f < 14 ? 'surpresa' : 'dentes'} piscar={false} squash={1 + 0.14 * Math.exp(-f / 3)} cabecaDx={0.02 * Math.sin(f * 2.2)} sombra={false} halo="#FFFFFF" bracoE={2.6} bracoD={2.6} />
  {[0, 1, 2, 3].map((i) => { const t = ((f + i * 5) % 16) / 16; return <Billboard key={i} pos={[(i % 2 ? 1 : -1) * (0.42 + t * 0.35), 1.6 + t * 0.3 - (i > 1 ? 0.25 : 0), 0.1]}><Disc rx={0.04} ry={0.065} rot={(i % 2 ? -1 : 1) * 0.6} cor="#5EC2FF" op={1 - t} /></Billboard>; })}
</>;
const closeleo: CenaDef = {
  Cena: CloseLeo,
  ceu: (f) => `repeating-conic-gradient(from ${f * 3}deg at 50% 49%, #FF2E78 0deg 9deg, #D4124A 9deg 18deg)`,
  cam: (f, dur) => camKeys(f, [[0, {p: [0, 1.36, 2.3], l: [0, 1.33, 0], mm: 62, roll: -3}], [dur + 4, {p: [0, 1.36, 1.85], l: [0, 1.33, 0], mm: 62, roll: 3}]]),
};

// ------------------------------------------------------------------ 21. perseguição final
const LX = (f: number) => -12 + f * 0.36;
const Perseguicao = ({f}: CenaP) => {
  const x = LX(f), nx = x - 1.75 + 0.2 * Math.sin(f / 9), ciclo = (f % 14) / 14;
  return <>
    <Luzes cor="#FFC9A0" kI={3.0} dir={[-6, 7, 8]} fill="#FFB3CF" chao="#C22F63" fI={1.15} raio={18} />
    <Bairro f={f} grama="#F0528A" ceu="quente" />
    <Personagem {...LEO} f={f} pos={[x, 0, 6.3]} corrida={1} olhos="arregalado" boca={f % 8 < 4 ? 'fala_a' : 'dentes'} bracoE={2.5 + 0.3 * Math.sin(f)} bracoD={2.5 + 0.3 * Math.cos(f)} />
    <Poeira f={f} pos={[x - 0.45, 0, 6.3]} n={6} />
    {[0, 1, 2, 3].map((i) => <PlanoFlat key={i} p={[x - 1.1 - i * 0.45, 0.6 + i * 0.3, 6.25]} s={[1.2 - i * 0.2, 0.035]} cor="#FFFFFF" op={0.7} />)}
    <Personagem {...NOVATO} f={f} fase={0.4} pos={[nx, 0, 6.75]} corrida={1} olhos="coracao" boca="beijo" bracoD={ciclo < 0.4 ? 2.9 : 1.5} bracoE={2.2} />
    <Poeira f={f} pos={[nx - 0.45, 0, 6.75]} n={5} seed={2} />
    {[0, 1, 2, 3, 4].map((i) => { const t = (((f + i * 5) % 22) + 22) % 22 / 22;
      return <Billboard key={i} pos={[lerp(nx + 0.3, x + 0.2, t), 1.3 + 0.7 * Math.sin(t * PI) + 0.1 * i, 6.5]}><Coracao2D s={0.24 + 0.18 * Math.sin(t * PI)} rot={0.3 * Math.sin(f / 3 + i)} cor={i % 2 ? '#FF2E6E' : '#E8274B'} /></Billboard>; })}
    <Coracoes f={f} n={22} seed={14} centro={[x - 1, 1.4, 6.5]} area={[7, 2.5]} altura={3.2} vida={34} s={0.32} />
  </>;
};
const perseguicao: CenaDef = {
  Cena: Perseguicao, ceu: CEU.quente,
  cam: (f) => {
    const x = LX(f), t = prog(f, 0, 40);
    return {p: [x + lerp(4.6, 3.2, t), 1.55, 6.3 + lerp(5.4, 4.3, t)], l: [x + 0.22 * Math.sin(f / 9) * (1 - prog(f, 30, 39)), 1.33 + 0.05 * Math.sin(f / 6) * (1 - prog(f, 30, 39)), 6.3], mm: 30, roll: 2.5 * Math.sin(f / 16)};
  },
};

export const cenasC = {altofalantes, novato, sossego, rua, closeleo, perseguicao};
