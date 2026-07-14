import React from 'react';
import Svg, {Path, Circle, Line} from 'react-native-svg';
import type {MealPeriod} from './foodMath';

type IconProps = {size?: number; color: string};

// Ícones de linha (traço preto/branco conforme o estado) para os períodos da
// refeição — substituem os emoji antigos. viewBox 24x24, stroke = color.

// Manhã — sol nascendo no horizonte
function SunriseIcon({size = 22, color}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 18a5 5 0 0 0-10 0" />
      <Line x1="12" y1="2.5" x2="12" y2="6" />
      <Line x1="4.2" y1="9.2" x2="6" y2="11" />
      <Line x1="19.8" y1="9.2" x2="18" y2="11" />
      <Line x1="2.5" y1="18" x2="21.5" y2="18" />
      <Path d="M9.5 5.2 12 2.5l2.5 2.7" />
    </Svg>
  );
}

// Almoço — sol pleno
function SunIcon({size = 22, color}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="4" />
      <Line x1="12" y1="2.5" x2="12" y2="5" />
      <Line x1="12" y1="19" x2="12" y2="21.5" />
      <Line x1="2.5" y1="12" x2="5" y2="12" />
      <Line x1="19" y1="12" x2="21.5" y2="12" />
      <Line x1="5.3" y1="5.3" x2="7" y2="7" />
      <Line x1="17" y1="17" x2="18.7" y2="18.7" />
      <Line x1="18.7" y1="5.3" x2="17" y2="7" />
      <Line x1="7" y1="17" x2="5.3" y2="18.7" />
    </Svg>
  );
}

// Tarde — sol atrás da nuvem (parcialmente nublado)
function SunCloudIcon({size = 22, color}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="8" cy="8" r="3" />
      <Line x1="8" y1="1.5" x2="8" y2="3" />
      <Line x1="1.5" y1="8" x2="3" y2="8" />
      <Line x1="3.4" y1="3.4" x2="4.5" y2="4.5" />
      <Line x1="12.6" y1="3.4" x2="11.5" y2="4.5" />
      <Path d="M7 20h9a3.5 3.5 0 0 0 .3-6.98A5 5 0 0 0 7 14.2 3 3 0 0 0 7 20Z" />
    </Svg>
  );
}

// Noite — lua crescente
function MoonIcon({size = 22, color}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />
    </Svg>
  );
}

const ICON_BY_PERIOD: Record<string, React.ComponentType<IconProps>> = {
  manha: SunriseIcon,
  almoco: SunIcon,
  tarde: SunCloudIcon,
  noite: MoonIcon,
};

export function MealPeriodIcon({period, size, color}: {period: MealPeriod; size?: number; color: string}) {
  const Icon = ICON_BY_PERIOD[period] ?? SunIcon;
  return <Icon size={size} color={color} />;
}
