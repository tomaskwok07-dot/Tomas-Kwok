// Plano 5 — celular: odômetro 36.288 -> 67.000, notificações em cascata, quarto escuro (a tela é a luz).
import React from 'react';
import {back, clamp, eIn, lerp, orb, camKeys, prog, rnd, sIO} from '../anim';
import {Brilho, Caixa, Chao, LEO, Parede, Personagem} from '../kit';
import {CenaDef, CenaP} from './tipos';

const F0 = 80, F1 = 124; // rolagem do contador ("Agora já são sessenta e sete mil")
const valor = (f: number) => (f < F0 ? 36288 + Math.floor(Math.max(0, f) / 5) : Math.round(lerp(36288 + 16, 67000, eIn(prog(f, F0, F1)) * 0.55 + 0.45 * sIO(prog(f, F0, F1)))));
const CHEGA = [2, 16, 29, 41, 52, 62, 71, 78, 84, 89, 93, 97, 101, 105, 109, 113, 117, 121, 125, 129, 133];
const MSG = [['Bia', 'oi oi oi!!'], ['Gabi', 'me nota, Leo!'], ['Helô', 'bom dia, lindo!'], ['Isa', 'te vi passando'], ['Júlia', 'casa comigo?'], ['Kika', 'tô na sua porta'], ['Lara', 'abre a janela!'], ['Malu', 'fiz um bolo pra você'], ['Nina', 'responde, vai'], ['Pri', 'oi sumido']];
const AV = ['#8E5BE8', '#17C3B2', '#FFB020', '#3FA7F5', '#F25C54', '#43B66B', '#E056C1', '#FF8A3D'];

const Cena = ({f, fundo, frente}: CenaP) => {
  const choque = f >= F0 + 8;
  return <>
    <hemisphereLight args={['#5A3BA8', '#1A0B2E', 0.55]} />
    <pointLight color="#FF4F8B" intensity={26} distance={14} position={[-0.6, 1.9, 1.6]} />
    {fundo ? <>
      <Chao cor="#3A1E78" s={40} />
      <Parede p={[0, 4, -3.2]} s={[30, 10]} cor="#4A2496" pad="listras" />
      <Caixa p={[2.9, 0.5, -2.3]} s={[1.6, 1.0, 0.9]} cor="#2D1B69" />
      <Caixa p={[-3.3, 1.3, -2.6]} s={[1.3, 2.6, 0.7]} cor="#2D1B69" />
      <Caixa p={[2.9, 1.5, -3.1]} s={[1.5, 1.1, 0.06]} cor="#7FA8FF" rough={0.3} />
      <Brilho pos={[-0.6, 1.7, -1.5]} s={9} cor="#FF4F8B" op={0.55} />
    </> : null}
    {frente ? <Personagem {...LEO} f={f} pos={[1.45, 0, 0.4]} tint="#FFE1EC" olhos={choque ? 'arregalado' : 'entediado'} boca={choque ? 'surpresa' : 'neutra'}
      squash={choque ? 1 + 0.1 * (1 - back(prog(f, F0 + 8, F0 + 18))) : 1} cabecaRot={0.08} bracoE={choque ? 2.6 : 0.2} bracoD={choque ? 2.6 : 0.2} halo="#FF4F8B" /> : null}
  </>;
};

const DIG = 96;
const Odometro = ({v, borrao}: {v: number; borrao: number}) => {
  const casas = [4, 3, 2, 1, 0];
  return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: DIG * 1.25, overflow: 'hidden', filter: borrao > 0.5 ? `blur(${Math.min(3, borrao)}px)` : undefined}}>
    {casas.map((k, i) => {
      const d = (v / Math.pow(10, k)) % 10, base = Math.floor(d);
      const frac = k === 0 ? 0 : clamp(((v % Math.pow(10, k)) / Math.pow(10, k) - 0.9) * 10); // "vira" junto com a casa de baixo
      const off = base + frac;
      return <React.Fragment key={k}>
        <div style={{width: DIG * 0.66, height: DIG * 1.25, position: 'relative'}}>
          {[0, 1].map((n) => <div key={n} style={{position: 'absolute', left: 0, right: 0, top: (n - (off - base)) * DIG * 1.25, height: DIG * 1.25, lineHeight: `${DIG * 1.25}px`, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: DIG, color: '#E8174B'}}>{(base + n) % 10}</div>)}
        </div>
        {i === 1 ? <div style={{fontFamily: 'Montserrat', fontWeight: 900, fontSize: DIG, color: '#E8174B', lineHeight: `${DIG * 1.25}px`}}>.</div> : null}
      </React.Fragment>;
    })}
  </div>;
};

