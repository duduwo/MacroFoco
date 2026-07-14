import React, {useEffect, useMemo, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, Ellipse, Path} from 'react-native-svg';
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

export function SproutMascot({
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
      withTiming(mode === 'dark' ? -6 : 6, {duration: 150}),
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
  const seed = isDark ? '#5A4632' : '#E7D4B5';
  const seedLight = isDark ? '#80684E' : '#FFF9F2';
  const outline = isDark ? '#A49480' : '#6A5947';
  const face = isDark ? colors.text : '#2B2621';
  const leaf = isDark ? '#58765B' : '#8DA07B';
  const leafLight = isDark ? '#78977A' : '#B4C5A2';
  const halo = isDark ? '#253A28' : '#E8F0E4';

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Mudinha, estágio ${stage + 1} de 5, ${foodCount} alimentos registrados`}
      style={{width: size, height: size}}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="51" r={stage === 4 ? 45 : 39} fill={halo} />
          {isDark && (
            <>
              <Circle cx="20" cy="25" r="1.5" fill={colors.carbs} />
              <Circle cx="81" cy="19" r="1.2" fill={colors.text} />
            </>
          )}

          {stage >= 1 && (
            <Path d="M50 43C49 34 49 27 50 20" fill="none" stroke={outline} strokeWidth="3" strokeLinecap="round" />
          )}
          {stage >= 1 && (
            <Path d="M49 30C39 19 29 22 31 32c2 8 11 10 18 6Z" fill={leaf} stroke={outline} strokeWidth="2" strokeLinejoin="round" />
          )}
          {stage >= 2 && (
            <Path d="M51 25C58 13 70 15 69 25c-1 9-10 12-18 9Z" fill={leafLight} stroke={outline} strokeWidth="2" strokeLinejoin="round" />
          )}
          {stage >= 3 && (
            <>
              <Path d="M36 42C27 34 20 40 24 47c4 6 10 5 15 2Z" fill={leafLight} stroke={outline} strokeWidth="2" strokeLinejoin="round" />
              <Path d="M65 42c9-8 16-2 12 5-4 6-10 5-15 2Z" fill={leaf} stroke={outline} strokeWidth="2" strokeLinejoin="round" />
            </>
          )}
          {stage >= 4 && (
            <>
              <Circle cx="50" cy="16" r="5" fill={colors.carbs} />
              <Circle cx="50" cy="8.5" r="4.5" fill={colors.protein} />
              <Circle cx="42.8" cy="13.5" r="4.5" fill={colors.fat} />
              <Circle cx="57.2" cy="13.5" r="4.5" fill={colors.protein} />
            </>
          )}

          {stage >= 3 && (
            <>
              <Path d="M29 62c-8 1-10 7-4 10 5 2 8-1 10-5" fill={leaf} stroke={outline} strokeWidth="2" strokeLinecap="round" />
              <Path d="M71 62c8 1 10 7 4 10-5 2-8-1-10-5" fill={leaf} stroke={outline} strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          <Path
            d={
              stage === 0
                ? 'M50 30C37 35 31 49 33 65c2 15 8 22 17 22s15-7 17-22c2-16-4-30-17-35Z'
                : stage === 1
                  ? 'M50 37C36 37 29 50 31 67c2 15 9 22 19 22s17-7 19-22c2-17-5-30-19-30Z'
                  : 'M50 34C34 34 26 49 29 68c2 15 10 23 21 23s19-8 21-23c3-19-5-34-21-34Z'
            }
            fill={seed}
            stroke={outline}
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <Path d="M39 45c-5 8-6 17-5 25" fill="none" stroke={seedLight} strokeWidth="4" strokeLinecap="round" opacity="0.65" />

          {stage > 0 && (
            <>
              <Circle cx="38" cy="69" r={2.8 + macroProgress.protein * 1.8} fill={colors.protein} opacity={0.5 + macroProgress.protein * 0.5} />
              <Circle cx="50" cy="77" r={2.8 + macroProgress.carbs * 1.8} fill={colors.carbs} opacity={0.5 + macroProgress.carbs * 0.5} />
              <Circle cx="62" cy="69" r={2.8 + macroProgress.fat * 1.8} fill={colors.fat} opacity={0.5 + macroProgress.fat * 0.5} />
            </>
          )}

          {stage === 0 || isDark ? (
            <>
              <Path d="M39 57h7" stroke={face} strokeWidth="2.2" strokeLinecap="round" />
              <Path d="M55 57h7" stroke={face} strokeWidth="2.2" strokeLinecap="round" />
              <Path d="M46 66c3 2 5 2 8 0" fill="none" stroke={face} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <Ellipse cx="42" cy="57" rx="2.6" ry="3.3" fill={face} />
              <Ellipse cx="59" cy="57" rx="2.6" ry="3.3" fill={face} />
              <Path d="M46 65c3 4 6 4 9 0" fill="none" stroke={face} strokeWidth="2.1" strokeLinecap="round" />
            </>
          )}
          <Ellipse cx="50" cy="91" rx={stage >= 4 ? 24 : 18} ry="3" fill={outline} opacity="0.18" />
        </Svg>
      </Animated.View>
    </View>
  );
}
