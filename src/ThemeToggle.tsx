import React, {useEffect} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Svg, {Circle, Line, Path} from 'react-native-svg';
import Animated, {interpolate, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {useTheme} from './context/ThemeContext';

const SIZE = 34;
const ICON_SIZE = 18;

function SunIcon({size, color}: {size: number; color: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="4.5" />
      <Line x1="12" y1="1.5" x2="12" y2="4" />
      <Line x1="12" y1="20" x2="12" y2="22.5" />
      <Line x1="1.5" y1="12" x2="4" y2="12" />
      <Line x1="20" y1="12" x2="22.5" y2="12" />
      <Line x1="4.2" y1="4.2" x2="6" y2="6" />
      <Line x1="18" y1="18" x2="19.8" y2="19.8" />
      <Line x1="19.8" y1="4.2" x2="18" y2="6" />
      <Line x1="6" y1="18" x2="4.2" y2="19.8" />
    </Svg>
  );
}

function MoonIcon({size, color}: {size: number; color: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />
    </Svg>
  );
}

// Botão de tema com sol/lua trocando de lugar com uma pequena animação de
// rotação + escala (Reanimated) -- substitui o antigo switch "Modo escuro"
// do Perfil. Mostra o ícone do modo ATUAL (sol = claro, lua = escuro);
// tocar alterna pro outro.
export function ThemeToggle() {
  const {mode, colors, toggleTheme} = useTheme();
  const progress = useSharedValue(mode === 'dark' ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(mode === 'dark' ? 1 : 0, {duration: 260});
  }, [mode, progress]);

  const sunStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
    transform: [
      {rotate: `${interpolate(progress.value, [0, 1], [0, 90])}deg`},
      {scale: interpolate(progress.value, [0, 1], [1, 0.4])},
    ],
  }));

  const moonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      {rotate: `${interpolate(progress.value, [0, 1], [-90, 0])}deg`},
      {scale: interpolate(progress.value, [0, 1], [0.4, 1])},
    ],
  }));

  return (
    <Pressable
      onPress={toggleTheme}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      style={[styles.button, {backgroundColor: colors.card, borderColor: colors.borderStrong}]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, sunStyle]}>
        <SunIcon size={ICON_SIZE} color={colors.carbs} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, moonStyle]}>
        <MoonIcon size={ICON_SIZE} color={colors.text} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
