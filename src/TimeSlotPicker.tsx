import React, {useMemo, useRef, useState} from 'react';
import {View, Text, PanResponder} from 'react-native';
import {useCalorie} from './context/CalorieContext';
import {
  resolveSourceBase,
  periodForTime,
  PLANNING_PERIOD_OPTIONS,
  DEFAULT_PERIOD_TIME,
  TIME_STEP_OPTIONS,
} from './data/planningResolvers';
import type {Food} from './data/foodCatalogStorage';
import type {Recipe} from './data/recipes';
import {useTheme} from './context/ThemeContext';
import {MealPeriodIcon} from './MealPeriodIcons';
import PressableScale from './PressableScale';
import {makeStyles} from './ScheduleSection.styles';

type Props = {
  // Dia alvo -- usado só pra saber quais horários já estão ocupados por
  // outro item pendente nesse mesmo dia (evita colisão de horário).
  dateKey: string;
  times: string[];
  onAddTime: (time: string) => void;
  onRemoveTime: (index: number) => void;
  catalog: Food[];
  userFoods: Food[];
  userRecipes: Recipe[];
  // Limita quantos horários podem ser adicionados. Usado pelo atalho rápido
  // "Agendar nesse dia" (no máximo 5 itens). O wizard completo em
  // ScheduleSection não passa esse prop, então fica sem limite -- mesmo
  // comportamento de antes.
  maxSlots?: number;
  // Nome do alimento vindo de um preset (ex: long-press "Programar" na aba
  // Alimentos), mostrado como dica acima da grade de período.
  presetHint?: string | null;
};

// Passo de "marcar horários" extraído do wizard de Programação
// (ScheduleSection): grade de período, stepper de horário, controle de
// intervalo e lista de chips dos horários já adicionados. Reaproveitado
// tanto pelo wizard completo quanto pelo atalho rápido "Agendar nesse dia",
// pra não duplicar essa lógica em dois lugares.
export default function TimeSlotPicker({
  dateKey,
  times,
  onAddTime,
  onRemoveTime,
  catalog,
  userFoods,
  userRecipes,
  maxSlots,
  presetHint,
}: Props) {
  const {plannedByDate} = useCalorie();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [pickerTime, setPickerTime] = useState('07:00');
  const [timeStepMinutes, setTimeStepMinutes] = useState<number>(15);

  const occupiedTimes = useMemo(() => {
    const map = new Map<string, string>();
    (plannedByDate[dateKey] ?? []).forEach(item => {
      if (item.status === 'pending') {
        const base = resolveSourceBase(item.source, catalog, userFoods, userRecipes);
        map.set(item.time, base?.name ?? 'Ocupado');
      }
    });
    return map;
  }, [plannedByDate, dateKey, catalog, userFoods, userRecipes]);

  const shiftPickerTime = (deltaMinutes: number) => {
    setPickerTime(prev => {
      const [hh, mm] = prev.split(':').map(Number);
      const total = (hh * 60 + mm + deltaMinutes + 1440) % 1440;
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    });
  };

  const cycleTimeStep = (direction: 1 | -1) => {
    setTimeStepMinutes(prev => {
      const idx = TIME_STEP_OPTIONS.indexOf(prev);
      const nextIdx = (idx + direction + TIME_STEP_OPTIONS.length) % TIME_STEP_OPTIONS.length;
      return TIME_STEP_OPTIONS[nextIdx];
    });
  };

  const intervalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 18) cycleTimeStep(1);
        else if (gesture.dx < -18) cycleTimeStep(-1);
        else cycleTimeStep(1);
      },
    }),
  ).current;

  const pickerPeriod = periodForTime(pickerTime);
  const pickerOccupiedName = occupiedTimes.get(pickerTime);
  const pickerAlreadyAdded = times.includes(pickerTime);
  const reachedMax = maxSlots !== undefined && times.length >= maxSlots;
  const addDisabled = !!pickerOccupiedName || pickerAlreadyAdded || reachedMax;

  return (
    <>
      {presetHint && <Text style={styles.presetHint}>Programando: {presetHint}</Text>}

      <View style={styles.periodGrid2x2}>
        {PLANNING_PERIOD_OPTIONS.map(p => {
          const active = p.key === pickerPeriod;
          return (
            <PressableScale
              key={p.key}
              style={[styles.periodGridCell, active && styles.periodGridCellActive]}
              onPress={() => setPickerTime(DEFAULT_PERIOD_TIME[p.key])}>
              <View style={styles.periodGridIconWrap}>
                <MealPeriodIcon period={p.key} size={18} color={active ? '#FFF9F2' : colors.text} />
              </View>
              <Text style={[styles.periodGridLabel, active && styles.periodGridLabelActive]}>
                {p.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <View style={styles.pickerTimeRow}>
        <PressableScale style={styles.pickerArrowButton} onPress={() => shiftPickerTime(-timeStepMinutes)}>
          <Text style={styles.pickerArrowButtonText}>‹</Text>
        </PressableScale>
        <Text style={styles.pickerTimeText}>{pickerTime}</Text>
        <PressableScale style={styles.pickerArrowButton} onPress={() => shiftPickerTime(timeStepMinutes)}>
          <Text style={styles.pickerArrowButtonText}>›</Text>
        </PressableScale>
      </View>

      <View style={styles.intervalRow}>
        <Text style={styles.intervalLabel}>Intervalo de tempo</Text>
        <View style={styles.intervalCircle} {...intervalPanResponder.panHandlers}>
          <Text style={styles.intervalCircleText}>{timeStepMinutes}m</Text>
        </View>
      </View>

      {(pickerOccupiedName || pickerAlreadyAdded || reachedMax) && (
        <Text style={styles.clearHint}>
          {reachedMax
            ? `Máximo de ${maxSlots} horários.`
            : pickerAlreadyAdded
            ? 'Esse horário já foi adicionado.'
            : `Ocupado: ${pickerOccupiedName}`}
        </Text>
      )}

      <PressableScale
        style={[styles.newButtonSmall, addDisabled && styles.modalSaveDisabled]}
        onPress={() => onAddTime(pickerTime)}
        disabled={addDisabled}>
        <Text style={styles.newButtonSmallText}>+ Adicionar horário</Text>
      </PressableScale>

      <Text style={styles.formLabel}>
        Horários adicionados{' '}
        {times.length > 0 && (
          <Text style={styles.formLabelHint}>
            · {times.length}
            {maxSlots ? `/${maxSlots}` : ''}
          </Text>
        )}
      </Text>
      {times.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum horário adicionado ainda.</Text>
      ) : (
        <View style={styles.timeGrid}>
          {times.map((time, i) => (
            <PressableScale
              key={`${time}-${i}`}
              style={[styles.timeChip, styles.timeChipActive]}
              onPress={() => onRemoveTime(i)}>
              <Text style={[styles.timeChipText, styles.timeChipTextActive]}>{time} ✕</Text>
              <Text style={styles.timeChipOccupiedLabel}>
                {PLANNING_PERIOD_OPTIONS.find(p => p.key === periodForTime(time))?.label}
              </Text>
            </PressableScale>
          ))}
        </View>
      )}
    </>
  );
}
