import React from 'react';
import Svg, {Circle, Line, Path} from 'react-native-svg';

// Ícones de linha da barra de abas — mesmo estilo (traço, sem preenchimento,
// viewBox 24x24) já usado em MealPeriodIcons.tsx e nos ícones do Perfil, em
// vez do emoji antigo (📔/🍲/👤), que destoava do resto do app.
type IconProps = {color: string; size?: number};

// Alimentos (Organização) — tigela com talher, ecoando a categoria "stew"/
// "prepared" já usada no catálogo de ícones de comida (FoodIcon.tsx).
export function FoodsTabIcon({color, size = 22}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 11h16" />
      <Path d="M4.5 11a7.5 7.5 0 0 0 15 0" />
      <Path d="M12 11V4" />
      <Path d="M9.5 4c0 1.4.6 2.2 1.2 2.8" />
    </Svg>
  );
}

// Diário — bloco de notas com linhas de texto (o "registro do dia").
export function DiaryTabIcon({color, size = 22}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6.5 3.5h8L19 8v11.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
      <Path d="M14.5 3.5V8H19" />
      <Line x1="8.3" y1="12" x2="15.7" y2="12" />
      <Line x1="8.3" y1="15.3" x2="15.7" y2="15.3" />
      <Line x1="8.3" y1="18.6" x2="12.5" y2="18.6" />
    </Svg>
  );
}

// Perfil — cabeça + ombros, mesmo traço arredondado dos outros dois.
export function ProfileTabIcon({color, size = 22}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8.3" r="3.3" />
      <Path d="M5 20c0-4.1 3.1-6.8 7-6.8s7 2.7 7 6.8" />
    </Svg>
  );
}
