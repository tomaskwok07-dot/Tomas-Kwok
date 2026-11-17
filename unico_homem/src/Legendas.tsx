// Legendas: Montserrat Black, branco com contorno preto, 1–3 palavras, pop de entrada, palavra-chave em cor.
import React from 'react';
import palavras from './dados/palavras.json';
import {rnd} from './anim';

const JUNTA = new Set(['a', 'o', 'as', 'os', 'e', 'é', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'ao', 'à', 'que', 'se', 'por', 'pra', 'com', 'sem', 'seu', 'sua', 'me', 'eu', 'meu', 'ele', 'até', 'já', 'são', 'vou', 'ter', 'foi', 'aí']);
const NUM = new Set(['trinta', 'seis', 'sessenta', 'sete', 'mil', 'duzentos', 'três']);
const AMOR = new Set(['garotas', 'coração', 'sossego']);
const IMPACTO = new Set(['único', 'pá', 'cansei', 'três', 'nunca', 'ufa', 'pior']);
const EMOJI: Record<number, string> = {};
type W = {word: string; start: number; end: number};
type Bloco = {ws: {t: string; cor?: string; imp?: boolean}[]; ini: number; fim: number; emoji?: string};
const limpa = (w: string) => w.toLowerCase().replace(/[.,:!?]/g, '');

const montar = (): Bloco[] => {
  const ws = palavras as W[];
  // cor: por frase, os números (amarelo) ou então a 1ª palavra de amor (rosa)
  const cor: (string | undefined)[] = ws.map(() => undefined);
  let ini = 0;
  ws.forEach((w, i) => {
    if (/[.!?:]$/.test(w.word) || i === ws.length - 1) {
      const idx = Array.from({length: i - ini + 1}, (_, k) => ini + k);
      const nums = idx.filter((j) => NUM.has(limpa(ws[j].word)));
      if (nums.length) {
        nums.forEach((j) => (cor[j] = '#FFD23F'));
        idx.forEach((j) => { if (limpa(ws[j].word) === 'e' && cor[j - 1] && NUM.has(limpa(ws[j + 1]?.word ?? ''))) cor[j] = '#FFD23F'; });
      } else {
        const a = idx.find((j) => AMOR.has(limpa(ws[j].word)));
        if (a !== undefined) cor[a] = '#FF4F8B';
      }
      ini = i + 1;
    }
  });
  const blocos: Bloco[] = [];
  let cur: number[] = [];
  const fecha = () => {
    if (!cur.length) return;
    blocos.push({ws: cur.map((j) => ({t: ws[j].word.replace(/[.,:]/g, '').toUpperCase(), cor: cor[j], imp: IMPACTO.has(limpa(ws[j].word))})), ini: ws[cur[0]].start, fim: ws[cur[cur.length - 1]].end});
    cur = [];
  };
  ws.forEach((w, i) => {
    const chars = cur.reduce((n, j) => n + ws[j].word.length + 1, 0) + w.word.length;
    if (cur.length && (cur.length >= 3 || chars > 17)) {
      // não termina o bloco numa palavrinha solta: ela vai para o próximo
      const ult = cur[cur.length - 1];
      if (cur.length > 1 && JUNTA.has(limpa(ws[ult].word))) { cur.pop(); fecha(); cur = [ult]; } else fecha();
    }
    cur.push(i);
    if (/[.,!?:]$/.test(w.word)) fecha();
  });
  fecha();
  const em = (alvo: string, e: string) => { const b = blocos.find((b) => b.ws.some((w) => w.t.replace(/[!?]/g, '') === alvo)); if (b) b.emoji = e; };
  em('QUEREM', '💘'); em('CELULAR', '📱'); em('BOLOS', '🎂'); em('CHOCOLATE', '🍫');
  return blocos;
};
export const BLOCOS = montar();

const FONTE = 78;
export const Legendas = ({F}: {F: number}) => {
  const t = F / 30;
  let b: Bloco | undefined;
  for (let i = 0; i < BLOCOS.length; i++) {
    const prox = BLOCOS[i + 1]?.ini ?? 1e9;
    if (t >= BLOCOS[i].ini - 0.001 && t < Math.min(prox, BLOCOS[i].fim + 0.3)) b = BLOCOS[i];
  }
  if (!b) return null;
  const n = (t - b.ini) * 30;
  const esc = n < 2 ? 0.8 + 0.14 * n : n < 3 ? 1.08 : n < 5 ? 1.08 - 0.04 * (n - 3) : 1;
  const sobe = 12 * Math.max(0, 1 - n / 4);
  const linha = (frente: boolean) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: 'Montserrat', fontWeight: 900, fontSize: FONTE, lineHeight: 1, letterSpacing: -1,
      WebkitTextStroke: frente ? undefined : '12px #000', filter: frente ? undefined : 'drop-shadow(0 4px 5px rgba(0,0,0,0.5))'}}>
      {b!.ws.map((w, i) => {
        const sh = w.imp && n < 8 ? [(rnd(F * 1.7 + i) - 0.5) * 8, (rnd(F * 2.9 + i) - 0.5) * 8] : [0, 0];
        return <span key={i} style={{display: 'inline-block', margin: '0 11px', color: frente ? w.cor ?? '#FFFFFF' : '#000', fontSize: w.imp ? FONTE * 1.1 : FONTE, transform: `translate(${sh[0]}px,${sh[1]}px)`}}>{w.t}</span>;
      })}
      {b!.emoji ? <span style={{display: 'inline-block', fontFamily: 'Noto Color Emoji', fontSize: FONTE * 0.95, marginLeft: 6, WebkitTextStroke: '0', transform: `scale(${Math.min(1.15, 0.4 + n * 0.2) - Math.max(0, Math.min(0.15, (n - 4) * 0.05))}) rotate(${8 * Math.sin(F / 4)}deg)`, opacity: frente ? 1 : 0}}>{b!.emoji}</span> : null}
    </div>
  );
  return <div style={{position: 'absolute', left: 0, right: 0, top: 1351 - FONTE / 2 + sobe, height: FONTE * 1.2, transform: `scale(${esc})`, transformOrigin: '50% 50%'}}>{linha(false)}{linha(true)}</div>;
};
