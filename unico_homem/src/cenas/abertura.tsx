// Plano 1 — gancho: close no Leo, crane-out revelando a multidão em círculos.
import React from 'react';
import {back, clamp, eOut, lerp, PI, prog, rnd} from '../anim';
import {Chao, Domo, Coracoes, garota, K, LEO, Luzes, Personagem, Brilho} from '../kit';
import {CenaDef, CenaP, DOMO} from './tipos';

const ANEIS: [number, number][] = [[1.2, 7], [2.0, 12], [2.8, 17], [3.6, 22], [4.4, 27], [5.2, 32], [6.0, 37]];
const MULTIDAO = (() => {
  const m: {x: number; z: number; i: number; anel: number; ang: number}[] = [];
  let i = 0;
  ANEIS.forEach(([r, n], anel) => {
    for (let k = 0; k < n; k++, i++) {
      const ang = (k / n) * 2 * PI + anel * 0.37;
      const x = r * Math.sin(ang) + (rnd(i * 3.3) - 0.5) * 0.22, z = r * Math.cos(ang) + (rnd(i * 4.1) - 0.5) * 0.22;
      if (anel === 0 && z > 0.55) continue; // corredor para o close inicial
      m.push({x, z, i, anel, ang});
    }
  });
  return m;
})();

const Cena = ({f}: CenaP) => {
  const aperto = (q: number) => (f < q ? 1 : f < q + 4 ? 0.92 : 0.92 + 0.08 * back(prog(f, q + 4, q + 12)));
  return <>
    <Luzes cor="#FFD08A" kI={2.9} dir={[6, 7, 5]} fill="#FFB3CF" chao="#C22F63" fI={1.25} rI={1.4} raio={9} />
    <Domo cores={DOMO.rosa} /><Chao cor="#E8417A" s={90} pad="coracoes" lado={2.2} />
    <Brilho pos={[0, 1.2, -0.4]} s={4.2} cor="#FFE08A" op={0.42} />
    <Personagem {...LEO} f={f} olhos="preocupado" boca={f % 34 < 17 ? 'dentes' : 'triste'} escalaX={Math.min(aperto(40), aperto(74))} cabecaDx={0.02 * Math.sin(f / 9)} cabecaRot={0.05 * Math.sin(f / 11)} bracoE={0.05} bracoD={0.05} k={0.9} />
    {MULTIDAO.map((g) => {
      const G = garota(g.i);
      const onda = Math.pow(Math.max(0, Math.sin(f * 0.28 - g.anel * 1.15 + g.ang * 2)), 2) * 0.14;
      const pula = g.i % 4 === 0;
      const t = (((f + G.fase * 26) % 26) + 26) % 26 / 26;
      const pulo = pula ? (t < 0.15 ? 0 : t < 0.75 ? 0.5 * Math.sin(((t - 0.15) / 0.6) * PI) : 0) : onda;
      const sq = pula ? (t < 0.15 ? 1 - 0.16 * (t / 0.15) : t < 0.75 ? 1.1 : 0.86 + 0.14 * ((t - 0.75) / 0.25)) : 1 + onda * 0.3;
      const coracao = g.i % 3 !== 0;
      const acena = g.i % 2 === 0;
      return <Personagem key={g.i} {...G} pos={[g.x, 0, g.z]} f={f} olhos={coracao ? 'coracao' : 'feliz'} boca={g.i % 5 < 3 ? 'sorriso_aberto' : 'sorriso'}
        pulo={pulo} squash={sq} k={0.9} inclina={0.06 * Math.sin(f * 0.2 + g.ang * 3)}
        bracoE={acena ? 2.5 + 0.45 * Math.sin(f * 0.45 + G.fase * 6) : 1.2} bracoD={acena ? 1.1 : 2.5 + 0.45 * Math.sin(f * 0.5 + G.fase * 9)} />;
    })}
    <Coracoes f={f} n={46} seed={1} area={[10.5, 10.5]} altura={4.2} centro={[0, 1.5, 0]} s={0.36} vida={64} />
  </>;
};
export const abertura: CenaDef = {
  Cena,
  ceu: 'linear-gradient(#FF7FB0 0%, #FFB3CF 55%, #FFD0A8 100%)',
  cam: (f) => {
    const t = eOut(prog(f, 5, 82)), d0 = 1.3 - 0.07 * clamp(f / 5);
    const d = lerp(d0, 7.9, t) + 0.012 * f * t, e = (lerp(2, 56, t) * PI) / 180, az = ((lerp(0, 26, t) + 0.07 * f) * PI) / 180, ly = lerp(1.3, 0.55, t);
    return {p: [Math.sin(az) * Math.cos(e) * d, ly + Math.sin(e) * d, Math.cos(az) * Math.cos(e) * d], l: [0, ly, 0], mm: lerp(24, 18, t), roll: lerp(0, -3, t)};
  },
};
