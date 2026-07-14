import React, {useEffect, useMemo, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, Ellipse, Path, Rect} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from './context/ThemeContext';
import {getFoquinhoStage, type MascotProps} from './MutantDropMascot';

const clamp01 = (value: number) => Math.max(0, Math.min(value, 1));

export function PanelitoMascot({
  foodCount,
  calorieProgress,
  macrosConsumed,
  macroGoals,
  size = 92,
  forcedStage,
  screenMotionSignal = 0,
}: MascotProps) {
  const {mode, colors} = useTheme();
  const stage = forcedStage ?? getFoquinhoStage(foodCount, calorieProgress);
  const previousFoodCount = useRef(foodCount);
  const themeTurn = useSharedValue(0);
  const foodBounce = useSharedValue(1);
  const screenShake = useSharedValue(0);
  const screenShift = useSharedValue(0);

  useEffect(() => {
    themeTurn.value = withSequence(
      withTiming(mode === 'dark' ? -5 : 5, {duration: 150}),
      withSpring(0, {damping: 11, stiffness: 190}),
    );
  }, [mode, themeTurn]);

  useEffect(() => {
    if (foodCount > previousFoodCount.current) {
      foodBounce.value = withSequence(
        withSpring(1.13, {damping: 9, stiffness: 230}),
        withSpring(1, {damping: 10, stiffness: 180}),
      );
    }
    previousFoodCount.current = foodCount;
  }, [foodCount, foodBounce]);

  useEffect(() => {
    if (screenMotionSignal === 0) return;
    screenShake.value = withSequence(
      withTiming(-7, {duration: 65}),
      withTiming(7, {duration: 90}),
      withTiming(-4, {duration: 75}),
      withSpring(0, {damping: 12, stiffness: 220}),
    );
    screenShift.value = withSequence(
      withTiming(-2, {duration: 65}),
      withTiming(2, {duration: 90}),
      withSpring(0, {damping: 13, stiffness: 230}),
    );
  }, [screenMotionSignal, screenShake, screenShift]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: screenShift.value},
      {rotate: `${themeTurn.value + screenShake.value}deg`},
      {scale: foodBounce.value},
    ],
  }));
  const macroProgress = useMemo(
    () => ({
      protein: clamp01(macrosConsumed.protein / Math.max(macroGoals?.protein ?? 1, 1)),
      carbs: clamp01(macrosConsumed.carbs / Math.max(macroGoals?.carbs ?? 1, 1)),
      fat: clamp01(macrosConsumed.fat / Math.max(macroGoals?.fat ?? 1, 1)),
    }),
    [macroGoals, macrosConsumed],
  );

  const isDark = mode === 'dark';
  const pot = isDark ? '#4A4033' : '#EDE6DC';
  const potLight = isDark ? '#6E6353' : '#FFF9F2';
  const outline = isDark ? '#A49480' : '#6A5947';
  const face = isDark ? colors.text : '#2B2621';
  const halo = isDark ? '#3D2A22' : '#F5E4DD';

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Panelito, estágio ${stage + 1} de 5, ${foodCount} alimentos registrados`}
      style={{width: size, height: size}}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="52" r={stage === 4 ? 45 : 39} fill={halo} />
          {isDark && (
            <>
              <Circle cx="19" cy="23" r="1.4" fill={colors.carbs} />
              <Circle cx="81" cy="18" r="1.1" fill={colors.text} />
            </>
          )}

          {stage >= 1 && (
            <Path d="M45 25c-6-7 5-10 0-18" fill="none" stroke={stage >= 4 ? colors.protein : outline} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          )}
          {stage >= 2 && (
            <Path d="M56 24c7-8-4-11 1-19" fill="none" stroke={stage >= 4 ? colors.carbs : outline} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          )}
          {stage >= 3 && (
            <Path d="M67 28c6-6-2-9 3-15" fill="none" stroke={stage >= 4 ? colors.fat : outline} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          )}

          {stage >= 2 && (
            <>
              <Path d="M28 54c-10-2-13 5-8 10 4 4 9 1 12-2" fill={pot} stroke={outline} strokeWidth="2.2" />
              <Path d="M72 54c10-2 13 5 8 10-4 4-9 1-12-2" fill={pot} stroke={outline} strokeWidth="2.2" />
            </>
          )}

          <Path
            d={stage === 0 ? 'M31 43h38l-3 35c-1 8-7 11-16 11s-15-3-16-11Z' : 'M27 42h46l-3 37c-1 8-9 12-20 12s-19-4-20-12Z'}
            fill={pot}
            stroke={outline}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <Path d="M36 51c-2 9-2 18 0 26" fill="none" stroke={potLight} strokeWidth="4" strokeLinecap="round" opacity="0.65" />

          {stage >= 3 && (
            <>
              <Ellipse cx="39" cy="88" rx="8" ry="4" fill={outline} />
              <Ellipse cx="62" cy="88" rx="8" ry="4" fill={outline} />
            </>
          )}

          <Path
            d={stage === 0 ? 'M27 42c8-8 38-8 46 0Z' : 'M25 42c8-10 42-10 50 0Z'}
            fill={colors.primary}
            stroke={outline}
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <Path d={stage >= 2 ? 'M29 39 68 29c5-1 9 3 7 8L34 47Z' : 'M27 40h46'} fill={colors.primary} stroke={outline} strokeWidth="2.3" strokeLinejoin="round" />
          <Rect x="46" y={stage >= 2 ? 25 : 31} width="9" height="6" rx="3" fill={outline} />

          {stage > 0 && (
            <>
              <Circle cx="39" cy="72" r={2.6 + macroProgress.protein * 1.8} fill={colors.protein} opacity={0.5 + macroProgress.protein * 0.5} />
              <Circle cx="50" cy="78" r={2.6 + macroProgress.carbs * 1.8} fill={colors.carbs} opacity={0.5 + macroProgress.carbs * 0.5} />
              <Circle cx="61" cy="72" r={2.6 + macroProgress.fat * 1.8} fill={colors.fat} opacity={0.5 + macroProgress.fat * 0.5} />
            </>
          )}

          {stage === 0 || isDark ? (
            <>
              <Path d="M38 58h7" stroke={face} strokeWidth="2.2" strokeLinecap="round" />
              <Path d="M55 58h7" stroke={face} strokeWidth="2.2" strokeLinecap="round" />
              <Path d="M46 67c3 2 5 2 8 0" fill="none" stroke={face} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <Ellipse cx="42" cy="58" rx="2.6" ry="3.3" fill={face} />
              <Ellipse cx="59" cy="58" rx="2.6" ry="3.3" fill={face} />
              <Path d="M46 66c3 4 6 4 9 0" fill="none" stroke={face} strokeWidth="2.1" strokeLinecap="round" />
            </>
          )}
          {stage >= 4 && (
            <Path d="M28 84c8 9 36 10 45 0" fill="none" stroke={colors.primary} strokeWidth="2.3" strokeLinecap="round" opacity="0.7" />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}
