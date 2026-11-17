// Utilitários de animação: tudo é função pura do quadro (render determinístico).
export type V3 = [number, number, number];
export const PI = Math.PI;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const eOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const eIn = (t: number) => t * t * t;
export const eIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const sIO = (t: number) => 0.5 - 0.5 * Math.cos(PI * clamp(t));
// ease-out com passagem (overshoot) de ~10% e volta
export const back = (t: number, s = 2.2) => {
  const u = clamp(t) - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};
// pop de escala 0 -> ~1,12 -> 1 a partir do quadro a
export const pop = (f: number, a: number, d = 8) => (f < a ? 0 : back(prog(f, a, a + d)));
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const quique = (t: number) => {
  // easeOutBounce
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
// queda com quique: devolve altura extra (0 = pousado) e squash no impacto
export const queda = (f: number, pouso: number, altura: number, frames = 14) => {
  const t = (f - (pouso - frames)) / frames;
  if (t <= 0) return {y: altura, sq: 1, vis: f >= pouso - frames - 1};
  if (t < 1) return {y: altura * (1 - t * t), sq: 1 + 0.12 * t, vis: true};
  const u = f - pouso;
  const amp = Math.exp(-u / 5);
  return {y: Math.abs(Math.sin(u * 0.55)) * 0.28 * altura * 0.12 * amp, sq: 1 - 0.22 * Math.cos(u * 1.1) * Math.exp(-u / 3.5), vis: true};
};
export const tremorXY = (f: number, q: number, amp = 20, dur = 9): [number, number] => {
  if (f < q || f > q + dur) return [0, 0];
  const k = amp * (1 - (f - q) / dur);
  return [(rnd(f * 3.1) - 0.5) * 2 * k, (rnd(f * 7.7) - 0.5) * 2 * k];
};
export const punch = (f: number, q: number, amt = 0.08) =>
  f < q ? 0 : f < q + 3 ? (amt * (f - q + 1)) / 3 : f < q + 9 ? amt * (1 - (f - q - 3) / 6) : 0;

export type Cam = {p: V3; l: V3; mm: number; roll?: number};
type Key = [number, Cam, ((t: number) => number)?];
// câmera por quadros-chave com ease (nunca linear); micro-deriva para não ficar parada
export const camKeys = (f: number, keys: Key[]): Cam => {
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (f >= keys[i][0]) { a = keys[i]; b = keys[i + 1]; }
  }
  const t = (b[2] ?? sIO)(prog(f, a[0], b[0] === a[0] ? a[0] + 1 : b[0]));
  const m = (x: V3, y: V3): V3 => [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)];
  const c: Cam = {p: m(a[1].p, b[1].p), l: m(a[1].l, b[1].l), mm: lerp(a[1].mm, b[1].mm, t), roll: lerp(a[1].roll ?? 0, b[1].roll ?? 0, t)};
  const d = Math.hypot(c.p[0] - c.l[0], c.p[1] - c.l[1], c.p[2] - c.l[2]);
  c.l = [c.l[0] + d * 0.011 * Math.sin(f / 15), c.l[1] + d * 0.007 * Math.sin(f / 11 + 1), c.l[2]];
  return c;
};
// câmera em órbita em volta de um alvo (distância, altura, azimute em graus)
export const orb = (alvo: V3, dist: number, alt: number, az: number, mm: number, roll = 0): Cam => ({
  p: [alvo[0] + dist * Math.sin((az * PI) / 180), alt, alvo[2] + dist * Math.cos((az * PI) / 180)],
  l: alvo, mm, roll,
});
