import React from 'react';
import Svg, {Circle} from 'react-native-svg';
import {useTheme} from './context/ThemeContext';

// Bolinha de progresso do dia — enche conforme as calorias contabilizadas
// (comidas + agendadas pendentes) se aproximam da meta. Movida de
// PlanningSection.tsx (era interna à antiga tela Calendário) para ser
// reutilizada tanto no popup de calendário do Diário quanto na Programação.
export default function DayRing({ratio, size = 34, color}: {ratio: number; size?: number; color: string}) {
  const {colors} = useTheme();
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.min(Math.max(ratio, 0), 1);
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.progressTrack} strokeWidth={strokeWidth} fill="none" />
      {ratio > 0 && (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      )}
    </Svg>
  );
}
