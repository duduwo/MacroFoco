import React from 'react';
import Svg, {Circle, Line, Path} from 'react-native-svg';

// Calendário de linha fina no mesmo padrão de MealPeriodIcons/TabIcons:
// viewBox 24, pontas arredondadas e sem preenchimento sólido.
export function CalendarIcon({color, size = 18}: {color: string; size?: number}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="M5.5 4.5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2Z" />
      <Line x1="3.5" y1="9" x2="20.5" y2="9" />
      <Line x1="8" y1="2.5" x2="8" y2="6.5" />
      <Line x1="16" y1="2.5" x2="16" y2="6.5" />
      <Circle cx="8" cy="13" r="0.8" fill={color} stroke="none" />
      <Circle cx="12" cy="13" r="0.8" fill={color} stroke="none" />
      <Circle cx="16" cy="13" r="0.8" fill={color} stroke="none" />
      <Circle cx="8" cy="17" r="0.8" fill={color} stroke="none" />
      <Circle cx="12" cy="17" r="0.8" fill={color} stroke="none" />
    </Svg>
  );
}