const Overlay = ({f, dur}: {f: number; dur: number}) => {
  const t = clamp(f / dur, -0.1, 1.1);
  const vib = CHEGA.reduce((a, c) => (f >= c && f < c + 4 ? 1 : a), 0);
  const vx = vib * (rnd(f * 5.1) - 0.5) * 6, vy = vib * (rnd(f * 8.3) - 0.5) * 6, vr = vib * (rnd(f * 2.7) - 0.5) * 0.9;
  const v = valor(f), vel = valor(f + 1) - valor(f);
  const bate = f >= F1 ? 1 + 0.12 * (1 - back(prog(f, F1, F1 + 8))) * (f < F1 + 8 ? 1 : 0) : 1;
  return <div style={{position: 'absolute', inset: 0, perspective: 1800}}>
    <div style={{position: 'absolute', left: 70 + lerp(250, -150, sIO(t)) + vx, top: 150 + lerp(70, -50, sIO(t)) + vy, width: 640, height: 1240,
      transform: `rotateY(${lerp(-16, -5, sIO(t))}deg) rotateZ(${lerp(4.5, 1.5, sIO(t)) + vr}deg) scale(${lerp(0.9, 1.04, sIO(t))})`, transformOrigin: '50% 50%'}}>
      <div style={{position: 'absolute', inset: -70, borderRadius: 140, background: 'radial-gradient(closest-side, rgba(255,79,139,0.75), rgba(255,79,139,0) 100%)'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 86, background: '#0B0B14', boxShadow: '0 0 0 5px #2A2A3A, 0 30px 80px rgba(0,0,0,0.6)'}} />
      <div style={{position: 'absolute', inset: 20, borderRadius: 68, overflow: 'hidden', background: 'linear-gradient(#FF4F8B, #FF2E78)'}}>
        <div style={{position: 'absolute', left: 215, top: 16, width: 170, height: 34, borderRadius: 20, background: '#0B0B14'}} />
        <div style={{position: 'absolute', left: 44, top: 74, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 50, color: '#fff'}}>Mensagens</div>
        <div style={{position: 'absolute', left: 30, right: 30, top: 150, height: 232, borderRadius: 40, background: '#fff', boxShadow: '0 10px 0 rgba(160,0,60,0.35)', transform: `scale(${bate})`}}>
          <div style={{marginTop: 14}}><Odometro v={v} borrao={vel / 300} /></div>
          <div style={{textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 34, color: '#2B1840', letterSpacing: 3, marginTop: -2}}>NÃO LIDAS</div>
        </div>
        <div style={{position: 'absolute', left: 30, right: 30, top: 410, bottom: 0, overflow: 'hidden'}}>
          {CHEGA.map((c, j) => {
            if (f < c) return null;
            const depois = CHEGA.slice(j + 1).reduce((a, c2) => a + sIO(prog(f, c2, c2 + 5)), 0);
            const y = 690 - depois * 132 + (1 - back(prog(f, c, c + 9), 2.6)) * 240;
            if (y < -140) return null;
            const m = MSG[j % MSG.length];
            return <div key={j} style={{position: 'absolute', left: 0, right: 0, top: y, height: 116, borderRadius: 30, background: '#fff', boxShadow: '0 6px 0 rgba(160,0,60,0.3)'}}>
              <div style={{position: 'absolute', left: 18, top: 20, width: 76, height: 76, borderRadius: 40, background: AV[j % AV.length], border: '5px solid #111'}} />
              <div style={{position: 'absolute', left: 116, top: 18, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 36, color: '#1B1030'}}>{m[0]}</div>
              <div style={{position: 'absolute', left: 116, top: 64, fontFamily: 'Montserrat', fontWeight: 600, fontSize: 29, color: '#6A5A80'}}>{m[1]}</div>
              <div style={{position: 'absolute', right: 26, top: 34, fontSize: 44, color: '#FF2E6E', fontFamily: 'Montserrat', fontWeight: 900}}>♥</div>
            </div>;
          })}
        </div>
      </div>
    </div>
  </div>;
};
export const celular: CenaDef = {
  Cena, Overlay, dof: 5,
  ceu: '#1A0B2E',
  cam: (f, dur) => camKeys(f, [[0, orb([-0.9, 1.25, 0], 5.6, 1.5, -3, 40, -2)], [dur + 10, orb([1.2, 1.2, 0], 4.5, 1.35, 3, 40, 1.5)]]),
};
