/**
 * OrganizationScreen — Montagem de refeição planejada
 *
 * Fluxo:
 *   1. Card de resumo/lista da refeição fica sticky no topo. Começa
 *      recolhido (peek — só o último item), e só abre pra lista completa
 *      quando o usuário toca nele; não reage à posição de scroll do
 *      catálogo, só a toque.
 *   2. Seletor de período (Manhã / Almoço / Tarde / Noite) rola junto
 *      com o catálogo, logo acima das abas Alimentos/Receitas, como um
 *      carrossel (toque nas laterais ou arraste pro lado pra trocar).
 *   3. Navega livremente entre as abas Alimentos e Receitas sem perder o contexto.
 *   4. Cada "+" adiciona ao rascunho da refeição (estado local — nada salvo ainda).
 *   5. Card de resumo mostra totais e lista de itens em tempo real.
 *   6. "Salvar refeição" chama addImmediatePlannedItem para cada item e fecha.
 *
 * Alterações nos filhos (FoodActionsSection / RecipesSection):
 *   - Nova prop opcional `onAddFood(food, quantity)` — quando presente, o "+" do
 *     card chama esse callback em vez de persistir direto.
 *   - Nova prop opcional `onAddRecipe(recipe, totals)` — idem para receitas.
 *   - Nova prop opcional `externalPeriod` — oculta o seletor interno de período.
 *   Ver seções de props nos respectivos arquivos.
 */
import React, {useState, useCallback, useMemo, useRef, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Modal,
  type LayoutChangeEvent,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useCalorie} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import Reanimated, {FadeIn} from 'react-native-reanimated';
import FoodActionsSection from './FoodActionsSection';
import MealPeriodSelector from './MealPeriodSelector';
import {MealPeriodIcon} from './MealPeriodIcons';
import PressableScale from './PressableScale';
import RecipesSection, {type RecipesSectionHandle} from './RecipesSection';
import {FoodIcon} from './FoodIcon';
import {scaleMacros, dominantMacro, QUANTITY_STEPS} from './foodMath';
import {
  PLANNING_PERIOD_OPTIONS,
  type PlanningPeriod,
} from './data/planningResolvers';
import type {Food} from './data/foodCatalogStorage';
import type {Recipe} from './data/recipes';
import {spacing, radius, shadows, getTintByMacro, type ThemeColors} from './theme';
import {makeStyles} from './OrganizationScreen.styles';

// ---------------------------------------------------------------------------
// Tipos internos do rascunho
// ---------------------------------------------------------------------------

