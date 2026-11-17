// Planos 2, 3, 4, 6, 7 e 8: porta/montanha, sala de aula, lista de espera, calendário, a lei e os presentes.
import React from 'react';
import * as THREE from 'three';
import {back, camKeys, clamp, eIO, eOut, lerp, orb, PI, pop, prog, queda, quique, rnd, sIO, V3} from '../anim';
import {Arvore, Billboard, Bolo, Brilho, Buque, Caixa, Carta, Chao, Cil, Coracao2D, Coracoes, Disc, Domo, Esfera, Estrela2D, Forma, garota, K, LEO, Luzes, Parede, Personagem, Placa, PlanoFlat, Poeira, Presente, rrect, Stick, Urso, verniz} from '../kit';
import {Bairro, CenaDef, CenaP, CEU, DOMO} from './tipos';

const CORES = ['#FF4F8B', '#8E5BE8', '#17C3B2', '#FFB020', '#3FA7F5', '#F25C54', '#43B66B', '#FF8A3D'];

// ------------------------------------------------------------------ 2. porta + montanha
const MZ = 5.5;
const morro = (x: number, z: number) => 1.75 * Math.max(0, 1 - Math.pow(Math.hypot(x / 2.3, (z - MZ) / 1.75), 2));
const ITENS = (() => {
  const h = new Map<string, number>();
  return Array.from({length: 104}).map((_, i) => {
    const ang = rnd(i * 1.9) * 2 * PI, rr = Math.pow(rnd(i * 2.7), 0.7);
    const x = rr * Math.cos(ang) * 2.25, z = MZ + rr * Math.sin(ang) * 1.6;
    const k = Math.round(x / 0.5) + ',' + Math.round(z / 0.5), s = 0.4 + rnd(i * 3.3) * 0.26;
    const y = morro(x, z) + (h.get(k) ?? 0) + s * 0.3;
    h.set(k, (h.get(k) ?? 0) + s * 0.55);
    return {x, y, z, s, tipo: i % 4, pouso: i < 30 ? -99 : Math.round(6 + (i - 30) * 1.75 + rnd(i) * 3), rot: [rnd(i * 5) * 0.8 - 0.4, rnd(i * 6) * 6.28, rnd(i * 7) * 0.8 - 0.4] as V3, cor: CORES[i % CORES.length], fita: i % 3 ? '#FFD23F' : '#FFFFFF'};
  });
})();
const Pa = () => <group rotation={[0, 0, -0.5]}>
  <Stick a={[0, -0.25]} b={[0, 0.75]} w={0.06} cor="#111111" /><Stick a={[0, -0.25]} b={[0, 0.75]} w={0.035} cor="#B5763A" z={0.002} />
  <Forma k="paO" mk={rrect(0.36, 0.42, 0.1)} y={0.95} cor="#111111" /><Forma k="pa" mk={rrect(0.3, 0.36, 0.08)} y={0.95} z={0.002} cor="#C9D3E0" />
</group>;
const Porta = ({f}: CenaP) => {
  const ang = 1.75 * back(prog(f, 4, 17), 1.6);
  const topo = f >= 104;
  const sobe = back(prog(f, 116, 130), 2.4);
  return <>
    <Luzes cor={K.k4800} kI={3.0} dir={[6, 9, 8]} fill="#BFE4FF" fI={1.05} />
    <Bairro f={f} portaAng={ang} />
    <Esfera p={[0, 0, MZ]} r={1} escala={[2.5, 1.75, 1.9]} cor="#C92E6B" />
    {ITENS.map((it, i) => {
      const q = it.pouso < 0 ? {y: 0, sq: 1, vis: true} : queda(f, it.pouso, 9, 13);
      if (!q.vis) return null;
      const gira = it.pouso < 0 ? 0 : clamp((it.pouso - f) / 13) * 5;
      const p: V3 = [it.x, it.y + q.y, it.z], rot: V3 = [it.rot[0] + gira, it.rot[1], it.rot[2] + gira * 0.7];
      if (it.tipo === 0) return <Presente key={i} p={p} s={it.s} cor={it.cor} fita={it.fita} rot={rot} escala={[1 / Math.sqrt(q.sq), q.sq, 1 / Math.sqrt(q.sq)]} />;
      if (it.tipo === 1) return <Carta key={i} p={p} rot={rot} s={it.s * 2.1} cor={i % 8 === 1 ? '#FFC2D9' : '#FFF7E8'} />;
      if (it.tipo === 2) return <Urso key={i} p={p} rot={[rot[0] * 0.5, rot[1], rot[2] * 0.5]} s={it.s * 1.5} cor={i % 8 === 2 ? '#E8A45C' : '#B5763A'} />;
      return <Buque key={i} p={p} rot={[rot[0] + 0.9, rot[1], rot[2]]} s={it.s * 1.9} />;
    })}
    {!topo ? <Personagem {...LEO} f={f} pos={[0.05, 0.14, 1.95]} escala={f < 4 ? 0.001 : 1} olhos="entediado" boca="neutra" bracoD={1.25 + 0.75 * Math.sin(f / 3.2)} bracoE={0.3} segura={<Pa />} squash={1 + 0.04 * Math.sin(f / 3.2)} />
      : <Personagem {...LEO} f={f} escala={1.3} pos={[0.1, lerp(-0.9, 1.72, sobe), MZ - 0.1]} olhos="entediado" boca={f > 150 ? 'triste' : 'neutra'} bracoD={2.75} bracoE={0.5 + 0.3 * Math.sin(f / 6)} segura={<Pa />} squash={1 + 0.1 * (1 - sobe)} sombra={false} />}
    {f > 112 && f < 136 ? <Poeira f={f} pos={[0.8, 2.2, MZ]} n={6} /> : null}
    <Coracoes f={f} n={10} seed={3} centro={[0, 2.2, MZ]} area={[4.5, 3]} altura={3} s={0.3} />
  </>;
};
const porta: CenaDef = {
  Cena: Porta, ceu: CEU.azul,
  cam: (f, dur) => camKeys(f, [
    [-6, {p: [1.5, 1.5, 3.75], l: [0.55, 1.2, 1.8], mm: 30, roll: -2}],
    [84, {p: [0.2, 1.5, 3.3], l: [-0.2, 1.25, 1.8], mm: 30, roll: 1}],
    [108, {p: [-2.6, 3.6, 12.0], l: [0, 1.85, MZ], mm: 32, roll: 0}, eIO],
    [dur + 10, {p: [-0.9, 3.1, 10.8], l: [1.1, 2.3, MZ], mm: 32, roll: 2}],
  ]),
};

