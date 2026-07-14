import React, {useEffect, useMemo, useState} from 'react';
import {View, Text, Modal, Pressable} from 'react-native';
import PressableScale from './PressableScale';
import DayRing from './DayRing';
import {useTheme} from './context/ThemeContext';
import {dateKey, todayKey, parseDateKey, WEEKDAYS_SHORT, MONTHS} from './dateUtils';
import {getMonthGridDays, resolveSourceBase} from './data/planningResolvers';
import {scaleMacros} from './foodMath';
import type {FoodsByDate, PlannedByDate} from './context/CalorieContext';
import type {Food} from './data/foodCatalogStorage';
import type {Recipe} from './data/recipes';
import {makeStyles} from './DiaryCalendarModal.styles';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (dateKeyStr: string) => void;
  dailyGoal: number | null;
  foodsByDate: FoodsByDate;
  plannedByDate: PlannedByDate;
  catalog: Food[];
  userFoods: Food[];
  userRecipes: Recipe[];
  // Modo 'multi': em vez de selecionar e fechar, permite marcar vários dias
  // e confirmar com um botão — usado pelo "Salvar dia" da Alimentação
  // Programada, pra replicar a programação do dia atual em outros dias.
  mode?: 'single' | 'multi';
  onConfirmMulti?: (dates: string[]) => void;
  excludeDate?: string;
  // Só faz sentido em mode 'single': liga um botão de "desprogramar" que
  // ativa seleção múltipla de dias pra apagar a programação deles de uma vez.
  onClearDates?: (dates: string[]) => void;
};

// Popup de seleção rápida de data pro Diário — substitui a antiga navegação
// para uma tela de Calendário separada. Ao tocar num dia, seleciona e fecha
// automaticamente, atualizando o Diário. Em modo 'multi', tocar marca/
// desmarca o dia até o usuário confirmar.
export default function DiaryCalendarModal({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  dailyGoal,
  foodsByDate,
  plannedByDate,
  catalog,
  userFoods,
  userRecipes,
  mode = 'single',
  onConfirmMulti,
  excludeDate,
  onClearDates,
}: Props) {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => parseDateKey(selectedDate));
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());
  const [clearModeActive, setClearModeActive] = useState(false);
  const [clearSelected, setClearSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setMultiSelected(new Set());
      setClearModeActive(false);
      setClearSelected(new Set());
    }
  }, [visible]);

  const monthGridDays = useMemo(() => getMonthGridDays(calendarMonth), [calendarMonth]);

  const goToMonth = (delta: number) => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  // Ratio de "quanto do dia está contabilizado" (comido + agendado pendente,
  // em relação à meta) — só recalcula pros dias visíveis no mês atual.
  const dayRatios = useMemo(() => {
    const map = new Map<string, number>();
    if (!dailyGoal) return map;
    monthGridDays.forEach(day => {
      if (!day) return;
      const key = dateKey(day);
      const consumed = (foodsByDate[key] ?? []).reduce((sum, f) => sum + f.calories, 0);
      const plannedPending = (plannedByDate[key] ?? [])
        .filter(item => item.status === 'pending')
        .reduce((sum, item) => {
          const base = resolveSourceBase(item.source, catalog, userFoods, userRecipes);
          if (!base) return sum;
          return sum + scaleMacros(base, item.quantityMultiplier).calories;
        }, 0);
      map.set(key, Math.min(1, (consumed + plannedPending) / dailyGoal));
    });
    return map;
  }, [monthGridDays, foodsByDate, plannedByDate, dailyGoal, catalog, userFoods, userRecipes]);

  const monthLabel = `${MONTHS[calendarMonth.getMonth()][0].toUpperCase()}${MONTHS[calendarMonth.getMonth()].slice(1)} de ${calendarMonth.getFullYear()}`;

  const handlePick = (key: string) => {
    if (clearModeActive) {
      setClearSelected(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }
    if (mode === 'multi') {
      if (key === excludeDate) return;
      setMultiSelected(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }
    onSelectDate(key);
    onClose();
  };

  const handleConfirmClear = () => {
    if (clearSelected.size === 0) {
      setClearModeActive(false);
      return;
    }
    onClearDates?.(Array.from(clearSelected));
    setClearModeActive(false);
    setClearSelected(new Set());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <View style={styles.calendarHeader}>
            <PressableScale style={styles.calendarNavButton} onPress={() => goToMonth(-1)}>
              <Text style={styles.calendarNavButtonText}>‹</Text>
            </PressableScale>
            <Text style={styles.calendarMonthLabel}>{monthLabel}</Text>
            <PressableScale style={styles.calendarNavButton} onPress={() => goToMonth(1)}>
              <Text style={styles.calendarNavButtonText}>›</Text>
            </PressableScale>
          </View>

          <View style={styles.calendarWeekdayRow}>
            {WEEKDAYS_SHORT.map(w => (
              <Text key={w} style={styles.calendarWeekdayCell}>
                {w[0]}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {monthGridDays.map((day, index) => {
              if (!day) return <View key={`blank-${index}`} style={styles.calendarDayCell} />;
              const key = dateKey(day);
              const isToday = key === todayKey();
              const isMultiPicked = mode === 'multi' && multiSelected.has(key);
              const isSelected = clearModeActive
                ? clearSelected.has(key)
                : mode === 'multi'
                ? isMultiPicked
                : key === selectedDate;
              const ratio = dayRatios.get(key) ?? 0;
              const ringColor = isSelected ? colors.primary : ratio >= 1 ? colors.fat : colors.primary;
              return (
                <PressableScale key={key} style={styles.calendarDayCell} onPress={() => handlePick(key)}>
                  <View style={[styles.calendarDayInner, isSelected && styles.calendarDayInnerSelected]}>
                    <DayRing ratio={dailyGoal ? ratio : 0} color={ringColor} />
                    <Text
                      style={[
                        styles.calendarDayNumber,
                        isToday && styles.calendarDayNumberToday,
                        isSelected && styles.calendarDayNumberSelected,
                      ]}>
                      {day.getDate()}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>

          {mode === 'multi' ? (
            <PressableScale
              style={styles.multiConfirmButton}
              onPress={() => {
                onConfirmMulti?.(Array.from(multiSelected));
                onClose();
              }}>
              <Text style={styles.multiConfirmButtonText}>
                Salvar em {multiSelected.size} dia{multiSelected.size === 1 ? '' : 's'}
              </Text>
            </PressableScale>
          ) : clearModeActive ? (
            <View style={styles.footerRow}>
              <PressableScale
                style={styles.cancelClearButton}
                onPress={() => {
                  setClearModeActive(false);
                  setClearSelected(new Set());
                }}>
                <Text style={styles.cancelClearButtonText}>Cancelar</Text>
              </PressableScale>
              <PressableScale style={styles.clearConfirmButton} onPress={handleConfirmClear}>
                <Text style={styles.clearConfirmButtonText}>Apagar ({clearSelected.size})</Text>
              </PressableScale>
            </View>
          ) : (
            <View style={styles.footerRow}>
              <PressableScale style={styles.todayButton} onPress={() => handlePick(todayKey())}>
                <Text style={styles.todayButtonText}>Ir para hoje</Text>
              </PressableScale>
              {onClearDates && (
                <PressableScale style={styles.clearToggleButton} onPress={() => setClearModeActive(true)}>
                  <Text style={styles.clearToggleButtonText}>🗑</Text>
                </PressableScale>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}