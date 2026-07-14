import React, {useCallback, useMemo, useState} from 'react';
import {View, Text} from 'react-native';
import PressableScale from './PressableScale';
import {useFocusEffect} from '@react-navigation/native';
import {useCalorie} from './context/CalorieContext';
import type {ConsumedFood} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import type {PlannedItem} from './data/plannedItemsStorage';
import {loadFoodCatalog, type Food} from './data/foodCatalogStorage';
import {loadUserFoods} from './data/userFoodsStorage';
import {loadUserRecipes} from './data/userRecipesStorage';
import type {Recipe} from './data/recipes';
import {resolveSourceBase, STATUS_LABELS, type BaseMacros} from './data/planningResolvers';
import {FoodIcon} from './FoodIcon';
import {MealPeriodIcon} from './MealPeriodIcons';
import {scaleMacros, FIXED_MEAL_PERIODS, MEAL_PERIODS, MEAL_PERIOD_LABELS, type MealPeriod} from './foodMath';
import {cancelPlannedNotification} from './notifications';
import {todayKey} from './dateUtils';
import DiaryCalendarModal from './DiaryCalendarModal';
import {ConfirmModal} from './ConfirmModal';
import {makeStyles} from './ScheduledAgendaSection.styles';

type ViewMode = 'period' | 'time';

type UnifiedItem =
  | {kind: 'planned'; item: PlannedItem}
  | {kind: 'direct'; food: ConsumedFood};

function unifiedDisplay(u: UnifiedItem, catalog: Food[], userFoods: Food[], userRecipes: Recipe[]) {
  if (u.kind === 'direct') {
    const f = u.food;
    return {
      id: f.id,
      time: '--:--',
      period: f.period,
      status: 'done' as const,
      base: {
        name: f.name,
        emoji: '🍽️',
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
      } as BaseMacros,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      isDirect: true,
    };
  }
  const {item} = u;
  const base = resolveSourceBase(item.source, catalog, userFoods, userRecipes);
  const scaled = base ? scaleMacros(base, item.quantityMultiplier) : null;
  return {
    id: item.id,
    time: item.time,
    period: item.period,
    status: item.status,
    base,
    calories: scaled?.calories ?? 0,
    protein: scaled?.protein ?? 0,
    carbs: scaled?.carbs ?? 0,
    fat: scaled?.fat ?? 0,
    isDirect: false,
  };
}

function AgendaRow({
  unified,
  catalog,
  userFoods,
  userRecipes,
  onDone,
  onDelete,
  onUndo,
  onRemoveDirect,
}: {
  unified: UnifiedItem;
  catalog: Food[];
  userFoods: Food[];
  userRecipes: Recipe[];
  onDone: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRemoveDirect: () => void;
}) {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [showMacros, setShowMacros] = useState(false);
  const display = unifiedDisplay(unified, catalog, userFoods, userRecipes);
  const isPending = display.status === 'pending';
  const statusLabel =
    display.isDirect
      ? 'Adicionado direto ✓'
      : isPending
      ? null
      : STATUS_LABELS[display.status as 'done' | 'done_modified' | 'skipped'];

  return (
    <PressableScale
      style={[styles.row, !isPending && styles.rowDone]}
      onPress={() => setOpen(o => !o)}
      onLongPress={() => setShowMacros(m => !m)}>
      <View style={styles.rowEmoji}>
        <FoodIcon token={display.base?.emoji ?? '❓'} size={15} color={colors.text} />
      </View>
      <View style={styles.rowTextBlock}>
        <Text style={[styles.rowName, !isPending && styles.rowNameDone]} numberOfLines={1}>
          {display.base?.name ?? 'Item removido'}
        </Text>
        {statusLabel && <Text style={styles.rowStatus}>{statusLabel}</Text>}
        {showMacros && (
          <View style={[styles.macroBadgeRow, styles.rowMacrosWrap]}>
            <View style={styles.macroBadge}>
              <View style={[styles.macroBadgeDot, {backgroundColor: colors.protein}]} />
              <Text style={[styles.macroBadgeValue, {color: colors.protein}]}>
                {Math.round(display.protein)}g
              </Text>
            </View>
            <View style={styles.macroBadge}>
              <View style={[styles.macroBadgeDot, {backgroundColor: colors.carbs}]} />
              <Text style={[styles.macroBadgeValue, {color: colors.carbs}]}>
                {Math.round(display.carbs)}g
              </Text>
            </View>
            <View style={styles.macroBadge}>
              <View style={[styles.macroBadgeDot, {backgroundColor: colors.fat}]} />
              <Text style={[styles.macroBadgeValue, {color: colors.fat}]}>
                {Math.round(display.fat)}g
              </Text>
            </View>
          </View>
        )}
      </View>
      <Text style={styles.rowKcal}>{display.calories} kcal</Text>

      {open && (
        <View style={styles.rowActions}>
          {display.isDirect ? (
            <PressableScale style={styles.rowActionDelete} onPress={onRemoveDirect}>
              <Text style={styles.rowActionDeleteText}>✕</Text>
            </PressableScale>
          ) : isPending ? (
            <>
              <PressableScale style={styles.rowActionDone} onPress={onDone}>
                <Text style={styles.rowActionDoneText}>✓ Feito</Text>
              </PressableScale>
              <PressableScale style={styles.rowActionDelete} onPress={onDelete}>
                <Text style={styles.rowActionDeleteText}>✕</Text>
              </PressableScale>
            </>
          ) : (
            <PressableScale style={styles.rowActionUndo} onPress={onUndo}>
              <Text style={styles.rowActionUndoText}>↺ Desfazer</Text>
            </PressableScale>
          )}
        </View>
      )}
    </PressableScale>
  );
}