// ------------------------------------------------------------------ 3. sala de aula
const Carteira = ({p, cor = '#F2C078'}: {p: V3; cor?: string}) => <group position={p}>
  <Caixa p={[0, 0.74, 0]} s={[1.0, 0.07, 0.6]} cor={cor} r={0.03} />
  {[[-0.44, -0.24], [0.44, -0.24], [-0.44, 0.24], [0.44, 0.24]].map((q, i) => <Caixa key={i} p={[q[0], 0.36, q[1]]} s={[0.06, 0.72, 0.06]} cor="#3B3B4F" r={0.02} />)}
</group>;
const Cadeira = ({p, cor = '#E63946', escala = 1}: {p: V3; cor?: string; escala?: number}) => <group position={p} scale={escala}>
  <Caixa p={[0, 0.45, 0]} s={[0.5, 0.07, 0.5]} cor={cor} r={0.03} /><Caixa p={[0, 0.82, -0.22]} s={[0.5, 0.5, 0.07]} cor={cor} r={0.03} />
  {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map((q, i) => <Caixa key={i} p={[q[0], 0.22, q[1]]} s={[0.05, 0.44, 0.05]} cor="#3B3B4F" r={0.02} />)}
</group>;
const BRIGA = Array.from({length: 16}).map((_, i) => {
  const a = -0.3 + (i / 15) * 1.75, r = 0.55 + (i % 4) * 0.42 + rnd(i * 3) * 0.2;
  return {x: 0.55 + r * Math.cos(a) * 0.62, z: 0.25 - r * Math.sin(a) * 0.9, i};
});
const Sala = ({f, fundo, frente}: CenaP) => <>
  <Luzes cor={K.k3400} kI={3.3} dir={[-8, 6.5, 4]} fill="#FFD9A0" chao="#B5651D" fI={1.0} rI={0.9} raio={9} />
  {fundo ? <>
    <Chao cor="#C97B2A" s={40} pad="madeira" lado={2} />
    <Parede p={[0, 4, -4.2]} s={[30, 9]} cor="#E0902E" pad="listras" />
    <Caixa p={[1.2, 2.5, -4.1]} s={[4.6, 2.2, 0.1]} cor="#7A4A1E" /><Caixa p={[1.2, 2.5, -4.03]} s={[4.3, 1.9, 0.06]} cor="#1F6B45" sombra={false} />
    <Caixa p={[-5.2, 2.6, -4.12]} s={[2.4, 2.6, 0.08]} cor="#FFF4D0" rough={0.3} />
    <Brilho pos={[-5.2, 2.6, -3.8]} s={7} cor="#FFE9B0" op={0.6} />
    {[0, 1, 2].map((i) => <PlanoFlat key={i} p={[-2.6 + i * 1.5, 2.0, -3.4 + i * 0.4]} s={[1.0, 7.5]} rot={[0, 0, 1.0]} cor="#FFE9B0" op={0.13} />)}
    {[-2.8, -0.9, 1.0, 2.9].map((x, i) => <group key={i}><Carteira p={[x, 0, -2.2]} /><Cadeira p={[x, 0, -2.75]} cor="#3FA7F5" /></group>)}
  </> : null}
  {frente ? <>
    <Carteira p={[-0.6, 0, 0.75]} /><Carteira p={[0.5, 0, 0.75]} />
    <Cadeira p={[0.4, 0, 0.2]} escala={1 + 0.05 * Math.sin(f / 2)} />
    <Brilho pos={[0.4, 1.0, 0.3]} s={2.6} cor="#FFE08A" op={0.5} />
    <Personagem {...LEO} f={f} pos={[-0.62, 0, 0.2]} olhos="preocupado" boca="dentes" cabecaDx={-0.05 + 0.02 * Math.sin(f / 3)} inclina={0.1} bracoE={0.7} bracoD={0.1} halo="#FFE0A0" />
    <Billboard pos={[-1.04, 1.55 - ((f % 20) / 20) * 0.3, 0.25]}><Disc rx={0.045} ry={0.07} cor="#5EC2FF" /></Billboard>
    {BRIGA.map((b) => {
      const G = garota(b.i + 60), t = f / 4 + G.fase * 6.28;
      const pula = b.i % 3 === 0 ? 0.35 * Math.abs(Math.sin(f / 5 + b.i)) : 0;
      return <Personagem key={b.i} {...G} pos={[b.x + 0.16 * Math.sin(t) - 0.25 * (1 - eOut(prog(f, -10, 30))) * b.x, 0, b.z + 0.05 * Math.cos(t * 1.3)]} f={f} flip olhos={b.i % 4 === 0 ? 'coracao' : 'bravo'} boca={b.i % 2 ? 'dentes' : 'fala_a'}
        pulo={pula} squash={1 + pula * 0.25} inclina={0.2 + 0.1 * Math.sin(t)} bracoE={1.5 + 0.5 * Math.sin(t * 1.4)} bracoD={2.2 + 0.5 * Math.cos(t)} />;
    })}
    {[0, 1, 2, 3, 4].map((i) => <Billboard key={i} pos={[0.75 + 0.4 * Math.sin(f / 3 + i * 1.3), 1.0 + 0.45 * Math.cos(f / 2.5 + i * 2), 0.9]}><Disc r={0.26 + 0.1 * Math.sin(f / 2 + i)} cor="#FFFFFF" op={0.8} /></Billboard>)}
    {[0, 1, 2].map((i) => <Billboard key={i} pos={[0.7 + 0.6 * Math.sin(f / 4 + i * 2.1), 1.5 + 0.5 * Math.cos(f / 3 + i), 1.0]}><Estrela2D s={0.3} rot={f / 5 + i} cor="#FFD23F" /></Billboard>)}
  </> : null}
