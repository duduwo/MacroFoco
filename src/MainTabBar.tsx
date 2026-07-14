import React, {useEffect, useMemo, useState} from 'react';
import {View, Pressable, StyleSheet, Keyboard} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from './context/ThemeContext';
import {radius, type ThemeColors} from './theme';
import {DiaryTabIcon, FoodsTabIcon, ProfileTabIcon} from './TabIcons';

type IconComponent = (props: {color: string; size?: number}) => React.JSX.Element;

// Mesmo estilo de ícone de linha usado no resto da tab bar (TabIcons.tsx).
const TAB_ICONS: Record<string, IconComponent> = {
  Organizacao: FoodsTabIcon,
  Diario: DiaryTabIcon,
  Perfil: ProfileTabIcon,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Mesma duração/abordagem do MealPeriodSelector: timing em vez de mola, pra
// flexGrow não passar de 0/1 no Android durante o overshoot.
const TRANSITION_DURATION = 180;

function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// Uma aba, com o mesmo comportamento do chip do seletor de período: cresce e
// ganha fundo colorido + rótulo quando ativa, encolhe pra só o ícone quando não.
function TabChip({
  label,
  Icon,
  active,
  onPress,
  colors,
}: {
  label: string;
  Icon: IconComponent;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rgbTriplet = useMemo(() => hexToRgbTriplet(colors.primary), [colors.primary]);
  const activeBg = `rgba(${rgbTriplet}, 1)`;
  const activeBgTransparent = `rgba(${rgbTriplet}, 0)`;

  const grow = useSharedValue(active ? 1 : 0);

  useEffect(() => {
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
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(grow.value, 1));
    return {
      opacity: progress,
      maxWidth: progress * 120,
      marginLeft: progress * 8,
    };
  });

  // Cross-fade dos dois tons do ícone acompanhando `grow`, igual ao chip de
  // período — sem isso a cor troca num frame só enquanto o fundo ainda anima.
  const iconMutedStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, Math.min(grow.value, 1)),
  }));
  const iconOnPrimaryStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(grow.value, 1)),
  }));

  return (
    <AnimatedPressable onPress={onPress} style={[styles.chip, chipStyle]}>
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.iconLayer, iconMutedStyle]}>
          <Icon color={colors.textMuted} size={22} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, iconOnPrimaryStyle]}>
          <Icon color={colors.onPrimary} size={22} />
        </Animated.View>
      </View>
      <Animated.Text numberOfLines={1} style={[styles.label, labelStyle]}>
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

// Tab bar customizada substituindo a padrão do react-navigation, pra ter o
// mesmo visual/animação do MealPeriodSelector (bandeja + chip ativo expandido).
export default function MainTabBar({state, descriptors, navigation}: BottomTabBarProps) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Reimplementação do tabBarHideOnKeyboard (só existe pra tab bar padrão):
  // some enquanto o teclado estiver aberto, pra não subir junto com ele.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (keyboardVisible) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}>
      <View style={styles.tray}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const label = (options.title ?? route.name) as string;
          const active = state.index === index;
          const Icon = TAB_ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!active && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabChip
              key={route.key}
              label={label}
              Icon={Icon}
              active={active}
              onPress={onPress}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  tray: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.backgroundAlt2,
    borderRadius: radius.chip + 6,
    padding: 6,
  },
  chip: {
    height: 50,
    flexBasis: 50,
    flexShrink: 0,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
