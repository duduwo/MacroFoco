import React from 'react';
import Svg, {Circle} from 'react-native-svg';

// Marca do MacroFoco (anel de 4 cores + círculo escuro central) recriada em
// SVG vetorial -- substitui o PNG (assets/images/logo_cabecinha.png), que
// tinha um quadrado creme carimbado como fundo e destoava do modo escuro.
// Sem fundo nenhum aqui: o SVG é transparente, então se encaixa em qualquer
// tela/tema por trás. Cores fixas (identidade da marca, não reagem ao tema)
// -- só o que sumiu foi o retângulo de fundo, não as cores do desenho.
const SEGMENT_COLORS = ['#C6603E', '#D4A144', '#6E8F6E', '#EDE6DC'];
// Fração da circunferência de cada segmento (a soma fica abaixo de 1 pra
// sobrar espaço entre eles) -- proporções da marca original.
const SEGMENT_FRACTIONS = [0.29, 0.19, 0.19, 0.21];
const GAP_FRACTION = 0.03;

export function LogoMark({size = 120}: {size?: number}) {
  const strokeWidth = size * 0.14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cursor = 0;
  const segments = SEGMENT_COLORS.map((color, i) => {
    const frac = SEGMENT_FRACTIONS[i];
    const arcLength = frac * circumference;
    const offset = cursor * circumference;
    cursor += frac + GAP_FRACTION;
    return {color, arcLength, offset};
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${seg.arcLength} ${circumference - seg.arcLength}`}
          strokeDashoffset={-seg.offset}
          fill="none"
          rotation={-90}
          originX={cx}
          originY={cy}
        />
      ))}
      <Circle cx={cx} cy={cy} r={radius - strokeWidth * 0.55} fill="#2B2621" />
      <Circle cx={cx} cy={cy} r={radius * 0.14} fill="#F5EFE7" />
    </Svg>
  );
}
