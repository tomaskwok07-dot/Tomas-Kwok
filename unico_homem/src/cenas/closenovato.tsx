// Plano 19 — close do novato em câmera lenta: "ME DÁ UM BEIJO!"
import React from 'react';
import {back, camKeys, orb, prog} from '../anim';
import {Buque2D, Coracoes, K, Luzes, NOVATO, Personagem} from '../kit';
import {Bairro, CenaDef, CenaP, CEU} from './tipos';

const Cena = ({f, fundo, frente}: CenaP) => {
  const fala = f >= 2 && f <= 29;
  return <>
    <Luzes cor={K.k4800} kI={3.1} dir={[6, 9, 9]} fill="#BFE9FF" fI={1.1} />
    {fundo ? <group position={[-2, 0, -9]}><Bairro f={f} ceu="ciano" /></group> : null}
    {frente ? <>
      <Personagem {...NOVATO} f={f} pos={[0, 0, 0]} corrida={0.9} passo={0.5} frontal olhos="coracao" boca={fala ? (Math.floor(f / 3) % 2 ? 'fala_o' : 'fala_a') : 'sorriso_aberto'}
        bracoD={1.85 + 0.12 * Math.sin(f / 5)} bracoE={1.3} segura={<group scale={1.35}><Buque2D /></group>} halo="#FFD9A0" cabecaRot={0.08 * Math.sin(f / 7)} />
      <Coracoes f={f} n={14} seed={7} centro={[0, 1.55, -0.2]} area={[2.2, 0.6]} altura={2.2} vida={46} s={0.26} />
    </> : null}
  </>;
};
const Overlay = ({f}: {f: number}) => {
  const s = f < 3 ? 0 : back(prog(f, 3, 11), 2.6);
  if (s <= 0) return null;
  return <div style={{position: 'absolute', left: 90, top: 250, width: 900, height: 420, transform: `scale(${s}) rotate(${-3 + 1.5 * Math.sin(f / 4)}deg)`, transformOrigin: '55% 100%'}}>
    <svg width={900} height={420} viewBox="0 0 900 420" style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 12px 0 rgba(0,0,0,0.35))'}}>
      <path d="M70 20 H830 Q880 20 880 70 V250 Q880 300 830 300 H560 L500 400 L470 300 H70 Q20 300 20 250 V70 Q20 20 70 20 Z" fill="#fff" stroke="#111" strokeWidth={12} strokeLinejoin="round" />
    </svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 96, lineHeight: 1.08, color: '#111', letterSpacing: -2}}>
      ME DÁ UM<br /><span style={{color: '#FF2E78', fontSize: 112}}>BEIJO!</span>
      <span style={{fontFamily: 'Noto Color Emoji', fontSize: 92, display: 'inline-block', marginLeft: 14, transform: `scale(${1 + 0.12 * Math.sin(f / 2.5)}) rotate(12deg)`}}>💋</span>
    </div>
  </div>;
};
export const closenovato: CenaDef = {
  Cena, Overlay, dof: 7, ceu: CEU.ciano,
  cam: (f, dur) => camKeys(f, [[-8, orb([-0.22, 1.55, 0], 4.7, 1.3, -4, 58, -3)], [dur + 8, orb([0.2, 1.56, 0], 3.8, 1.4, 2, 58, 3)]]),
};
