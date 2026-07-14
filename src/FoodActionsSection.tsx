import React, {useCallback, useMemo, useState} from 'react';
import {View, Text, FlatList, Pressable, TextInput, Modal} from 'react-native';
import PressableScale from './PressableScale';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types/navigation';
import {useCalorie, type MealPeriod} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import {getTintByMacro} from './theme';
import {FoodIcon} from './FoodIcon';
import {makeStyles} from './FoodActionsSection.styles';
import {loadFoodCatalog, type Food} from './data/foodCatalogStorage';
import {loadUserFoods} from './data/userFoodsStorage';
import {
  scaleDosage,
  scaleMacros,
  dominantMacro,
  QUANTITY_STEPS,
  fitScore,
  getMacroTimeWeights,
  applyTimeWeights,
  getPeriodFitWeight,
  MEAL_PERIOD_OPTIONS as PERIODS,
} from './foodMath';
import {toTimestamp} from './data/planningResolvers';
import {
  schedulePlannedNotification,
  requestNotificationPermission,
  getScheduledNotifyOffsetMinutes,
} from './notifications';
import QuickScheduleModal from './QuickScheduleModal';

const RECOMMENDED_COUNT = 4;

// "Avulso" deixou de ser uma opção selecionável de período — continua
// existindo no tipo MealPeriod só como fallback de exibição para alimentos
// salvos antes dessa funcionalidade existir (ver AI_CONTEXT.md, seção
// Persistência). Filtrado aqui pra não aparecer como opção de novo alimento.
const SELECTABLE_PERIODS = PERIODS.filter(p => p.key !== 'avulso');

// Fusao das antigas abas "Adicionar" (Diario) e "Alimentos Individuais" de
// Organizacao: mesma base de dados, mesma busca/recomendacao. O modal de
// quantidade (long-press) deixou de ter um agendamento avulso próprio --
// o único ponto de entrada de agendamento é o atalho "Agendar nesse dia"
// (ver `sessionForToday`/`currentSessionSlot` abaixo). O consumo direto
// continua caindo no dia selecionado no Diario (addFood usa selectedDate
// do CalorieContext).
type FoodActionsSectionProps = {
  /** Quando presente, o "+" chama este callback em vez de persistir direto. */
  onAddFood?: (food: Food, quantity: number) => void;
  /** Quando presente, usa este período e oculta o seletor interno. */
  externalPeriod?: MealPeriod;
};

