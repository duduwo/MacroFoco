import React, {useLayoutEffect, useMemo} from 'react';
import {View, Pressable, PanResponder, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import {useTheme} from './context/ThemeContext';
import {radius, type ThemeColors} from './theme';
import {MealPeriodIcon} from './MealPeriodIcons';
import type {MealPeriod} from './foodMath';

type PeriodOption = {key: MealPeriod; label: string};

type Props = {
  options: PeriodOption[];
  activeKey: MealPeriod;
  onChange: (key: MealPeriod) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Timing curto em vez de mola: flexGrow/maxWidth não podem ultrapassar 0 ou 1
// no Android. O overshoot da mola fazia o chip anterior reaparecer por um
// frame ao trocar rapidamente de período.
const TRANSITION_DURATION = 180;

// Converte hex #RRGGBB em "r, g, b" para montar o par opaco/transparente do
// interpolateColor abaixo — precisa ser dinâmico porque colors.primary muda
// entre os temas claro/escuro (não dá mais pra deixar o valor cravado).
function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// Um chip do seletor. `grow` (0→1) é o valor de mola compartilhado por todas
// as animações do chip: largura (flexGrow), cor de fundo, sombra e o
// aparecimento do rótulo — tudo derivado dele, então o movimento é coeso.
function PeriodChip({
  option,
  active,
  onPress,
}: {
  option: PeriodOption;
  active: boolean;
  onPress: () => void;
}) {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rgbTriplet = useMemo(() => hexToRgbTriplet(colors.primary), [colors.primary]);
  const activeBg = `rgba(${rgbTriplet}, 1)`;
  const activeBgTransparent = `rgba(${rgbTriplet}, 0)`;

  const grow = useSharedValue(active ? 1 : 0);

  useLayoutEffect(() => {
    grow.value = withTiming(active ? 1 : 0, {duration: TRANSITION_DURATION});
  }, [active, grow]);

  const chipStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(grow.value, 1));
    return {
      flexGrow: progress,
      backgroundColor: interpolateColor(
        progress,
        [0, 1],
        [activeBgTransparent, activeBg],
      ),
      shadowOpacity: progress * 0.28,
      elevation: progress * 3,
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(grow.value, 1));
    return {
      opacity: progress,
      maxWidth: progress * 140,
      marginLeft: progress * 8,
    };
  });

  // Cross-fade das duas cópias do ícone (preta ⇄ branca) acompanhando `grow`,
  // pra a cor do ícone virar em sincronia com o fundo — sem isso o ícone troca
  // de cor num frame só e "pisca" enquanto o fundo ainda está animando.
  const iconDarkStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, Math.min(grow.value, 1)),
  }));
  const iconLightStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(grow.value, 1)),
  }));

  return (
    <AnimatedPressable onPress={onPress} style={[styles.chip, chipStyle]}>
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.iconLayer, iconDarkStyle]}>
          <MealPeriodIcon period={option.key} size={22} color={colors.text} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, iconLightStyle]}>
          <MealPeriodIcon period={option.key} size={22} color={colors.onPrimary} />
        </Animated.View>
      </View>
      <Animated.Text numberOfLines={1} style={[styles.label, labelStyle]}>
        {option.label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

// Seletor de período: todos visíveis dentro de uma bandeja mais escura, com o
// selecionado expandido (ícone + rótulo) e os demais estreitos só com ícone.
// Troca por toque num chip ou arrastando pro lado. As transições animam com
// Reanimated (mola na UI thread) — bem mais fluidas que LayoutAnimation.
export default function MealPeriodSelector({options, activeKey, onChange}: Props) {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const activeIndex = options.findIndex(o => o.key === activeKey);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -30 && activeIndex < options.length - 1) {
        onChange(options[activeIndex + 1].key);
      } else if (g.dx > 30 && activeIndex > 0) {
        onChange(options[activeIndex - 1].key);
      }
    },
  });

  return (
    <View style={styles.tray} {...panResponder.panHandlers}>
      {options.map(opt => (
        <PeriodChip
          key={opt.key}
          option={opt}
          active={opt.key === activeKey}
          onPress={() => onChange(opt.key)}
        />
      ))}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  tray: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.backgroundAlt2,
    borderRadius: radius.chip + 6,
    padding: 6,
  },
  chip: {
    height: 46,
    flexBasis: 46,
    flexShrink: 0,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 10,
  },
  iconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