export default function ScheduledAgendaSection({dateKey}: {dateKey: string}) {
  const {
    dailyGoal,
    plannedByDate,
    foodsByDate,
    resolvePlannedItem,
    unresolvePlannedItem,
    removePlannedItem,
    removeFoodFromDate,
    addPlannedItem,
    addImmediatePlannedItem,
  } = useCalorie();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [catalog, setCatalog] = useState<Food[]>([]);
  const [userFoods, setUserFoods] = useState<Food[]>([]);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('period');
  const [saveDayModalVisible, setSaveDayModalVisible] = useState(false);
  const [expanded, setExpanded] = useState<Set<MealPeriod>>(
    () => new Set(['manha', 'almoco', 'tarde', 'noite', 'avulso'] as MealPeriod[]),
  );
  const [periodMacrosOpen, setPeriodMacrosOpen] = useState<Set<MealPeriod>>(() => new Set());
  const [pendingDeletePeriod, setPendingDeletePeriod] = useState<{period: MealPeriod; items: UnifiedItem[]} | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      loadFoodCatalog().then(setCatalog);
      loadUserFoods().then(setUserFoods);
      loadUserRecipes().then(setUserRecipes);
    }, []),
  );

  // Memoizados pra manter identidade estável entre renders — os useMemo
  // abaixo dependem dessas listas.
  const plannedItems = useMemo(() => plannedByDate[dateKey] ?? [], [plannedByDate, dateKey]);
  const directFoods = useMemo(() => foodsByDate[dateKey] ?? [], [foodsByDate, dateKey]);

  const linkedFoodIds = useMemo(() => {
    const s = new Set<string>();
    plannedItems.forEach(p => {
      if (p.linkedFoodId) s.add(p.linkedFoodId);
    });
    return s;
  }, [plannedItems]);

  const unlinkedFoods = useMemo(
    () => directFoods.filter(f => !linkedFoodIds.has(f.id)),
    [directFoods, linkedFoodIds],
  );

  const byPeriod = useMemo(() => {
    const map = new Map<MealPeriod, UnifiedItem[]>();
    MEAL_PERIODS.forEach(p => map.set(p, []));

    plannedItems.forEach(item => {
      const period: MealPeriod = (MEAL_PERIODS.includes(item.period as MealPeriod) ? item.period : 'avulso') as MealPeriod;
      const list = map.get(period) ?? [];
      list.push({kind: 'planned', item});
      map.set(period, list);
    });

    unlinkedFoods.forEach(food => {
      const period: MealPeriod = (MEAL_PERIODS.includes(food.period as MealPeriod) ? food.period : 'avulso') as MealPeriod;
      const list = map.get(period) ?? [];
      list.push({kind: 'direct', food});
      map.set(period, list);
    });

    map.forEach(list =>
      list.sort((a, b) => {
        const ta = a.kind === 'planned' ? a.item.time : '99:99';
        const tb = b.kind === 'planned' ? b.item.time : '99:99';
        return ta.localeCompare(tb);
      }),
    );

    return map;
  }, [plannedItems, unlinkedFoods]);

  const togglePeriod = (period: MealPeriod | string) => {
    const p = period as MealPeriod;
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const togglePeriodMacros = (period: MealPeriod) => {
    setPeriodMacrosOpen(prev => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  };

  const handleDone = async (item: PlannedItem) => {
    await cancelPlannedNotification(item.notificationId);
    const base = resolveSourceBase(item.source, catalog, userFoods, userRecipes);
    if (!base) return;
    const scaled = scaleMacros(base, item.quantityMultiplier);
    resolvePlannedItem(item.dateKey, item.id, {
      status: 'done',
      food: {name: base.name, ...scaled},
      period: item.period,
    });
  };

  const handleDelete = async (item: PlannedItem) => {
    await cancelPlannedNotification(item.notificationId);
    removePlannedItem(item.dateKey, item.id);
  };

  const handleUndo = (item: PlannedItem) => {
    unresolvePlannedItem(item.dateKey, item.id);
  };

  const handleRemoveDirect = (food: ConsumedFood) => {
    removeFoodFromDate(dateKey, food.id);
  };

  // Remove de uma vez todos os itens de um período (o "x" no cabeçalho) --
  // mesma limpeza que apagar item a item, só que em lote: cancela a
  // notificação de cada planejado e remove tanto planejados quanto
  // alimentos avulsos daquele período. A confirmação (com o visual do
  // próprio app, não o Alert nativo) fica pendente em pendingDeletePeriod
  // até o usuário confirmar ou cancelar no ConfirmModal.
  const handleDeletePeriod = (period: MealPeriod, items: UnifiedItem[]) => {
    if (items.length === 0) return;
    setPendingDeletePeriod({period, items});
  };

  const confirmDeletePeriod = () => {
    if (!pendingDeletePeriod) return;
    pendingDeletePeriod.items.forEach(u => {
      if (u.kind === 'planned') handleDelete(u.item);
      else handleRemoveDirect(u.food);
    });
    setPendingDeletePeriod(null);
  };

  const handleSaveDayConfirm = (dates: string[]) => {
    const today = todayKey();
    dates.forEach(targetDate => {
      plannedItems.forEach(item => {
        // Copiar pra um dia que já passou não tem "pendente" que se resolva
        // sozinho depois (não vai tocar notificação nem o usuário vai abrir
        // aquele dia pra marcar "Feito") — ficaria pendente pra sempre e
        // nunca contaria no Diário/Progresso. Pra dias passados, registra
        // direto como feito; hoje/futuro continua pendente normalmente.
        if (targetDate < today) {
          const base = resolveSourceBase(item.source, catalog, userFoods, userRecipes);
          if (!base) return;
          const scaled = scaleMacros(base, item.quantityMultiplier);
          addImmediatePlannedItem(
            {
              dateKey: targetDate,
              time: item.time,
              period: item.period,
              quantityMultiplier: item.quantityMultiplier,
              source: item.source,
            },
            {name: base.name, ...scaled},
          );
          return;
        }
        addPlannedItem({
          dateKey: targetDate,
          time: item.time,
          period: item.period,
          quantityMultiplier: item.quantityMultiplier,
          source: item.source,
          notifyOffsetMinutes: item.notifyOffsetMinutes,
        });
      });
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Alimentação Programada</Text>
        <View style={styles.modeToggle}>
          <PressableScale
            style={[styles.modeButton, viewMode === 'period' && styles.modeButtonActive]}
            onPress={() => setViewMode('period')}>
            <Text style={[styles.modeButtonText, viewMode === 'period' && styles.modeButtonTextActive]}>
              Período
            </Text>
          </PressableScale>
          <PressableScale style={styles.modeButton} onPress={() => setSaveDayModalVisible(true)}>
            <Text style={styles.modeButtonText}>Salvar dia</Text>
          </PressableScale>
        </View>
      </View>

      {[...FIXED_MEAL_PERIODS, 'avulso' as const].map(period => {
        const p = period as MealPeriod;
        const periodItems = byPeriod.get(p) ?? [];
        const hasItems = periodItems.length > 0;
        // "Avulso" não é um horário de verdade (é só o balde de itens sem
        // período reconhecido) -- só faz sentido mostrar se tiver algo.
        // Manhã/Almoço/Tarde/Noite ficam sempre visíveis, vazios ou não,
        // e vão preenchendo sozinhos conforme o usuário adiciona.
        if (p === 'avulso' && !hasItems) return null;
        const isOpen = hasItems && expanded.has(p);
        const macrosOpen = hasItems && periodMacrosOpen.has(p);

        const totalKcal = periodItems.reduce((sum, u) => {
          if (u.kind === 'direct') return sum + u.food.calories;
          const base = resolveSourceBase(u.item.source, catalog, userFoods, userRecipes);
          if (!base) return sum;
          return sum + scaleMacros(base, u.item.quantityMultiplier).calories;
        }, 0);

        const timeGroups: {time: string; items: UnifiedItem[]}[] = [];
        if (viewMode === 'time') {
          periodItems.forEach(u => {
            const t = u.kind === 'planned' ? u.item.time : '--:--';
            const last = timeGroups[timeGroups.length - 1];
            if (last && last.time === t) last.items.push(u);
            else timeGroups.push({time: t, items: [u]});
          });
        }

        return (
          <View key={p} style={styles.periodBlock}>
            <PressableScale
              style={styles.periodHeader}
              onPress={() => hasItems && togglePeriod(p)}
              onLongPress={() => hasItems && togglePeriodMacros(p)}>
              <View style={styles.periodHeaderLeft}>
                {hasItems && (
                  <Text style={[styles.periodChevron, isOpen && styles.periodChevronOpen]}>›</Text>
                )}
                {p !== 'avulso' && (
                  <View style={styles.periodIconWrap}>
                    <MealPeriodIcon period={p} size={15} color={colors.textMuted} />
                  </View>
                )}
                <Text style={styles.periodLabel}>{MEAL_PERIOD_LABELS[period]}</Text>
                <Text style={styles.periodCount}>· {periodItems.length}</Text>
              </View>
              <View style={styles.periodHeaderRight}>
                <Text style={styles.periodKcal}>{Math.round(totalKcal)} kcal</Text>
                {hasItems && (
                  <PressableScale
                    style={styles.periodDeleteButton}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                    onPress={() => handleDeletePeriod(p, periodItems)}>
                    <Text style={styles.periodDeleteButtonText}>×</Text>
                  </PressableScale>
                )}
              </View>
            </PressableScale>

            {macrosOpen && (
              <View style={styles.periodMacrosList}>
                {periodItems.map(u => {
                  const d = unifiedDisplay(u, catalog, userFoods, userRecipes);
                  return (
                    <View key={u.kind === 'planned' ? u.item.id : u.food.id} style={styles.periodMacrosRow}>
                      <Text style={styles.periodMacrosName} numberOfLines={1}>
                        {d.base?.name ?? 'Item removido'}
                      </Text>
                      <View style={styles.macroBadgeRow}>
                        <View style={styles.macroBadge}>
                          <View style={[styles.macroBadgeDot, {backgroundColor: colors.protein}]} />
                          <Text style={[styles.macroBadgeValue, {color: colors.protein}]}>
                            {Math.round(d.protein)}g
                          </Text>
                        </View>
                        <View style={styles.macroBadge}>
                          <View style={[styles.macroBadgeDot, {backgroundColor: colors.carbs}]} />
                          <Text style={[styles.macroBadgeValue, {color: colors.carbs}]}>
                            {Math.round(d.carbs)}g
                          </Text>
                        </View>
                        <View style={styles.macroBadge}>
                          <View style={[styles.macroBadgeDot, {backgroundColor: colors.fat}]} />
                          <Text style={[styles.macroBadgeValue, {color: colors.fat}]}>
                            {Math.round(d.fat)}g
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {isOpen && (
              <View style={styles.periodBody}>
                {viewMode === 'period'
                  ? periodItems.map(u => (
                      <AgendaRow
                        key={u.kind === 'planned' ? u.item.id : u.food.id}
                        unified={u}
                        catalog={catalog}
                        userFoods={userFoods}
                        userRecipes={userRecipes}
                        onDone={() => u.kind === 'planned' && handleDone(u.item)}
                        onDelete={() => u.kind === 'planned' && handleDelete(u.item)}
                        onUndo={() => u.kind === 'planned' && handleUndo(u.item)}
                        onRemoveDirect={() => u.kind === 'direct' && handleRemoveDirect(u.food)}
                      />
                    ))
                  : timeGroups.map(group => (
                      <View key={group.time} style={styles.timeGroup}>
                        {group.items.map(u => (
                          <AgendaRow
                            key={u.kind === 'planned' ? u.item.id : u.food.id}
                            unified={u}
                            catalog={catalog}
                            userFoods={userFoods}
                            userRecipes={userRecipes}
                            onDone={() => u.kind === 'planned' && handleDone(u.item)}
                            onDelete={() => u.kind === 'planned' && handleDelete(u.item)}
                            onUndo={() => u.kind === 'planned' && handleUndo(u.item)}
                            onRemoveDirect={() => u.kind === 'direct' && handleRemoveDirect(u.food)}
                          />
                        ))}
                      </View>
                    ))}
              </View>
            )}
          </View>
        );
      })}

      <DiaryCalendarModal
        visible={saveDayModalVisible}
        onClose={() => setSaveDayModalVisible(false)}
        selectedDate={dateKey}
        onSelectDate={() => {}}
        dailyGoal={dailyGoal}
        foodsByDate={foodsByDate}
        plannedByDate={plannedByDate}
        catalog={catalog}
        userFoods={userFoods}
        userRecipes={userRecipes}
        mode="multi"
        excludeDate={dateKey}
        onConfirmMulti={handleSaveDayConfirm}
      />

      <ConfirmModal
        visible={!!pendingDeletePeriod}
        title={pendingDeletePeriod ? `Remover ${MEAL_PERIOD_LABELS[pendingDeletePeriod.period]}` : ''}
        message={
          pendingDeletePeriod
            ? `Remover ${
                pendingDeletePeriod.items.length === 1
                  ? 'o item'
                  : `os ${pendingDeletePeriod.items.length} itens`
              } desse período?`
            : ''
        }
        onConfirm={confirmDeletePeriod}
        onCancel={() => setPendingDeletePeriod(null)}
      />
    </View>
  );
}