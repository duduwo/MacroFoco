import React from 'react';
import {Pressable} from 'react-native';
import type {PressableProps, GestureResponderEvent} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Mola curta e firme — feedback imediato ao tocar, sem balançar.
const SPRING = {damping: 15, stiffness: 260, mass: 0.6};

type Props = PressableProps & {
  // Quanto o botão encolhe no toque (0.04 = escala 0.96). Ajustável por botão.
  pressScale?: number;
};

// Botão com micro-animação de toque: encolhe levemente e escurece um tiquinho
// enquanto pressionado, voltando com mola ao soltar. Drop-in para
// TouchableOpacity — aceita as mesmas props (style, onPress, disabled,
// hitSlop...). Usa Reanimated, então roda na UI thread (não trava com o JS).
export default function PressableScale({
  pressScale = 0.04,
  style,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: Props) {
  const p = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: 1 - pressScale * p.value}],
    opacity: 1 - 0.12 * p.value,
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled) p.value = withSpring(1, SPRING);
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    p.value = withSpring(0, SPRING);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style as object, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