</>;
const sala: CenaDef = {
  Cena: Sala, ceu: '#E0902E', dof: 4,
  cam: (f, dur) => camKeys(f, [[-8, orb([1.1, 1.1, 0.3], 5.5, 1.55, 7, 30, 2)], [dur + 8, orb([-0.5, 1.1, 0.3], 4.5, 1.4, 2, 30, -1)]]),
};

// ------------------------------------------------------------------ 4. lista de espera
const NOMES = ['Ana', 'Bia', 'Carol', 'Duda', 'Eva', 'Fê', 'Gabi', 'Helô', 'Isa', 'Júlia', 'Kika', 'Lara', 'Malu', 'Nina', 'Olívia', 'Pri', 'Quel', 'Rafa', 'Sofi', 'Tati', 'Úrsula', 'Vivi'];
const Lista = ({f, fundo, frente}: CenaP) => {
  const carimbo = pop(f, 47, 7);
  return <>
    <Luzes cor={K.k3400} kI={2.6} dir={[-5, 7, 8]} fill="#FFD9A0" chao="#B5651D" fI={1.2} />
    {fundo ? <>
      <Parede p={[0, 4, -0.3]} s={[30, 14]} cor="#E0902E" /><Chao cor="#C97B2A" s={30} pad="madeira" lado={2} />
      <Caixa p={[0.2, 3.2, -0.2]} s={[2.75, 5.8, 0.14]} cor="#7A4A1E" r={0.08} />
      <Placa k="lista" w={2.4} h={5.4} px={600} pos={[0.2, 3.2, -0.1]} draw={(g, W, H) => {
        g.fillStyle = '#1F6B45'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.font = '900 56px Montserrat'; g.fillText('LISTA DE ESPERA', W / 2, 100, W - 40);
        g.fillStyle = '#FFD23F'; g.fillRect(50, 126, W - 100, 8);
        g.textAlign = 'left'; g.font = '800 44px Montserrat';
        NOMES.forEach((n, i) => { g.fillStyle = i % 2 ? '#DDF5E6' : '#FFFFFF'; g.fillText(`${i + 1}.`, 60, 206 + i * 51); g.fillText(n, 160, 206 + i * 51); g.fillStyle = '#FF7FB0'; g.fillText('♥', 500, 206 + i * 51); });
      }} />
      {carimbo > 0 ? <Placa k="carimbo" w={2.0} h={0.8} px={400} pos={[0.55, 2.3, 0.0]} rot={[0, 0, -0.25]} escala={carimbo * (1 + 0.5 * (1 - prog(f, 47, 52)))} draw={(g, W, H) => {
        g.strokeStyle = '#E8174B'; g.lineWidth = 14; g.strokeRect(12, 12, W - 24, H - 24);
        g.fillStyle = '#E8174B'; g.textAlign = 'center'; g.font = '900 86px Montserrat'; g.fillText('OFICIAL', W / 2, H / 2 + 30);
      }} /> : null}
    </> : null}
    {frente ? <Personagem f={f} pos={[-0.75, 0, 1.5]} corpo="#8B5A2B" cabelo="grisalho" cabeloCor="#C9CDD6" acess="oculos" acessCor="#111111" olhos="entediado" boca={f % 8 < 4 ? 'fala_o' : 'neutra'}
      bracoD={2.35 + 0.18 * Math.sin(f / 4)} bracoE={0.2} segura={<Stick a={[0, 0]} b={[0.5, 0.75]} w={0.035} cor="#F5E6C8" />} halo="#FFE0A0" /> : null}
  </>;
};
const lista: CenaDef = {
  Cena: Lista, ceu: '#E0902E', dof: 0,
  cam: (f, dur) => camKeys(f, [[-6, {p: [0.9, 4.2, 5.6], l: [0.2, 4.2, 0], mm: 45, roll: -2}], [dur + 8, {p: [-0.3, 1.75, 5.2], l: [0, 1.85, 0], mm: 45, roll: 2}]]),
};

