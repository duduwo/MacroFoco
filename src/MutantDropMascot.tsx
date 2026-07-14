import React, {useEffect, useMemo, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, Ellipse, Line, Path} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from './context/ThemeContext';

export type MacroValues = {protein: number; carbs: number; fat: number};

export type MascotProps = {
  foodCount: number;
  calorieProgress: number;
  macrosConsumed: MacroValues;
  macroGoals: MacroValues | null;
  size?: number;
  forcedStage?: FoquinhoStage;
  screenMotionSignal?: number;
};

export type FoquinhoStage = 0 | 1 | 2 | 3 | 4;

const clamp01 = (value: number) => Math.max(0, Math.min(value, 1));

// A forma cresce por etapas conforme alimentos realmente entram no Diário.
// O progresso calórico também permite chegar às formas finais mesmo quando
// poucas refeições concentram uma parte grande da meta do dia.
export function getFoquinhoStage(foodCount: number, calorieProgress: number): FoquinhoStage {
  if (foodCount === 0) return 0;
  if (calorieProgress >= 0.9 || foodCount >= 5) return 4;
  if (calorieProgress >= 0.65 || foodCount >= 4) return 3;
  if (calorieProgress >= 0.35 || foodCount >= 2) return 2;
  return 1;
}

export function MutantDropMascot({
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
      withTiming(mode === 'dark' ? -8 : 8, {duration: 150}),
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
  const body = isDark ? '#4A4033' : '#E9DFCF';
  const bodyHighlight = isDark ? '#6E6353' : '#FFF9F2';
  const face = isDark ? '#F5EFE7' : '#2B2621';
  const halo = isDark ? '#223440' : '#FBF0D9';
  const outline = isDark ? '#8C8072' : '#B3A695';

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Gotinha Foquinho, estágio ${stage + 1} de 5, ${foodCount} alimentos registrados`}
      style={{width: size, height: size}}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="51" r={stage === 4 ? 45 : 39} fill={halo} />

          {isDark ? (
            <>
              <Circle cx="20" cy="24" r="1.8" fill={colors.carbs} />
              <Circle cx="79" cy="19" r="1.3" fill={colors.text} />
              <Path d="M77 31a9 9 0 1 1-8-14 7 7 0 0 0 8 14Z" fill={colors.carbs} />
            </>
          ) : (
            <>
              <Circle cx="78" cy="23" r="6" fill={colors.carbs} />
              <Line x1="78" y1="12" x2="78" y2="8" stroke={colors.carbs} strokeWidth="2" strokeLinecap="round" />
              <Line x1="88" y1="23" x2="92" y2="23" stroke={colors.carbs} strokeWidth="2" strokeLinecap="round" />
              <Line x1="85" y1="16" x2="88" y2="13" stroke={colors.carbs} strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {stage >= 2 && (
            <>
              <Path d="M42 23C34 14 27 18 31 27c4 7 11 7 15 5" fill={colors.fatTint} stroke={colors.fat} strokeWidth="2.2" strokeLinecap="round" />
              {stage >= 3 && (
                <Path d="M57 22c6-10 15-7 13 2-2 7-8 10-14 8" fill={colors.carbsTint} stroke={colors.carbs} strokeWidth="2.2" strokeLinecap="round" />
              )}
            </>
          )}

          {stage >= 3 && (
            <>
              <Path d="M26 61c-9 1-11 8-4 11 5 2 9-1 11-5" fill={body} stroke={outline} strokeWidth="2" strokeLinecap="round" />
              <Path d="M74 60c9 0 12 7 6 11-5 3-9 0-12-4" fill={body} stroke={outline} strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          <Path
            d={
              stage === 0
                ? 'M50 20C40 36 31 48 31 63c0 14 8 23 19 23s19-9 19-23c0-15-9-27-19-43Z'
                : stage === 1
                  ? 'M50 15C38 32 26 47 26 64c0 16 10 26 24 26s24-10 24-26c0-17-12-32-24-49Z'
                  : 'M50 13C36 31 24 46 24 64c0 17 11 27 26 27s26-10 26-27c0-18-12-33-26-51Z'
            }
            fill={body}
            stroke={outline}
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <Path d="M42 30c-7 10-11 18-12 26" fill="none" stroke={bodyHighlight} strokeWidth="4" strokeLinecap="round" opacity="0.72" />

          {stage > 0 && (
            <>
              <Circle cx="39" cy="58" r={3.1 + macroProgress.protein * 2.2} fill={colors.protein} opacity={0.45 + macroProgress.protein * 0.55} />
              <Circle cx="50" cy="72" r={3.1 + macroProgress.carbs * 2.2} fill={colors.carbs} opacity={0.45 + macroProgress.carbs * 0.55} />
              <Circle cx="62" cy="58" r={3.1 + macroProgress.fat * 2.2} fill={colors.fat} opacity={0.45 + macroProgress.fat * 0.55} />
            </>
          )}

          {stage === 0 ? (
            <>
              <Path d="M39 58h7" stroke={face} strokeWidth="2.3" strokeLinecap="round" />
              <Path d="M55 58h7" stroke={face} strokeWidth="2.3" strokeLinecap="round" />
              <Path d="M47 69c2-1 4-1 6 0" fill="none" stroke={face} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : isDark ? (
            <>
              <Path d="M36 54c3 3 6 3 9 0" fill="none" stroke={face} strokeWidth="2.5" strokeLinecap="round" />
              <Path d="M56 54c3 3 6 3 9 0" fill="none" stroke={face} strokeWidth="2.5" strokeLinecap="round" />
              <Path d="M46 64c3 3 6 3 9 0" fill="none" stroke={face} strokeWidth="2.2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <Ellipse cx="41" cy="55" rx="2.6" ry="3.4" fill={face} />
              <Ellipse cx="61" cy="55" rx="2.6" ry="3.4" fill={face} />
              <Path d="M46 64c3 4 7 4 10 0" fill="none" stroke={face} strokeWidth="2.2" strokeLinecap="round" />
            </>
          )}

          {stage >= 4 && (
            <Path d="M29 83c6 9 35 11 43-1" fill="none" stroke={colors.primary} strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}
