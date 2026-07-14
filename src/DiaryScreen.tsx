import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {View, Text, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Svg, {Circle} from 'react-native-svg';
import {useCalorie} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import PressableScale from './PressableScale';
import {ThemeToggle} from './ThemeToggle';
import {spacing} from './theme';
import {makeStyles} from './DiaryScreen.styles';
import {loadFoodCatalog, type Food} from './data/foodCatalogStorage';
import {loadUserFoods} from './data/userFoodsStorage';
import {loadUserRecipes} from './data/userRecipesStorage';
import type {Recipe} from './data/recipes';
import DiaryCalendarModal from './DiaryCalendarModal';
import {GoalsInfoModal} from './DiaryInsightsModals';
import ScheduledAgendaSection from './ScheduledAgendaSection';
import {getFoquinhoStage} from './MutantDropMascot';
import {DiaryMascot} from './DiaryMascot';
import {FoquinhoStatesModal} from './FoquinhoStatesModal';
import {CalendarIcon} from './CalendarIcon';
import {
  DIARY_MASCOT_NAMES,
  DIARY_MASCOT_ACCENTS,
  loadDiaryMascot,
  saveDiaryMascot,
  type DiaryMascotId,
} from './data/mascotStorage';
import {parseDateKey, addDays, dateKey, formatLong, todayKey} from './dateUtils';

const RING_SIZE = 136;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function DiaryScreen() {
  const {
    dailyGoal,
    macroGoals,
    selectedDate,
    setSelectedDate,
    totalConsumed,
    macrosConsumed,
    foodsByDate,
    consumedFoods,
    plannedByDate,
    clearPlannedForDates,
    waterConsumed,
    waterGoalMl,
    addWater,
  } = useCalorie();
  const {colors, mode} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [userFoodsOnly, setUserFoodsOnly] = useState<Food[]>([]);
  const [catalogOnly, setCatalogOnly] = useState<Food[]>([]);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [goalsInfoVisible, setGoalsInfoVisible] = useState(false);
  const [foquinhoStatesVisible, setFoquinhoStatesVisible] = useState(false);
  const [selectedMascot, setSelectedMascot] = useState<DiaryMascotId>('foquinho');
  const [screenMotionSignal, setScreenMotionSignal] = useState(0);

  useEffect(() => {
    let active = true;
    loadDiaryMascot().then(mascot => {
      if (active) setSelectedMascot(mascot);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectMascot = useCallback((mascot: DiaryMascotId) => {
    setSelectedMascot(mascot);
    saveDiaryMascot(mascot);
  }, []);

  // useFocusEffect (não useEffect simples) porque as abas ficam montadas em
  // memória: sem isso, um alimento salvo no Scanner só apareceria como opção
  // no popup de calendário depois de reiniciar o app. Mesmo padrão usado em
  // Organização/AddFoodSection. Alimentar o diário em si agora acontece na
  // aba Organização (seção "Adicionar alimento"); aqui só carregamos o
  // catálogo pra alimentar o popup de calendário.
  useFocusEffect(
    useCallback(() => {
      Promise.all([loadFoodCatalog(), loadUserFoods(), loadUserRecipes()]).then(
        ([catalogFoods, userFoodsList, userRecipesList]) => {
          setCatalogOnly(catalogFoods);
          setUserFoodsOnly(userFoodsList);
          setUserRecipes(userRecipesList);
        },
      );
    }, []),
  );

  const goal = dailyGoal ?? 0;

  // Cada macro ocupa um terço fixo do anel (não proporcional entre si), e
  // cada terço enche de acordo com o progresso daquele macro em relação à
  // própria meta — travado em 100% pra nunca invadir o terço vizinho.
  const RING_THIRD = RING_CIRCUMFERENCE / 3;

  const proteinGoalForRing = macroGoals?.protein ?? 0;
  const carbsGoalForRing = macroGoals?.carbs ?? 0;
  const fatGoalForRing = macroGoals?.fat ?? 0;

  const proteinRingProgress =
    proteinGoalForRing > 0 ? Math.min(macrosConsumed.protein / proteinGoalForRing, 1) : 0;
  const carbsRingProgress =
    carbsGoalForRing > 0 ? Math.min(macrosConsumed.carbs / carbsGoalForRing, 1) : 0;
  const fatRingProgress =
    fatGoalForRing > 0 ? Math.min(macrosConsumed.fat / fatGoalForRing, 1) : 0;

  const proteinArcLength = RING_THIRD * proteinRingProgress;
  const carbsArcLength = RING_THIRD * carbsRingProgress;
  const fatArcLength = RING_THIRD * fatRingProgress;

  const proteinArcOffset = 0;
  const carbsArcOffset = RING_THIRD;
  const fatArcOffset = RING_THIRD * 2;

  const proteinLeft = Math.max((macroGoals?.protein ?? 0) - macrosConsumed.protein, 0);
  const carbsLeft = Math.max((macroGoals?.carbs ?? 0) - macrosConsumed.carbs, 0);
  const fatLeft = Math.max((macroGoals?.fat ?? 0) - macrosConsumed.fat, 0);
  const calorieProgress = goal > 0 ? totalConsumed / goal : 0;
  const foquinhoStage = getFoquinhoStage(consumedFoods.length, calorieProgress);
  const mascotAccent = DIARY_MASCOT_ACCENTS[selectedMascot][mode];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {paddingTop: spacing.lg + insets.top}]}
        onScrollBeginDrag={() => setScreenMotionSignal(signal => signal + 1)}>
        <View style={styles.header}>
          <View style={styles.themeToggleCorner}>
            <ThemeToggle />
          </View>
          <Text style={styles.headerTitle}>Diário</Text>
          <View style={styles.dateRow}>
            <PressableScale
              style={styles.dateArrow}
              onPress={() => setSelectedDate(dateKey(addDays(parseDateKey(selectedDate), -1)))}>
              <Text style={styles.dateArrowText}>‹</Text>
            </PressableScale>
            {/* Tocar na data abre o popup de calendário pra selecionar outro
                dia rapidamente, em vez de navegar pra outra tela. */}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Abrir calendário"
              onPress={() => setCalendarModalVisible(true)}>
              <View style={styles.dateButtonContent}>
                <CalendarIcon color={colors.primary} />
                <Text style={styles.headerDate}>{formatLong(parseDateKey(selectedDate))}</Text>
              </View>
            </PressableScale>
            <PressableScale
              style={styles.dateArrow}
              onPress={() => setSelectedDate(dateKey(addDays(parseDateKey(selectedDate), 1)))}>
              <Text style={styles.dateArrowText}>›</Text>
            </PressableScale>
          </View>
          {selectedDate !== todayKey() && (
            <PressableScale onPress={() => setSelectedDate(todayKey())}>
              <Text style={styles.todayLink}>Voltar para hoje</Text>
            </PressableScale>
          )}
        </View>

        <View
          accessibilityLabel={`Cor de identidade de ${DIARY_MASCOT_NAMES[selectedMascot]}`}
          style={[styles.mascotAccentStripe, {backgroundColor: mascotAccent}]}
        />

        <View style={styles.summaryCard}>
          {/* (i): explica de onde vêm os números das metas (fórmulas + estudos). */}
          <PressableScale
            style={styles.goalsInfoButton}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            onPress={() => setGoalsInfoVisible(true)}>
            <Text style={styles.goalsInfoButtonText}>i</Text>
          </PressableScale>
          <View style={styles.summaryContent}>
            <View style={styles.ringWrapper}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.progressTrack}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.protein}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${proteinArcLength} ${RING_CIRCUMFERENCE - proteinArcLength}`}
                strokeDashoffset={-proteinArcOffset}
                fill="none"
                rotation={-90}
                originX={RING_SIZE / 2}
                originY={RING_SIZE / 2}
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.carbs}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${carbsArcLength} ${RING_CIRCUMFERENCE - carbsArcLength}`}
                strokeDashoffset={-carbsArcOffset}
                fill="none"
                rotation={-90}
                originX={RING_SIZE / 2}
                originY={RING_SIZE / 2}
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.fat}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${fatArcLength} ${RING_CIRCUMFERENCE - fatArcLength}`}
                strokeDashoffset={-fatArcOffset}
                fill="none"
                rotation={-90}
                originX={RING_SIZE / 2}
                originY={RING_SIZE / 2}
              />
              </Svg>
              <View style={[styles.ringCenter, {width: RING_SIZE, height: RING_SIZE}]}>
                <Text style={styles.ringKcal}>{totalConsumed}</Text>
                <Text style={styles.ringGoal}>de {goal} kcal</Text>
              </View>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Trocar mascote e conhecer os estados de ${DIARY_MASCOT_NAMES[selectedMascot]}`}
              style={styles.mascotWrapper}
              onPress={() => setFoquinhoStatesVisible(true)}>
              <DiaryMascot
                mascotId={selectedMascot}
                foodCount={consumedFoods.length}
                calorieProgress={calorieProgress}
                macrosConsumed={macrosConsumed}
                macroGoals={macroGoals}
                screenMotionSignal={screenMotionSignal}
              />
              <Text style={styles.mascotName}>{DIARY_MASCOT_NAMES[selectedMascot]}</Text>
              <Text style={styles.mascotHint}>Trocar · Ver estados</Text>
            </PressableScale>
          </View>
        </View>

        {/* Card separado do anel de calorias -- só um respiro pequeno entre
            os dois, não mais tudo dentro do mesmo card. */}
        <View style={styles.macroCard}>
          <View style={styles.macroRow}>
            <View style={styles.macroChip}>
              <View style={[styles.macroIconSquare, {backgroundColor: colors.protein}]} />
              <Text style={styles.macroLabel}>Proteína</Text>
              <Text style={[styles.macroValue, {color: colors.protein}]}>
                {Math.round(proteinLeft)}g
              </Text>
            </View>
            <View style={styles.macroChip}>
              <View style={[styles.macroIconSquare, {backgroundColor: colors.carbs}]} />
              <Text style={styles.macroLabel}>Carbo</Text>
              <Text style={[styles.macroValue, {color: colors.carbs}]}>
                {Math.round(carbsLeft)}g
              </Text>
            </View>
            <View style={styles.macroChip}>
              <View style={[styles.macroIconSquare, {backgroundColor: colors.fat}]} />
              <Text style={styles.macroLabel}>Gordura</Text>
              <Text style={[styles.macroValue, {color: colors.fat}]}>
                {Math.round(fatLeft)}g
              </Text>
            </View>
          </View>
        </View>

        {/* Água: contador simples com template de +200 ml (e −200 pra
            desfazer). Meta vem do contexto (35 ml/kg, com fallback). */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>💧 Água</Text>
            <Text style={styles.waterAmount}>
              {waterConsumed} <Text style={styles.waterGoalText}>de {waterGoalMl} ml</Text>
            </Text>
          </View>
          <View style={styles.waterTrack}>
            <View
              style={[
                styles.waterFill,
                {width: `${Math.min(waterConsumed / waterGoalMl, 1) * 100}%`},
              ]}
            />
          </View>
          <View style={styles.waterButtonRow}>
            <PressableScale
              style={styles.waterUndoButton}
              onPress={() => addWater(-200)}
              disabled={waterConsumed === 0}>
              <Text
                style={[
                  styles.waterUndoButtonText,
                  waterConsumed === 0 && styles.waterUndoButtonTextDisabled,
                ]}>
                −200 ml
              </Text>
            </PressableScale>
            <PressableScale style={styles.waterAddButton} onPress={() => addWater(200)}>
              <Text style={styles.waterAddButtonText}>+200 ml</Text>
            </PressableScale>
          </View>
        </View>

        {/* Alimentação Programada: substitui a necessidade de navegar pra
            outra tela só pra ver o planejamento do dia. */}
        <ScheduledAgendaSection dateKey={selectedDate} />
      </ScrollView>

      <GoalsInfoModal visible={goalsInfoVisible} onClose={() => setGoalsInfoVisible(false)} />
      <FoquinhoStatesModal
        visible={foquinhoStatesVisible}
        onClose={() => setFoquinhoStatesVisible(false)}
        currentStage={foquinhoStage}
        selectedMascot={selectedMascot}
        onSelectMascot={handleSelectMascot}
      />

      <DiaryCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        dailyGoal={dailyGoal}
        foodsByDate={foodsByDate}
        plannedByDate={plannedByDate}
        catalog={catalogOnly}
        userFoods={userFoodsOnly}
        userRecipes={userRecipes}
        onClearDates={clearPlannedForDates}
      />
    </View>
  );
}