// ------------------------------------------------------------------ 6. calendário
const Calendario = ({f, fundo, frente}: CenaP) => {
  const volta = Math.round(clamp((f - 14) / 14) * 16) / 16;
  return <>
    <Luzes cor={K.k4500} kI={2.2} dir={[4, 6, 9]} fill="#FFD0D0" chao="#B03A3A" fI={1.35} />
    {fundo ? <>
      <Parede p={[0, 3, -0.2]} s={[40, 16]} cor="#FF5E57" />
      <Caixa p={[0.06, 2.14, -0.12]} s={[2.5, 3.1, 0.06]} cor="#B3261E" r={0.06} />
      <Placa k="cal" w={2.4} h={3.0} px={768} pos={[0, 2.2, -0.05]} draw={(g, W, H) => {
        g.fillStyle = '#FFFDF7'; g.fillRect(0, 0, W, H); g.fillStyle = '#E8274B'; g.fillRect(0, 0, W, 200);
        g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.font = '900 112px Montserrat'; g.fillText('MARÇO', W / 2, 142);
        g.font = '900 44px Montserrat';
        'DSTQQSS'.split('').forEach((c, i) => { g.fillStyle = i === 0 ? '#E8274B' : '#2B1840'; g.fillText(c, 64 + i * 106.7, 285); });
        g.font = '900 54px Montserrat';
        for (let d = 1; d <= 31; d++) { const k = d + 2; g.fillStyle = k % 7 === 0 ? '#E8274B' : '#2B1840'; g.fillText(String(d), 64 + (k % 7) * 106.7, 378 + Math.floor(k / 7) * 110); }
      }} />
      {volta > 0 ? <mesh position={[0.667, 1.9, 0.0]} rotation={[0, 0, PI / 2]}><ringGeometry args={[0.2, 0.25, 40, 1, 0, volta * 2 * PI]} /><meshBasicMaterial color="#E8274B" toneMapped={false} /></mesh> : null}
      <group position={[0.98, 2.2, 0.02]} scale={pop(f, 28, 8)}><Coracao2D s={0.36} cor="#111111" /><Coracao2D s={0.29} z={0.004} cor="#FF2E6E" /></group>
      <Placa k="aniv" w={2.2} h={0.42} px={640} pos={[0, 0.98, 0.0]} escala={pop(f, 38, 8)} draw={(g, W, H) => { g.fillStyle = '#E8274B'; g.textAlign = 'center'; g.font = '900 86px Montserrat'; g.fillText('MEU ANIVERSÁRIO!', W / 2, 92, W - 10); }} />
    </> : null}
    {frente ? <>
      {[0, 1, 2, 3, 4, 5].map((i) => { const x = [-1.25, -0.9, 1.0, 1.3, -1.5, 1.55][i], y = -1.5 + (f + 12) * 0.075 * (0.8 + rnd(i) * 0.5) + 0.1 * Math.sin(f / 9 + i);
        return <group key={i} position={[x + 0.12 * Math.sin(f / 14 + i * 2), y, 0.9 + (i % 2) * 0.3]}><Esfera r={0.36} escala={[1, 1.18, 1]} cor={CORES[(i * 3) % 8]} rough={0.25} /><Cil p={[0, -0.9, 0]} r={0.008} h={1.0} cor="#FFFFFF" seg={4} /></group>; })}
      {Array.from({length: 46}).map((_, i) => { const t = f - 26 - rnd(i) * 22; if (t < 0) return null;
        return <mesh key={i} position={[(rnd(i * 2.1) - 0.5) * 5, 5 - t * 0.085 * (0.7 + rnd(i * 3) * 0.6), 0.6 + rnd(i * 4) * 1.2]} rotation={[t * 0.3 + i, t * 0.2, i]} scale={[0.11, 0.06, 1]}><planeGeometry /><meshBasicMaterial color={CORES[i % 8]} side={2} toneMapped={false} /></mesh>; })}
      <Personagem {...LEO} f={f} pos={[0.95, -0.55, 1.6]} olhos="entediado" boca="triste" sombra={false} cabecaRot={-0.1} />
    </> : null}
  </>;
};
const calendario: CenaDef = {
  Cena: Calendario, ceu: '#FF5E57', dof: 0,
  cam: (f, dur) => camKeys(f, [[-4, {p: [0.15, 2.35, 3.3], l: [0, 2.3, 0], mm: 50, roll: -1}], [dur + 8, {p: [1.0, 1.95, 5.3], l: [0.3, 1.95, 0], mm: 50, roll: 3}]]),
};