export default function FoodActionsSection({onAddFood, externalPeriod}: FoodActionsSectionProps) {
  const {
    macroGoals,
    macrosConsumed,
    selectedDate,
    addPlannedItem,
    updatePlannedItem,
    addImmediatePlannedItem,
    activeQuickSchedule,
    advanceQuickSchedule,
  } = useCalorie();
  const navigation = useNavigation();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tintByMacro = useMemo(() => getTintByMacro(colors), [colors]);
  // Cor do ícone do alimento, em cima do fundo tingido do mesmo macro --
  // usa a cor sólida (não a versão pálida) pra ter contraste.
  const iconColorByMacro = useMemo(
    () => ({protein: colors.protein, carbs: colors.carbs, fat: colors.fat}),
    [colors],
  );

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [foods, setFoods] = useState<Food[]>([]);
  const [userFoods, setUserFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyRegistered, setShowOnlyRegistered] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<MealPeriod>('manha');
  // externalPeriod tem prioridade quando o componente é controlado externamente
  const activePeriod: MealPeriod = externalPeriod ?? selectedPeriod;

  // Programação deixou de ser aba própria em Organização, e o botão
  // "Programação avançada" (ScheduleSection, wizard completo) foi removido
  // de vez -- o único ponto de entrada de agendamento agora é o atalho
  // "Agendar nesse dia" (ver AI_CONTEXT.md -- seção Organização). Ele não
  // escolhe mais o item aqui dentro: só define horários + tipo, abre uma
  // sessão ativa (`activeQuickSchedule`) no CalorieContext, e a escolha de
  // cada item acontece nesta própria lista (ou na de Receitas), na ordem
  // dos horários, via `sessionForToday`/`currentSessionSlot` abaixo.
  const [quickScheduleVisible, setQuickScheduleVisible] = useState(false);

  // Sessão de "Agendar nesse dia" em aberto pro dia selecionado, se houver.
  // Só é relevante aqui quando o dia da sessão bate com o dia selecionado
  // no Diário -- outro dia não deve mexer nessa lista.
  const sessionForToday =
    activeQuickSchedule && activeQuickSchedule.dateKey === selectedDate ? activeQuickSchedule : null;
  const currentSessionSlot = sessionForToday ? sessionForToday.slots[sessionForToday.currentIndex] : null;
  const sessionWantsFood = currentSessionSlot?.type === 'food';

  // useFocusEffect (não useEffect simples) pelo mesmo motivo do antigo
  // Diário: um alimento salvo no Scanner só apareceria aqui depois de
  // reiniciar o app sem isso, já que as abas ficam montadas em memória.
  useFocusEffect(
    useCallback(() => {
      Promise.all([loadFoodCatalog(), loadUserFoods()]).then(([catalogFoods, userFoodsList]) => {
        setFoods([...userFoodsList, ...catalogFoods]);
        setUserFoods(userFoodsList);
      });
    }, []),
  );

  const proteinLeft = Math.max((macroGoals?.protein ?? 0) - macrosConsumed.protein, 0);
  const carbsLeft = Math.max((macroGoals?.carbs ?? 0) - macrosConsumed.carbs, 0);
  const fatLeft = Math.max((macroGoals?.fat ?? 0) - macrosConsumed.fat, 0);

  // Percentual da meta de cada macro que ainda falta — mesmo cálculo que
  // existia no Diário, pra recomendação comparar proporcionalmente à meta
  // de cada macro em vez de gramas absolutas.
  const proteinGoalValue = macroGoals?.protein ?? 0;
  const carbsGoalValue = macroGoals?.carbs ?? 0;
  const fatGoalValue = macroGoals?.fat ?? 0;
  const remainingPct = useMemo(
    () => ({
      protein: proteinGoalValue > 0 ? proteinLeft / proteinGoalValue : 0,
      carbs: carbsGoalValue > 0 ? carbsLeft / carbsGoalValue : 0,
      fat: fatGoalValue > 0 ? fatLeft / fatGoalValue : 0,
    }),
    [proteinGoalValue, carbsGoalValue, fatGoalValue, proteinLeft, carbsLeft, fatLeft],
  );
  const remaining = useMemo(
    () => applyTimeWeights(remainingPct, getMacroTimeWeights(activePeriod)),
    [remainingPct, activePeriod],
  );
  const hasGoalToChase = macroGoals !== null && (proteinLeft + carbsLeft + fatLeft) > 0;

  const PIN_NEED_THRESHOLD = 0.2;
  const proteinNeeded = remainingPct.protein > PIN_NEED_THRESHOLD;
  const carbsNeeded = remainingPct.carbs > PIN_NEED_THRESHOLD;
  const pinnedFoods = useMemo(() => {
    if (!hasGoalToChase || foods.length === 0) return [] as Food[];
    if (!proteinNeeded && !carbsNeeded) return [];

    const stapleForPeriod = foods.filter(f => f.staple && f.commonPeriods?.includes(activePeriod));
    const pickTop = (macro: 'protein' | 'carbs') => {
      const preferred = stapleForPeriod.filter(f => f.pinnedPick === macro);
      if (preferred.length >= 2) return preferred.slice(0, 2);
      const fallback = stapleForPeriod
        .filter(f => f.pinnedPick !== macro)
        .sort((a, b) => b[macro] - a[macro]);
      return [...preferred, ...fallback].slice(0, 2);
    };

    return [...(proteinNeeded ? pickTop('protein') : []), ...(carbsNeeded ? pickTop('carbs') : [])];
  }, [activePeriod, hasGoalToChase, foods, proteinNeeded, carbsNeeded]);

  const {sortedFoods, recommendedKeys} = useMemo(() => {
    if (!hasGoalToChase || foods.length === 0) {
      return {sortedFoods: foods, recommendedKeys: new Set<string>()};
    }
    const withScore = foods.map(f => ({
      food: f,
      score: fitScore(f, remaining) * getPeriodFitWeight(f.commonPeriods, activePeriod, f.staple),
    }));
    withScore.sort((a, b) => {
      if (a.food.ultraProcessed !== b.food.ultraProcessed) {
        return a.food.ultraProcessed ? 1 : -1;
      }
      return b.score - a.score;
    });
    const sorted = withScore.map(w => w.food);

    const pinnedKeys = new Set(pinnedFoods.map(f => f.name + f.dosage));
    const rest = sorted.filter(f => !pinnedKeys.has(f.name + f.dosage));
    const finalSorted = [...pinnedFoods, ...rest];

    const remainingSlots = Math.max(RECOMMENDED_COUNT - pinnedKeys.size, 0);
    const top = new Set(pinnedKeys);
    rest
      .filter(f => !f.ultraProcessed)
      .slice(0, remainingSlots)
      .forEach(f => top.add(f.name + f.dosage));

    return {sortedFoods: finalSorted, recommendedKeys: top};
  }, [foods, hasGoalToChase, remaining, activePeriod, pinnedFoods]);

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const query = normalize(searchQuery.trim());
  const filteredByMode = showOnlyRegistered
    ? sortedFoods.filter(f => userFoods.some(u => u.name === f.name && u.dosage === f.dosage))
    : sortedFoods;

  const visibleFoods = query
    ? filteredByMode.filter(f => normalize(f.name).includes(query))
    : filteredByMode;

  const openFoodDetail = (food: Food) => {
    setSelectedFood(food);
    setQuantity(1);
  };

  const scaledSelected = selectedFood ? scaleMacros(selectedFood, quantity) : null;

  // Fonte (catálogo vs personalizado) usada tanto pro preenchimento de
  // sessão quanto pra adição instantânea -- mesma checagem em ambos.
  const buildFoodSource = (food: Food) => {
    const isCustom = userFoods.some(f => f.name === food.name && f.dosage === food.dosage);
    return isCustom
      ? {kind: 'foodCustom' as const, foodName: food.name}
      : {kind: 'foodCatalog' as const, foodName: food.name};
  };

  const nowTimeString = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Preenche o horário atual da sessão ativa de "Agendar nesse dia" com
  // este alimento -- mesma chamada (addPlannedItem + notificação) que o
  // QuickScheduleModal fazia antes de passar a delegar a escolha do item
  // pra cá. Ao terminar, avança a sessão pro próximo horário (ou fecha,
  // se esse era o último).
  const addToActiveSession = async (food: Food, qty: number) => {
    if (!currentSessionSlot) return;
    const source = buildFoodSource(food);

    await requestNotificationPermission();
    const notifyOffset = await getScheduledNotifyOffsetMinutes();

    const newItem = addPlannedItem({
      dateKey: selectedDate,
      time: currentSessionSlot.time,
      period: currentSessionSlot.period,
      quantityMultiplier: qty,
      source,
      notifyOffsetMinutes: notifyOffset,
    });

    const notificationId = await schedulePlannedNotification(
      newItem.id,
      toTimestamp(selectedDate, currentSessionSlot.time),
      notifyOffset,
      `Hora de: ${food.name}`,
    );
    if (notificationId) {
      updatePlannedItem(selectedDate, newItem.id, {notificationId});
    }

    advanceQuickSchedule();
  };

  // Adição instantânea, fora de sessão: grava um PlannedItem que já nasce
  // "Feito" (ver AI_CONTEXT.md -- Organização / Unificação com o Diário),
  // então esse alimento passa a aparecer tanto no total do dia quanto na
  // lista da Alimentação Programada, junto dos itens agendados.
  const addFoodNow = (
    food: Food,
    macros: {calories: number; protein: number; carbs: number; fat: number},
    qty: number,
  ) => {
    addImmediatePlannedItem(
      {
        dateKey: selectedDate,
        time: nowTimeString(),
        period: activePeriod,
        quantityMultiplier: qty,
        source: buildFoodSource(food),
      },
      {name: food.name, ...macros},
    );
  };

  // Toque no + do card: se há uma sessão ativa esperando um alimento, esse
  // toque preenche o horário atual dela em vez do consumo avulso de sempre.
  const handleQuickAdd = (food: Food) => {
    if (onAddFood) {
      onAddFood(food, 1);
      return;
    }
    if (sessionForToday && sessionWantsFood) {
      addToActiveSession(food, 1);
      return;
    }
    addFoodNow(food, {calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat}, 1);
  };

  const handleAddFromModal = () => {
    if (!selectedFood || !scaledSelected) return;
    if (onAddFood) {
      onAddFood(selectedFood, quantity);
      setSelectedFood(null);
      return;
    }
    if (sessionForToday && sessionWantsFood) {
      addToActiveSession(selectedFood, quantity);
      setSelectedFood(null);
      return;
    }
    addFoodNow(selectedFood, scaledSelected, quantity);
    setSelectedFood(null);
  };

  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, styles.sectionTitleGrow]}>Adicionar alimento</Text>
        {userFoods.length > 0 && (
          <PressableScale
            style={[styles.viewToggleButton, showOnlyRegistered && styles.viewToggleButtonActive]}
            onPress={() => setShowOnlyRegistered(v => !v)}>
            <Text
              style={[
                styles.viewToggleButtonText,
                showOnlyRegistered && styles.viewToggleButtonTextActive,
              ]}>
              Cadastrados
            </Text>
          </PressableScale>
        )}
        {/* Abre a antiga aba Scanner (código de barras / manual / alimentos
            criados), agora empilhada por cima das abas. */}
        <PressableScale
          style={styles.newFoodButton}
          onPress={() =>
            navigation
              .getParent<NativeStackNavigationProp<RootStackParamList>>()
              ?.navigate('Scanner')
          }>
          <Text style={styles.newFoodButtonText}>+ Novo</Text>
        </PressableScale>
      </View>

      {sessionForToday && (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {sessionForToday.currentIndex} de {sessionForToday.slots.length} alimentos adicionados
          </Text>
          {!sessionWantsFood && currentSessionSlot && (
            <Text style={styles.hint}>
              Próximo horário ({currentSessionSlot.time}) é uma receita — abra a aba Receitas para adicioná-la.
            </Text>
          )}
        </View>
      )}

      {!externalPeriod && (
        <>
          <Text style={styles.hint}>Período da refeição</Text>
          <View style={styles.periodRow}>
            {SELECTABLE_PERIODS.map(p => (
              <PressableScale
                key={p.key}
                style={[styles.periodChip, activePeriod === p.key && styles.periodChipActive]}
                onPress={() => setSelectedPeriod(p.key)}>
                <Text
                  style={[
                    styles.periodChipText,
                    activePeriod === p.key && styles.periodChipTextActive,
                  ]}>
                  {p.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </>
      )}

      {foods.length === 0 && <Text style={styles.hint}>Carregando catálogo de alimentos…</Text>}

      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar alimento"
        placeholderTextColor={colors.textFaint}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {query.length > 0 && visibleFoods.length === 0 && (
        <Text style={styles.hint}>Nenhum alimento encontrado para "{searchQuery}"</Text>
      )}

      <FlatList
        data={visibleFoods}
        keyExtractor={item => item.name + item.dosage}
        scrollEnabled={false}
        renderItem={({item}) => {
          const isRecommended = recommendedKeys.has(item.name + item.dosage);
          return (
            <Pressable
              style={styles.foodCardListItem}
              onLongPress={() => openFoodDetail(item)}
              delayLongPress={350}>
              <View
                style={[
                  styles.foodThumbnailList,
                  {backgroundColor: tintByMacro[dominantMacro(item)]},
                  isRecommended && styles.foodCardRecommended,
                ]}>
                <FoodIcon token={item.emoji} size={28} color={iconColorByMacro[dominantMacro(item)]} />
              </View>
              <View style={styles.foodInfoList}>
                {isRecommended && (
                  <Text style={styles.recommendedBadgeTextList}>Recomendado</Text>
                )}
                <Text style={styles.foodName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.foodDosage}>
                  {item.dosage} · {item.calories} kcal
                </Text>
              </View>
              <PressableScale style={styles.addButtonList} onPress={() => handleQuickAdd(item)}>
                <Text style={styles.addButtonText}>+</Text>
              </PressableScale>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={selectedFood !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFood(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedFood(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedFood && scaledSelected && (
              <>
                <View style={styles.modalEmoji}>
                  <FoodIcon
                    token={selectedFood.emoji}
                    size={40}
                    color={iconColorByMacro[dominantMacro(selectedFood)]}
                  />
                </View>
                <Text style={styles.modalTitle}>{selectedFood.name}</Text>
                <Text style={styles.modalDosage}>
                  {scaleDosage(selectedFood.dosage, quantity)}
                </Text>

                <View style={styles.quantityRow}>
                  <PressableScale
                    style={styles.quantityButton}
                    onPress={() => {
                      const idx = QUANTITY_STEPS.indexOf(quantity);
                      if (idx > 0) setQuantity(QUANTITY_STEPS[idx - 1]);
                    }}>
                    <Text style={styles.quantityButtonText}>−</Text>
                  </PressableScale>
                  <Text style={styles.quantityValue}>×{quantity}</Text>
                  <PressableScale
                    style={styles.quantityButton}
                    onPress={() => {
                      const idx = QUANTITY_STEPS.indexOf(quantity);
                      if (idx < QUANTITY_STEPS.length - 1) setQuantity(QUANTITY_STEPS[idx + 1]);
                    }}>
                    <Text style={styles.quantityButtonText}>+</Text>
                  </PressableScale>
                </View>

                <View style={styles.modalMacroRow}>
                  <Text style={styles.modalMacroLabel}>Calorias</Text>
                  <Text style={styles.modalMacroValue}>{scaledSelected.calories} kcal</Text>
                </View>
                <View style={styles.modalMacroRow}>
                  <Text style={styles.modalMacroLabel}>Proteína</Text>
                  <Text style={[styles.modalMacroValue, {color: colors.protein}]}>
                    {scaledSelected.protein}g
                  </Text>
                </View>
                <View style={styles.modalMacroRow}>
                  <Text style={styles.modalMacroLabel}>Carboidrato</Text>
                  <Text style={[styles.modalMacroValue, {color: colors.carbs}]}>
                    {scaledSelected.carbs}g
                  </Text>
                </View>
                <View style={styles.modalMacroRow}>
                  <Text style={styles.modalMacroLabel}>Gordura</Text>
                  <Text style={[styles.modalMacroValue, {color: colors.fat}]}>
                    {scaledSelected.fat}g
                  </Text>
                </View>

                <PressableScale style={styles.modalAddButton} onPress={handleAddFromModal}>
                  <Text style={styles.modalAddButtonText}>Adicionar ao diário</Text>
                </PressableScale>

                <Text style={styles.modalHint}>Toque fora para fechar sem adicionar</Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <QuickScheduleModal visible={quickScheduleVisible} onClose={() => setQuickScheduleVisible(false)} />
    </View>
  );
}