import React from 'react';
import {Cam, V3} from '../anim';
import {Arvore, Casa, Cerca, Chao, Domo, Nuvem, Rua} from '../kit';

export type CenaP = {f: number; dur: number; fundo: boolean; frente: boolean};
export type CenaDef = {
  Cena: React.FC<CenaP>;
  cam: (f: number, dur: number) => Cam;
  ceu: string | ((f: number, dur: number) => string);
  dof?: number;      // desfoque do fundo em px (0 = tudo num canvas só)
  grade?: string;    // correção de cor por cenário
  Overlay?: React.FC<{f: number; dur: number}>;
};
export const CEU = {
  azul: 'linear-gradient(#2FA8FF 0%, #5EC2FF 45%, #B9E6FF 100%)',
  ciano: 'linear-gradient(#00A6E0 0%, #19C3E6 50%, #8BE9F7 100%)',
  rosa: 'linear-gradient(#FF8FBF 0%, #FFB3CF 60%, #FFD9E6 100%)',
  quente: 'linear-gradient(#FF3D7F 0%, #FF6A8B 45%, #FFB36B 100%)',
};

// bairro do Leo: casa dele na origem (porta virada para +z), gramado, cerca, calçada e rua
export const DOMO: Record<string, [string, string, string]> = {azul: ['#1E9BFF', '#5EC2FF', '#C4ECFF'], ciano: ['#00A0DC', '#19C3E6', '#9CEEFA'], quente: ['#FF3D7F', '#FF6A8B', '#FFB36B'], ouro: ['#FF8A1F', '#FFC02E', '#FFE9A8'], rosa: ['#FF7FB0', '#FFB3CF', '#FFD0A8']};
export const Bairro = ({f, portaAng = 0, grama = '#3FAE49', semCerca = false, ceu = 'azul'}: {f: number; portaAng?: number; grama?: string; semCerca?: boolean; ceu?: string}) => <>
  <Domo cores={DOMO[ceu]} />
  <Chao cor={grama} s={160} />
  <Chao cor="#E9DCC3" s={[1.5, 3.6]} y={0.012} p={[0, 0, 3.4]} pad="ladrilho" lado={0.75} />
  <Casa portaAng={portaAng} />
  <Casa p={[-9.5, 0, -0.5]} parede="#FF8FB1" telhado="#7B4BD6" porta="#5B6EE8" />
  <Casa p={[9.5, 0, -0.5]} parede="#7FD8FF" telhado="#FF8A3D" porta="#E63946" />
  <Casa p={[19, 0, -0.5]} parede="#C6F27A" telhado="#17C3B2" porta="#FFB020" />
  <Casa p={[-19, 0, -0.5]} parede="#FFB36B" telhado="#3FA7F5" porta="#43B66B" />
  {[-14, -4.6, 4.6, 14, 23.5, -23.5].map((x, i) => <Arvore key={i} p={[x, 0, -1.5 + (i % 2)]} s={1.1 + (i % 3) * 0.15} f={f} cor={i % 2 ? '#2E9E44' : '#49B84F'} />)}
  {!semCerca ? <><Cerca p={[-30, 0, 5.2]} n={70} /><Cerca p={[1.0, 0, 5.2]} n={70} /></> : null}
  <Rua z={8.6} />
  {[-21, -12, -3, 6, 15, 24].map((x, i) => <Casa key={i} p={[x, 0, 14.5]} rot={Math.PI} parede={['#B892FF', '#FFD166', '#FF9F80', '#8EE3C8', '#FFA3C4', '#9CC9FF'][i]} telhado={['#E63946', '#3FA7F5', '#7B4BD6', '#FF8A3D', '#43B66B', '#E63946'][i]} />)}
  <Nuvem p={[-9, 9.5, -16]} s={1.6} /><Nuvem p={[8 + f * 0.01, 11, -18]} s={2} /><Nuvem p={[22, 8.5, -14]} s={1.3} /><Nuvem p={[-24, 10.5, -17]} s={1.7} />
</>;
export const v = (x: number, y: number, z: number): V3 => [x, y, z];