// ------------------------------------------------------------------ 7. a lei
const Martelo = () => <group rotation={[0, 0, -0.3]}><Stick a={[0, 0]} b={[0, 0.5]} w={0.05} cor="#111111" /><Stick a={[0, 0]} b={[0, 0.5]} w={0.028} cor="#B5763A" z={0.002} />
  <Forma k="mtO" mk={rrect(0.42, 0.22, 0.05)} y={0.55} cor="#111111" /><Forma k="mt" mk={rrect(0.36, 0.16, 0.04)} y={0.55} z={0.002} cor="#8A4B2A" /></group>;
const Lei = ({f}: CenaP) => {
  const bate = f < 22 ? 0.6 : f < 28 ? lerp(0.6, 2.9, eOut(prog(f, 22, 28))) : f < 32 ? lerp(2.9, 0.9, prog(f, 28, 32)) : lerp(0.9, 2.2, back(prog(f, 34, 46)));
  const faixa = quique(prog(f, 46, 62));
  return <>
    <Luzes cor={K.k4500} kI={3.0} dir={[6, 9, 9]} fill="#FFE2A8" chao="#C96A2B" fI={1.1} raio={12} />
    <Domo cores={DOMO.ouro} /><Chao cor="#F08A4B" s={120} pad="ladrilho" lado={2.4} />
    <Caixa p={[0, 0.12, 2.4]} s={[10.5, 0.24, 4.6]} cor="#FFF1D6" /><Caixa p={[0, 0.34, 1.6]} s={[9.6, 0.24, 3.2]} cor="#FFE9C2" />
    <Caixa p={[0, 3.0, -1.2]} s={[9.2, 5.4, 2.6]} cor="#FFE2A8" />
    <Caixa p={[0, 1.7, 0.12]} s={[1.6, 2.6, 0.1]} cor="#7A2E1E" />
    {[-3.9, -2.4, -0.95, 0.95, 2.4, 3.9].map((x, i) => <group key={i}><Cil p={[x, 2.85, 1.1]} r={0.3} h={4.8} cor="#FFFFFF" /><Caixa p={[x, 0.55, 1.1]} s={[0.82, 0.22, 0.82]} cor="#FFFFFF" /><Caixa p={[x, 5.3, 1.1]} s={[0.82, 0.2, 0.82]} cor="#FFFFFF" /></group>)}
    <Caixa p={[0, 5.72, 0.3]} s={[9.6, 0.5, 2.6]} cor="#FFFFFF" />
    <mesh position={[0, 5.95, 0.3]} castShadow><extrudeGeometry args={[(() => { const s = new THREE.Shape(); s.moveTo(-4.9, 0); s.lineTo(4.9, 0); s.lineTo(0, 1.9); return s; })(), {depth: 2.4, bevelEnabled: false}]} /><meshStandardMaterial color="#FFD166" roughness={0.7} /></mesh>
    <Billboard pos={[0, 6.65, 2.75]} k={0}><Estrela2D s={0.8} cor="#E8274B" rot={f / 40} /></Billboard>
    <group position={[0, 5.15, 1.55]}>
      <Caixa p={[0, 0.05, 0]} s={[3.9, 0.14, 0.14]} cor="#B3261E" />
      <Placa k="faixa" w={3.6} h={1.2} px={1024} pos={[0, -0.6 * faixa, 0.02]} escala={[1, Math.max(0.001, faixa), 1]} lit draw={(g, W, H) => {
        g.fillStyle = '#D61F45'; g.fillRect(0, 0, W, H); g.strokeStyle = '#FFD23F'; g.lineWidth = 12; g.strokeRect(14, 14, W - 28, H - 28);
        g.textAlign = 'center'; g.fillStyle = '#FFD23F'; g.font = '900 120px Montserrat'; g.fillText('FERIADO OFICIAL', W / 2, 150, W - 80);
        g.fillStyle = '#FFFFFF'; g.font = '900 78px Montserrat'; g.fillText('ANIVERSÁRIO DO LEO', W / 2, 270, W - 90);
      }} />
    </group>
    <Caixa p={[0, 0.9, 3.3]} s={[1.3, 0.95, 0.7]} cor="#8A4B2A" r={0.08} /><Cil p={[0, 0.95, 3.67]} r={0.26} h={0.04} rot={[PI / 2, 0, 0]} cor="#FFD23F" rough={0.3} />
    <Personagem f={f} pos={[0, 0.82, 2.75]} corpo="#6B3FA0" cabelo="coque" cabeloCor="#8A3B12" faixa="#FFD23F" acess="oculos" acessCor="#111111" olhos={f < 46 ? 'bravo' : 'feliz'} boca={f > 6 && f < 46 ? (Math.floor(f / 3) % 2 ? 'fala_a' : 'fala_o') : 'sorriso_aberto'}
      bracoD={bate} bracoE={f > 46 ? 2.6 : 0.6} segura={<Martelo />} squash={f >= 32 && f < 40 ? 0.9 + 0.1 * prog(f, 32, 40) : 1} sombra={false} halo="#FFF1B8" />
    {f >= 32 && f < 40 ? <Billboard pos={[0.55, 1.7, 3.6]}><Estrela2D s={0.9 * (1 - prog(f, 32, 40)) + 0.3} cor="#FFFFFF" rot={f} /></Billboard> : null}
    {Array.from({length: 7}).map((_, i) => { const G = garota(i + 90), festa = f > 48;
      return <Personagem key={i} {...G} sombra={false} pos={[-1.75 + i * 0.58 + rnd(i) * 0.1, -0.95 - (i % 2) * 0.12, 5.9 + (i % 3) * 0.3]} f={f} olhos="nenhum" boca="neutra" naCabeca={<Disc r={0.345} z={0.04} cor={G.cabeloCor} />}
        pulo={festa ? 0.4 * Math.abs(Math.sin(f / 4 + i)) : 0.04 * Math.abs(Math.sin(f / 6 + i))} bracoE={festa ? 2.7 : 0.3} bracoD={festa ? 2.7 : 0.3} squash={festa ? 1.06 : 1} />; })}
    {Array.from({length: 60}).map((_, i) => { const t = f - 48 - rnd(i) * 26; if (t < 0) return null;
      return <mesh key={i} position={[(rnd(i * 2.1) - 0.5) * 11, 7.5 - t * 0.14 * (0.7 + rnd(i * 3) * 0.6), 2.5 + rnd(i * 4) * 4]} rotation={[t * 0.3 + i, t * 0.2, i]} scale={[0.17, 0.09, 1]}><planeGeometry /><meshBasicMaterial color={CORES[i % 8]} side={2} toneMapped={false} /></mesh>; })}
    {f > 50 ? <Coracoes f={f} n={16} seed={5} centro={[0, 1.6, 6.5]} area={[9, 2]} altura={4} s={0.34} /> : null}
    <Arvore p={[-7, 0, 1]} s={1.5} f={f} /><Arvore p={[7, 0, 1]} s={1.5} f={f} cor="#49B84F" />
  </>;
};
const lei: CenaDef = {
  Cena: Lei, ceu: 'linear-gradient(#FF8A1F 0%, #FFC02E 55%, #FFE9A8 100%)',
  cam: (f, dur) => camKeys(f, [
    [-6, {p: [1.5, 1.0, 8.9], l: [0, 1.85, 2.8], mm: 35, roll: -2}],
    [44, {p: [0.7, 1.05, 7.9], l: [0, 1.95, 2.8], mm: 35, roll: 0}],
    [64, {p: [0.1, 1.2, 9.2], l: [0, 3.3, 1.5], mm: 30, roll: 1}],
    [dur + 8, {p: [-0.8, 1.3, 8.6], l: [0, 3.5, 1.5], mm: 30, roll: 3}],
  ]),
};