type DraftFood = {
  kind: 'food';
  id: string;
  food: Food;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type RecipeTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type DraftRecipe = {
  kind: 'recipe';
  id: string;
  recipe: Recipe;
  isUserRecipe: boolean;
  totals: RecipeTotals;
  // Multiplicador de cada ingrediente no momento em que foi adicionado (ex:
  // 2x banana) — precisa viajar até o Diário no source do PlannedItem, senão
  // o ajuste de porção se perde ao resolver o item (ver planningResolvers.ts).
  ingredientQuantities: number[];
};

type DraftItem = DraftFood | DraftRecipe;

// ---------------------------------------------------------------------------
// Abas do catálogo
// ---------------------------------------------------------------------------

type CatalogTab = 'foods' | 'recipes';

const CATALOG_TABS: {key: CatalogTab; label: string}[] = [
  {key: 'foods', label: 'Alimentos'},
  {key: 'recipes', label: 'Receitas'},
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function itemMacros(item: DraftItem): RecipeTotals {
  if (item.kind === 'food') {
    return {calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat};
  }
  return item.totals;
}

function draftTotals(items: DraftItem[]) {
  return items.reduce(
    (acc, item) => {
      const m = itemMacros(item);
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    {calories: 0, protein: 0, carbs: 0, fat: 0},
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function itemLabel(item: DraftItem): string {
  if (item.kind === 'food') return item.food.name;
  return item.recipe.name;
}

function itemEmoji(item: DraftItem): string {
  if (item.kind === 'food') return item.food.emoji;
  return item.recipe.emoji;
}

// ---------------------------------------------------------------------------
// Comportamento do resumo sticky
// ---------------------------------------------------------------------------

// Quantos itens ficam visíveis na lista expandida antes de precisar rolar
// internamente (a "barra dentro").
const EXPANDED_VISIBLE_ITEMS = 4;

// Altura padrão de uma linha de item, usada até a primeira medição real
// via onLayout (evita "pulo" no primeiro render).
const DEFAULT_ITEM_ROW_HEIGHT = 56;

// Estilos puramente de layout — a tipografia/cor do texto reaproveita os
// estilos já existentes em OrganizationScreen.styles.ts (summaryItemName,
// summaryItemKcal, summaryItemEmoji, summaryBadge...), então não precisamos
// inventar novos tokens de cor aqui.
const makeLocalStyles = (colors: ThemeColors) => StyleSheet.create({
  periodHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  createRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.chip,
    backgroundColor: colors.primary,
    ...shadows.buttonPrimary,
  },
  createRecipeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  peekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  summaryPeriodIconWrap: {
    width: 32,
    alignItems: 'center',
  },
  peekTextWrap: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  peekBadgeUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 36,
  },
  peekBadgeSign: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  peekMainTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Notificação in-app (toast) — substitui o Alert.alert nativo ao salvar
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.select({ios: 54, android: 28}),
    paddingHorizontal: spacing.md,
    zIndex: 999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    gap: 10,
    ...shadows.card,
  },
  toastIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIconText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  toastTextWrap: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  toastMessage: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 1,
  },
  expandedItemsScroll: {
    // maxHeight é aplicado dinamicamente por cima deste estilo, com base em
    // itemRowHeight * EXPANDED_VISIBLE_ITEMS (ver render)
  },
  // Layout/gesto do seletor de período agora vivem em MealPeriodSelector.

  // Modal "Ver lista"
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.card * 2,
    borderTopRightRadius: radius.card * 2,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalList: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  // Cartão branco por item (em vez de linha só com borda inferior sobre o
  // fundo do sheet) — a folha inteira era um bloco só na mesma cor bege,
  // então nada se destacava. Mesmo padrão de card branco + sombra sutil
  // usado em recipeCard/pendingCard/foodCardListItem no resto do app.
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: 10,
    ...shadows.card,
  },
  modalItemEmojiBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  // Linha de macros: kcal em destaque + um badge por macro (bolinha colorida
  // + valor na mesma cor), em vez de um texto corrido só numa cor — mais
  // fácil de escanear e usa a mesma paleta protein/carbs/fat do resto do app.
  modalItemMacroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
  },
  modalItemKcalValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  modalItemMacroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalItemMacroDot: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  modalItemMacroValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Stepper de quantidade (só para itens de alimento — receitas continuam
  // com o × de remover, já que não têm um multiplicador nesse rascunho).
  modalItemQtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalItemQtyButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemQtyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  modalRemoveBtn: {
    padding: 4,
  },
  modalRemoveText: {
    fontSize: 22,
    color: colors.textFaint2,
    lineHeight: 24,
  },
  modalDoneButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.buttonPrimary,
  },
  modalDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function OrganizationScreen() {
  const {addPlannedItem, selectedDate} = useCalorie();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const localStyles = useMemo(() => makeLocalStyles(colors), [colors]);
  const tintByMacro = useMemo(() => getTintByMacro(colors), [colors]);
  // Cor do ícone do item, em cima do fundo tingido do mesmo macro -- usa a
  // cor sólida (não a versão pálida) pra ter contraste.
  const iconColorByMacro = useMemo(
    () => ({protein: colors.protein, carbs: colors.carbs, fat: colors.fat}),
    [colors],
  );

  // Período da refeição sendo montada
  const [activePeriod, setActivePeriod] = useState<PlanningPeriod>('manha');

  // Rascunho — itens adicionados mas ainda não salvos
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  // Aba ativa do catálogo
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('foods');
  const recipesSectionRef = useRef<RecipesSectionHandle>(null);

  // Modal "Ver lista" — exibe todos os itens do rascunho
  const [listModalVisible, setListModalVisible] = useState(false);

  // Id do último item adicionado ou atualizado — para sinalizar no peek
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);

  // Card de resumo colapsado (mostra só o último item, "peek") ou expandido
  // (lista completa) — controlado só por toque, em qualquer posição de
  // scroll do catálogo.
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Altura real de uma linha de item do resumo, medida no primeiro item
  // renderizado — usada pra limitar a lista expandida a 4 itens visíveis
  const [itemRowHeight, setItemRowHeight] = useState(DEFAULT_ITEM_ROW_HEIGHT);

  const handleFirstItemLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setItemRowHeight(h);
  }, []);

  const handleExpandSummary = useCallback(() => {
    setSummaryExpanded(true);
  }, []);

  // ------------------------------------------------------------------
  // Notificação in-app (toast) — substitui o Alert.alert nativo ao
  // salvar a refeição. Aparece deslizando do topo e some sozinha.
  // ------------------------------------------------------------------
  const [toast, setToast] = useState<{title: string; message: string} | null>(
    null,
  );
  const toastAnim = useRef(new Animated.Value(-150)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ------------------------------------------------------------------
  // Animação do footer — desliza do baixo sem mexer no layout.
  // A distância do slide é a altura real do footer (medida via onLayout),
  // não um valor cravado: um valor fixo menor que a altura real deixava um
  // resto do footer visível por baixo, "vazando" por cima da tab bar.
  // ------------------------------------------------------------------
  const footerHeightRef = useRef(Platform.select({ios: 100, android: 90}) ?? 90);
  const footerAnim = useRef(new Animated.Value(footerHeightRef.current)).current;
  const footerVisible = useRef(false);

  const handleFooterLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const measured = e.nativeEvent.layout.height;
      if (measured > 0 && measured !== footerHeightRef.current) {
        footerHeightRef.current = measured;
        if (!footerVisible.current) {
          footerAnim.setValue(measured);
        }
      }
    },
    [footerAnim],
  );

  useEffect(() => {
    const shouldShow = draftItems.length > 0;
    if (shouldShow === footerVisible.current) return;
    footerVisible.current = shouldShow;
    Animated.timing(footerAnim, {
      toValue: shouldShow ? 0 : footerHeightRef.current,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [draftItems.length, footerAnim]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = useCallback(
    (title: string, message: string) => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToast({title, message});
      toastAnim.setValue(-150);
      Animated.spring(toastAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 60,
      }).start();
      toastTimeoutRef.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: -150,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 2600);
    },
    [toastAnim],
  );

  // ------------------------------------------------------------------
  // Adicionar ao rascunho
  // ------------------------------------------------------------------

  const handleAddFood = useCallback((food: Food, quantity: number) => {
    const scaled = scaleMacros(food, quantity);
    const newItem: DraftFood = {
      kind: 'food',
      id: uid(),
      food,
      quantity,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
    };
    // Substitui item do mesmo alimento se já existir; senão adiciona ao final
    setDraftItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.kind === 'food' && i.food.name === food.name,
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = newItem;
        return next;
      }
      return [...prev, newItem];
    });
    setLastUpdatedId(newItem.id);
    setSummaryExpanded(false);
  }, []);

  const handleAddRecipe = useCallback(
    (recipe: Recipe, totals: RecipeTotals, isUserRecipe: boolean, ingredientQuantities: number[]) => {
      const newItem: DraftRecipe = {
        kind: 'recipe',
        id: uid(),
        recipe,
        isUserRecipe,
        totals,
        ingredientQuantities,
      };
      // Substitui receita de mesmo id se já existir; senão adiciona ao final
      setDraftItems(prev => {
        const existingIndex = prev.findIndex(
          i => i.kind === 'recipe' && i.recipe.id === recipe.id,
        );
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = newItem;
          return next;
        }
        return [...prev, newItem];
      });
      setLastUpdatedId(newItem.id);
      setSummaryExpanded(false);
    },
    [],
  );

  // Mantém sincronizado com o stepper de ingredientes do card de receita
  // expandido (RecipesSection): sem isso, ajustar a porção depois de já ter
  // tocado "+" deixava o item no rascunho com o total congelado do momento
  // do primeiro toque. Só atualiza se a receita já estiver no rascunho —
  // handleAddRecipe é quem trata o "+" propriamente dito.
  const handleIngredientQuantityChange = useCallback(
    (recipeId: string, ingredientQuantities: number[], totals: RecipeTotals) => {
      setDraftItems(prev =>
        prev.map(item =>
          item.kind === 'recipe' && item.recipe.id === recipeId
            ? {...item, ingredientQuantities, totals}
            : item,
        ),
      );
    },
    [],
  );

  const handleRemoveItem = (id: string) => {
    setDraftItems(prev => {
      const next = prev.filter(i => i.id !== id);
      if (next.length === 0) {
        setSummaryExpanded(false);
        setListModalVisible(false);
      }
      return next;
    });
  };

  // Ajusta a quantidade de um item de alimento no rascunho, seguindo os
  // mesmos degraus (QUANTITY_STEPS) usados no modal de quantidade do
  // catálogo. Diminuir a partir de 1x remove o item em vez de ir pra 0.5x —
  // 1x é tratado como o "piso" nessa lista, então "menos que 1" vira remover.
  const handleChangeFoodQuantity = (id: string, direction: 1 | -1) => {
    const item = draftItems.find(i => i.id === id);
    if (!item || item.kind !== 'food') return;

    if (direction === -1 && item.quantity <= 1) {
      handleRemoveItem(id);
      return;
    }

    const currentIndex = QUANTITY_STEPS.indexOf(item.quantity);
    const baseIndex = currentIndex >= 0 ? currentIndex : QUANTITY_STEPS.findIndex(s => s >= item.quantity);
    const nextIndex = Math.min(Math.max(baseIndex + direction, 0), QUANTITY_STEPS.length - 1);
    const nextQuantity = QUANTITY_STEPS[nextIndex];
    const scaled = scaleMacros(item.food, nextQuantity);

    setDraftItems(prev =>
      prev.map(i =>
        i.id === id && i.kind === 'food'
          ? {...i, quantity: nextQuantity, calories: scaled.calories, protein: scaled.protein, carbs: scaled.carbs, fat: scaled.fat}
          : i,
      ),
    );
    setLastUpdatedId(id);
  };

  // ------------------------------------------------------------------
  // Salvar refeição
  // ------------------------------------------------------------------

  const handleSave = () => {
    if (draftItems.length === 0) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    draftItems.forEach(item => {
      const source =
        item.kind === 'food'
          ? {kind: 'foodCatalog' as const, foodName: item.food.name}
          : item.isUserRecipe
          ? {
              kind: 'recipeCustom' as const,
              recipeId: item.recipe.id,
              ingredientQuantities: item.ingredientQuantities,
            }
          : {
              kind: 'recipeFixed' as const,
              recipeId: item.recipe.id,
              ingredientQuantities: item.ingredientQuantities,
            };

      addPlannedItem({
        dateKey: selectedDate,
        time,
        period: activePeriod,
        quantityMultiplier: item.kind === 'food' ? item.quantity : 1,
        source,
        notifyOffsetMinutes: 0,
      });
    });

    const periodoLabel =
      PLANNING_PERIOD_OPTIONS.find(p => p.key === activePeriod)?.label ?? activePeriod;

    showToast(
      'Refeição salva',
      `${draftItems.length} ${draftItems.length === 1 ? 'item adicionado' : 'itens adicionados'} ao período "${periodoLabel}".`,
    );

    setDraftItems([]);
    setSummaryExpanded(false);
  };

  // ------------------------------------------------------------------
  // Ao trocar de período, manter o rascunho (usuário pode querer
  // montar um Almoço que inclui algo do café — decisão do fluxo).
  // Se o rascunho já tiver itens, avisar antes de trocar.
  // ------------------------------------------------------------------

  const handlePeriodChange = (period: PlanningPeriod) => {
    if (period === activePeriod) return;
    if (draftItems.length > 0) {
      Alert.alert(
        'Trocar período',
        'Você tem itens no rascunho. Deseja continuar e manter os itens ou limpar o rascunho?',
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Manter itens',
            onPress: () => setActivePeriod(period),
          },
          {
            text: 'Limpar',
            style: 'destructive',
            onPress: () => {
              setDraftItems([]);
              setSummaryExpanded(false);
              setActivePeriod(period);
            },
          },
        ],
      );
    } else {
      setActivePeriod(period);
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  const totals = draftTotals(draftItems);
  const hasDraft = draftItems.length > 0;
  const periodoLabel =
    PLANNING_PERIOD_OPTIONS.find(p => p.key === activePeriod)?.label ?? activePeriod;

  // Item exibido no peek — o último atualizado/adicionado, ou o último da lista
  const peekItem =
    (lastUpdatedId && draftItems.find(i => i.id === lastUpdatedId)) ||
    draftItems[draftItems.length - 1];
  // Sinaliza se o peek está mostrando um item que foi atualizado (não o último da lista)
  const peekIsUpdated =
    !!lastUpdatedId && peekItem && peekItem !== draftItems[draftItems.length - 1];

  // Seletor de período: o gesto de arrastar e a expansão do período ativo
  // agora vivem dentro de MealPeriodSelector.

  return (
    <View style={styles.container}>
      {/* ----------------------------------------------------------------
          Notificação in-app (toast) — substitui o Alert.alert nativo.
          Fica por cima de tudo, desliza do topo e some sozinha.
      ---------------------------------------------------------------- */}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            localStyles.toastWrapper,
            {transform: [{translateY: toastAnim}]},
          ]}>
          <View style={localStyles.toastCard}>
            <View style={localStyles.toastIconWrap}>
              <Text style={localStyles.toastIconText}>✓</Text>
            </View>
            <View style={localStyles.toastTextWrap}>
              <Text style={localStyles.toastTitle}>{toast.title}</Text>
              <Text style={localStyles.toastMessage}>{toast.message}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ----------------------------------------------------------------
          Cabeçalho sticky — resumo/lista da refeição (fixo no topo).
          Começa recolhido (peek); abre/fecha só por toque, não reage a
          scroll.
      ---------------------------------------------------------------- */}
      <View style={[styles.stickyHeader, {paddingTop: spacing.md + insets.top}]}>
        <View style={[styles.summaryCard, !hasDraft && styles.summaryCardEmpty]}>
          {!summaryExpanded && hasDraft ? (
            /* ------------------------------------------------------------
                Modo peek — resumo recolhido, mostra só o último item
                adicionado. Tocar abre a lista completa ali mesmo.
            ------------------------------------------------------------ */
            <View style={localStyles.peekRow}>
              <PressableScale
                style={localStyles.peekMainTouchable}
                onPress={handleExpandSummary}>
                <View style={styles.summaryItemEmoji}>
                  <FoodIcon token={itemEmoji(peekItem)} size={22} color={colors.text} />
                </View>
                <View style={[styles.summaryItemInfo, localStyles.peekTextWrap]}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {itemLabel(peekItem)}
                  </Text>
                  <Text style={styles.summaryItemKcal}>
                    {itemMacros(peekItem).calories} kcal
                  </Text>
                </View>
              </PressableScale>

              <View style={[styles.summaryBadge, peekIsUpdated && localStyles.peekBadgeUpdated]}>
                {peekIsUpdated && (
                  <Text style={localStyles.peekBadgeSign}>↻ </Text>
                )}
                <Text style={styles.summaryBadgeText}>{draftItems.length}</Text>
              </View>
            </View>
          ) : !hasDraft ? (
            /* ------------------------------------------------------------
                Estado vazio — mesma altura do peek para o card não "pular"
                quando o primeiro item é adicionado.
            ------------------------------------------------------------ */
            <View style={localStyles.peekRow}>
              <View style={localStyles.summaryPeriodIconWrap}>
                <MealPeriodIcon period={activePeriod} size={22} color={colors.text} />
              </View>
              <View style={[styles.summaryItemInfo, localStyles.peekTextWrap]}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {periodoLabel}
                </Text>
                <Text style={styles.summaryItemKcal}>
                  Adicione alimentos ou receitas abaixo
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Linha de totais — visível quando expandido */}
              <Pressable
                style={styles.summaryHeader}
                onPress={() => hasDraft && setSummaryExpanded(v => !v)}>
                <View style={styles.summaryTitleRow}>
                  <MealPeriodIcon period={activePeriod} size={19} color={colors.text} />
                  <Text style={styles.summaryTitle}>{periodoLabel}</Text>
                  {hasDraft && (
                    <View style={styles.summaryBadge}>
                      <Text style={styles.summaryBadgeText}>{draftItems.length}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.summaryMacroRow}>
                  <Text style={styles.summaryKcal}>{totals.calories} kcal</Text>
                  <Text style={[styles.summaryMacro, {color: colors.protein}]}>
                    P {totals.protein.toFixed(0)}g
                  </Text>
                  <Text style={[styles.summaryMacro, {color: colors.carbs}]}>
                    C {totals.carbs.toFixed(0)}g
                  </Text>
                  <Text style={[styles.summaryMacro, {color: colors.fat}]}>
                    G {totals.fat.toFixed(0)}g
                  </Text>
                  <Text style={styles.summaryChevron}>
                    {summaryExpanded ? '▲' : '▼'}
                  </Text>
                </View>
              </Pressable>

              {/* Lista de itens — visível quando expandido, limitada a
                  EXPANDED_VISIBLE_ITEMS com scroll interno pro resto */}
              {summaryExpanded && hasDraft && (
                <View style={styles.summaryItems}>
                  <View style={styles.summaryDivider} />
                  <ScrollView
                    style={[
                      localStyles.expandedItemsScroll,
                      draftItems.length > EXPANDED_VISIBLE_ITEMS && {
                        maxHeight: itemRowHeight * EXPANDED_VISIBLE_ITEMS,
                      },
                    ]}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={draftItems.length > EXPANDED_VISIBLE_ITEMS}>
                    {draftItems.map((item, index) => (
                      <View
                        key={item.id}
                        style={styles.summaryItemRow}
                        onLayout={index === 0 ? handleFirstItemLayout : undefined}>
                        <View style={styles.summaryItemEmoji}>
                          <FoodIcon token={itemEmoji(item)} size={22} color={colors.text} />
                        </View>
                        <View style={styles.summaryItemInfo}>
                          <Text style={styles.summaryItemName} numberOfLines={1}>
                            {itemLabel(item)}
                            {item.kind === 'food' && item.quantity !== 1
                              ? ` ×${item.quantity}`
                              : ''}
                          </Text>
                          <Text style={styles.summaryItemKcal}>
                            {itemMacros(item).calories} kcal
                          </Text>
                        </View>
                        <PressableScale
                          style={styles.summaryRemoveButton}
                          onPress={() => handleRemoveItem(item.id)}
                          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                          <Text style={styles.summaryRemoveText}>×</Text>
                        </PressableScale>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* --------------------------------------------------------------
            Seletor de período da refeição — agora rola junto com o
            catálogo, em vez de ficar fixo no topo.
        -------------------------------------------------------------- */}
        <View style={{paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md}}>
          <View style={localStyles.periodHeaderRow}>
            <Text style={styles.headerLabel}>Período da refeição</Text>
          </View>
          <MealPeriodSelector
            options={PLANNING_PERIOD_OPTIONS}
            activeKey={activePeriod}
            onChange={key => handlePeriodChange(key as PlanningPeriod)}
          />
        </View>

        {/* --------------------------------------------------------------
            Abas do catálogo
        -------------------------------------------------------------- */}
        <View style={styles.catalogTabRow}>
          {CATALOG_TABS.map(tab => (
            <PressableScale
              key={tab.key}
              style={[
                styles.catalogTab,
                catalogTab === tab.key && styles.catalogTabActive,
              ]}
              onPress={() => setCatalogTab(tab.key)}>
              <Text
                style={[
                  styles.catalogTabText,
                  catalogTab === tab.key && styles.catalogTabTextActive,
                ]}>
                {tab.label}
              </Text>
            </PressableScale>
          ))}
        </View>

        {/* --------------------------------------------------------------
            Conteúdo do catálogo — aba Alimentos
        -------------------------------------------------------------- */}
        {catalogTab === 'foods' && (
          <Reanimated.View entering={FadeIn.duration(200)} style={{paddingHorizontal: spacing.md}}>
            <FoodActionsSection
              externalPeriod={activePeriod}
              onAddFood={handleAddFood}
            />
          </Reanimated.View>
        )}

        {/* --------------------------------------------------------------
            Conteúdo do catálogo — aba Receitas
        -------------------------------------------------------------- */}
        {catalogTab === 'recipes' && (
          <Reanimated.View entering={FadeIn.duration(200)} style={{paddingHorizontal: spacing.md}}>
            <RecipesSection
              ref={recipesSectionRef}
              externalPeriod={activePeriod}
              onAddRecipe={handleAddRecipe}
              onIngredientQuantityChange={handleIngredientQuantityChange}
            />
          </Reanimated.View>
        )}

        {/* Espaçamento extra para o botão fixo não cobrir o último item */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ----------------------------------------------------------------
          Botão de salvar — fixo no rodapé, desliza do baixo sem mover
          o layout quando o primeiro alimento é adicionado.
      ---------------------------------------------------------------- */}
      <Animated.View
        onLayout={handleFooterLayout}
        style={[styles.footer, {transform: [{translateY: footerAnim}]}]}
        pointerEvents={hasDraft ? 'auto' : 'none'}>
        <PressableScale
          style={styles.clearButton}
          onPress={() => setListModalVisible(true)}>
          <Text style={styles.clearButtonText}>
            Ver lista {draftItems.length > 0 ? `(${draftItems.length})` : ''}
          </Text>
        </PressableScale>
        <PressableScale style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText} numberOfLines={1}>
            Salvar refeição
          </Text>
          <Text style={styles.saveButtonKcal} numberOfLines={1}>
            {totals.calories} kcal
          </Text>
        </PressableScale>
        {/* Desfaz (remove) o último item adicionado — ao lado do botão de
            salvar em vez do cabeçalho, mais fácil de alcançar com o polegar. */}
        <PressableScale
          style={styles.footerUndoButton}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          onPress={() => peekItem && handleRemoveItem(peekItem.id)}>
          <Text style={styles.footerUndoIcon}>↩</Text>
        </PressableScale>
      </Animated.View>

      {/* ----------------------------------------------------------------
          Modal "Ver lista" — usa Modal nativo para sobrepor o tab bar
      ---------------------------------------------------------------- */}
      <Modal
        visible={listModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setListModalVisible(false)}
        statusBarTranslucent>
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalSheet}>
            <Text style={localStyles.modalTitle}>Itens da refeição</Text>
            <Text style={localStyles.modalSubtitle}>
              {draftItems.length} {draftItems.length === 1 ? 'item' : 'itens'} · {totals.calories} kcal
            </Text>

            <ScrollView
              style={localStyles.modalList}
              showsVerticalScrollIndicator={false}>
              {draftItems.map(item => {
                const macros = itemMacros(item);
                const macro = dominantMacro(macros);
                return (
                  <View key={item.id} style={localStyles.modalItemRow}>
                    <View style={[localStyles.modalItemEmojiBadge, {backgroundColor: tintByMacro[macro]}]}>
                      <FoodIcon token={itemEmoji(item)} size={20} color={iconColorByMacro[macro]} />
                    </View>
                    <View style={localStyles.modalItemInfo}>
                      <Text style={localStyles.modalItemName} numberOfLines={1}>
                        {itemLabel(item)}
                        {item.kind === 'food' && item.quantity !== 1
                          ? ` ×${item.quantity}`
                          : ''}
                      </Text>
                      <View style={localStyles.modalItemMacroRow}>
                        <Text style={localStyles.modalItemKcalValue}>{macros.calories} kcal</Text>
                        <View style={localStyles.modalItemMacroChip}>
                          <View style={[localStyles.modalItemMacroDot, {backgroundColor: colors.protein}]} />
                          <Text style={[localStyles.modalItemMacroValue, {color: colors.protein}]}>
                            {macros.protein.toFixed(0)}g
                          </Text>
                        </View>
                        <View style={localStyles.modalItemMacroChip}>
                          <View style={[localStyles.modalItemMacroDot, {backgroundColor: colors.carbs}]} />
                          <Text style={[localStyles.modalItemMacroValue, {color: colors.carbs}]}>
                            {macros.carbs.toFixed(0)}g
                          </Text>
                        </View>
                        <View style={localStyles.modalItemMacroChip}>
                          <View style={[localStyles.modalItemMacroDot, {backgroundColor: colors.fat}]} />
                          <Text style={[localStyles.modalItemMacroValue, {color: colors.fat}]}>
                            {macros.fat.toFixed(0)}g
                          </Text>
                        </View>
                      </View>
                    </View>
                    {item.kind === 'food' ? (
                      <View style={localStyles.modalItemQtyStepper}>
                        <PressableScale
                          style={localStyles.modalItemQtyButton}
                          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                          onPress={() => handleChangeFoodQuantity(item.id, -1)}>
                          <Text style={localStyles.modalItemQtyButtonText}>−</Text>
                        </PressableScale>
                        <PressableScale
                          style={localStyles.modalItemQtyButton}
                          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                          onPress={() => handleChangeFoodQuantity(item.id, 1)}>
                          <Text style={localStyles.modalItemQtyButtonText}>+</Text>
                        </PressableScale>
                      </View>
                    ) : (
                      <PressableScale
                        style={localStyles.modalRemoveBtn}
                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                        onPress={() => handleRemoveItem(item.id)}>
                        <Text style={localStyles.modalRemoveText}>×</Text>
                      </PressableScale>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <PressableScale
              style={localStyles.modalDoneButton}
              onPress={() => setListModalVisible(false)}>
              <Text style={localStyles.modalDoneText}>Concluído</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>
    </View>
  );
}