// ------------------------------------------------------------------ 8. presentes: garotas, bolos, cavalo e piano
const Cavalo = ({p, f, trote}: {p: V3; f: number; trote: number}) => {
  const ph = f * 0.75, b = 0.07 * Math.abs(Math.sin(ph)) * trote;
  const perna = (x: number, z: number, o: number) => <group position={[x, 0.82, z]} rotation={[0, 0, 0.55 * trote * Math.sin(ph + o)]}><Caixa p={[0, -0.36, 0]} s={[0.15, 0.72, 0.15]} cor="#FFFFFF" r={0.05} /><Caixa p={[0, -0.76, 0]} s={[0.17, 0.12, 0.17]} cor="#3B3B4F" r={0.03} /></group>;
  return <group position={[p[0], p[1] + b, p[2]]}>
    {perna(0.5, 0.17, 0)}{perna(0.5, -0.17, PI)}{perna(-0.5, 0.17, PI)}{perna(-0.5, -0.17, 0)}
    <Caixa p={[0, 1.08, 0]} s={[1.5, 0.68, 0.56]} cor="#FFFFFF" r={0.26} />
    <group position={[0.62, 1.3, 0]} rotation={[0, 0, -0.45 + 0.08 * Math.sin(ph) * trote + 0.04 * Math.sin(f / 9)]}>
      <Caixa p={[0, 0.42, 0]} s={[0.36, 0.95, 0.36]} cor="#FFFFFF" r={0.15} />
      <Caixa p={[0.2, 0.88, 0]} s={[0.66, 0.36, 0.34]} cor="#FFFFFF" r={0.14} />
      <Esfera p={[0.3, 0.95, 0.17]} r={0.04} cor="#111111" /><Esfera p={[0.3, 0.95, -0.17]} r={0.04} cor="#111111" />
      <Caixa p={[-0.08, 1.12, 0.1]} s={[0.09, 0.2, 0.08]} cor="#FFFFFF" r={0.03} /><Caixa p={[-0.08, 1.12, -0.1]} s={[0.09, 0.2, 0.08]} cor="#FFFFFF" r={0.03} />
      <Caixa p={[-0.2, 0.5, 0]} s={[0.14, 0.95, 0.12]} cor="#FF7FB0" r={0.05} />
      <Presente p={[0.02, 0.12, 0.24]} s={0.2} cor="#E8274B" fita="#FFD23F" />
    </group>
    <Caixa p={[-0.86, 0.98, 0]} s={[0.16, 0.8, 0.14]} rot={[0, 0, -0.5 + 0.25 * Math.sin(ph * 0.7)]} cor="#FF7FB0" r={0.06} />
  </group>;
};
const Piano = ({p, f, pousou}: {p: V3; f: number; pousou: number}) => {
  const t = Math.max(0, f - pousou), solta = pousou > 0 && f >= pousou;
  return <group position={p}>
    <Caixa p={[0, 0.72, 0]} s={[1.9, 1.3, 0.62]} mat={verniz('#17171F')} r={0.07} />
    <Caixa p={[0, 0.66, 0.42]} s={[1.8, 0.12, 0.34]} mat={verniz('#17171F')} r={0.04} />
    <Caixa p={[0, 0.735, 0.45]} s={[1.66, 0.04, 0.24]} cor="#FFFFFF" r={0.01} rough={0.3} />
    {Array.from({length: 11}).map((_, i) => (i % 7 === 2 || i % 7 === 6 ? null : <Caixa key={i} p={[-0.75 + i * 0.15, 0.765, 0.4]} s={[0.07, 0.04, 0.14]} cor="#111111" r={0.01} sombra={false} />))}
    <Caixa p={[-0.8, 0.2, 0.45]} s={[0.12, 0.42, 0.12]} mat={verniz('#17171F')} /><Caixa p={[0.8, 0.2, 0.45]} s={[0.12, 0.42, 0.12]} mat={verniz('#17171F')} />
    {/* laço vermelho que se desfaz ao pousar */}
    <Caixa p={[0, 0.72, 0]} s={[0.2, 1.33, 0.65]} cor="#E8274B" r={0.02} rough={0.35} escala={[1, solta ? Math.max(0.001, 1 - t / 7) : 1, 1]} />
    {[-1, 1].map((s) => <Esfera key={s} p={[s * (0.2 + (solta ? t * 0.13 : 0)), 1.5 + (solta ? 0.5 * Math.sin(Math.min(PI, t / 5)) - Math.max(0, t - 15) * 0.09 : 0), 0]} r={0.2} escala={[1.25, solta ? Math.max(0.25, 1 - t / 14) : 0.8, 0.6]} cor="#E8274B" rough={0.35} />)}
    <Esfera p={[0, 1.42 - (solta ? Math.min(0.1, t * 0.02) : 0), 0]} r={0.1} cor="#B3261E" />
  </group>;
};
const BOLOS = Array.from({length: 42}).map((_, i) => {
  const andar = i >= 32 ? 1 : 0, j = andar ? i - 32 : i, col = j % 8, lin = Math.floor(j / 8);
  return {x: 0.95 + col * 0.27 + (lin % 2) * 0.13 + andar * 0.3, y: andar * 0.62, z: 2.45 + lin * 0.62 + andar * 0.6, cor: ['#FF7FB0', '#FFFFFF', '#8E5BE8', '#17C3B2', '#FFD23F'][i % 5], s: 0.5 + rnd(i) * 0.1};
});
const Presentes = ({f}: CenaP) => {
  const pouso = 146, cai = prog(f, 116, pouso), py = f < 116 ? 30 : f < pouso ? 9 * (1 - cai * cai) : 0.5 * Math.exp(-(f - pouso) / 3) * Math.abs(Math.sin((f - pouso) * 0.8));
  const cx = f < 88 ? -30 : lerp(-8, -2.05, eOut(prog(f, 88, 122)));
  const trote = 1 - prog(f, 114, 124);
  return <>
    <Luzes cor={K.k4800} kI={3.0} dir={[6, 9, 8]} fill="#BFE4FF" fI={1.05} />
    <Bairro f={f} portaAng={1.75} />
    {[0, 1, 2, 3, 4].map((i) => { const G = garota(i + 30), anda = Math.min(f, 60) * 0.035;
      return <Personagem key={i} {...G} pos={[6.2 + i * 0.95 - anda, 0, 6.35 + (i % 2) * 0.45]} f={f} flip olhos="coracao" boca="sorriso_aberto" corrida={0.35} passo={0.8}
        pulo={0.22 * Math.abs(Math.sin(f / 4.5 + i * 0.9))} bracoD={1.6} bracoE={1.6} segura={<Presente s={0.34} cor={CORES[(i * 3 + 1) % 8]} fita={i % 2 ? '#FFD23F' : '#FFFFFF'} />} />; })}
    <Coracoes f={f} n={10} seed={4} centro={[8, 1.6, 6.5]} area={[5, 1]} altura={2.5} s={0.26} />
    <Personagem {...LEO} f={f} pos={[0.05, 0.14, 2.0]} olhos={f > 52 && f < 100 ? 'arregalado' : 'entediado'} boca={f > 52 && f < 100 ? 'surpresa' : 'neutra'} squash={f >= pouso && f < pouso + 8 ? 0.88 + 0.12 * prog(f, pouso, pouso + 8) : 1} bracoE={f > 130 ? 1.3 : 0.2} bracoD={f > 130 ? 1.3 : 0.2} />
    {BOLOS.map((b, i) => { const s = pop(f, 50 + i * 1.05, 7); return s > 0 ? <Bolo key={i} p={[b.x, b.y, b.z]} s={b.s} cor={b.cor} escala={[s, s * (1 + 0.25 * (1 - prog(f, 50 + i * 1.05, 62 + i * 1.05))), s]} /> : null; })}
    {f > 50 && f < 100 ? <Brilho pos={[3, 1, 3.5]} s={6} cor="#FFE08A" op={0.3} /> : null}
    <Cavalo p={[cx, 0, 3.3]} f={f} trote={trote} />
    {f >= 88 && f < 122 ? <Poeira f={f} pos={[cx - 0.9, 0, 3.5]} n={5} /> : null}
    <Piano p={[-0.75, py, 4.75]} f={f} pousou={pouso} />
    {f >= pouso && f < pouso + 14 ? <><Poeira f={f - pouso} pos={[-1.8, 0, 5.1]} n={5} /><group scale={[-1, 1, 1]}><Poeira f={f - pouso} pos={[-0.3, 0, 5.1]} n={5} seed={2} /></group></> : null}
    {f > 140 ? <Coracoes f={f} n={26} seed={9} centro={[0, 1.2, 4.5]} area={[7, 3]} altura={4.5} vida={40} s={0.5} /> : null}
  </>;
};
const presentes: CenaDef = {
  Cena: Presentes, ceu: CEU.azul,
  cam: (f, dur) => camKeys(f, [
    [-6, {p: [8.9, 1.45, 10.9], l: [7.9, 1.15, 6.4], mm: 40, roll: -2}],
    [40, {p: [7.3, 1.45, 10.3], l: [6.6, 1.15, 6.4], mm: 40, roll: 0}],
    [52, {p: [1.9, 2.0, 11.4], l: [1.2, 1.1, 3.4], mm: 28, roll: 0}, eIO],
    [100, {p: [0.6, 1.9, 11.0], l: [0.2, 1.2, 3.5], mm: 28, roll: 1}],
    [dur + 10, {p: [-0.9, 1.8, 10.6], l: [-0.5, 1.5, 3.6], mm: 28, roll: -1}],
  ]),
};

export const cenasA = {porta, sala, lista, calendario, lei, presentes};
