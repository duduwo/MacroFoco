import React, {useEffect, useMemo, useState} from 'react';
import {View, Text, Modal, Pressable, ScrollView} from 'react-native';
import PressableScale from './PressableScale';
import {useCalorie} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import {loadFoodCatalog, type Food} from './data/foodCatalogStorage';
import {loadUserFoods} from './data/userFoodsStorage';
import {loadUserRecipes} from './data/userRecipesStorage';
import {type Recipe} from './data/recipes';
import {periodForTime} from './data/planningResolvers';
import {formatLong, parseDateKey} from './dateUtils';
import TimeSlotPicker from './TimeSlotPicker';
import {makeStyles} from './ScheduleSection.styles';

const MAX_SLOTS = 5;

// Tipo de item que vai preencher cada horário da sessão. Não escolhe mais o
// alimento/receita em si aqui -- só a categoria, pra filtrar a lista que o
// usuário vai ver em Alimentos/Receitas depois (ver AI_CONTEXT.md --
// Organização / Agendamento).
type SlotType = 'food' | 'recipe';
type SessionMode = 'food' | 'recipe' | 'mixed';

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Atalho "Agendar nesse dia": revisado pra só definir a *forma* do dia, não
// mais escolher o alimento/receita no próprio modal. Passo 1 marca até 5
// horários (reaproveitando o TimeSlotPicker do wizard completo). Passo 2
// define, pra esses horários, se vai ser só alimentos simples, só receitas,
// ou uma mistura (nesse caso, o tipo é escolhido por horário). Ao confirmar,
// abre uma sessão ativa no CalorieContext (`activeQuickSchedule`) e fecha o
// modal -- a escolha de cada item passa a acontecer nas próprias abas
// Alimentos/Receitas de Organização, via indicador "1 de X alimentos
// adicionados", uma sessão de horários por vez, na ordem em que foram
// marcados. addPlannedItem + schedulePlannedNotification continuam sendo
// chamados no momento em que cada item é de fato escolhido (dentro de
// FoodActionsSection/RecipesSection), não mais aqui.
export default function QuickScheduleModal({visible, onClose}: Props) {
  const {selectedDate, startQuickSchedule} = useCalorie();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [catalog, setCatalog] = useState<Food[]>([]);
  const [userFoods, setUserFoods] = useState<Food[]>([]);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (!visible) return;
    loadFoodCatalog().then(setCatalog);
    loadUserFoods().then(setUserFoods);
    loadUserRecipes().then(setUserRecipes);
  }, [visible]);

  const [step, setStep] = useState<'times' | 'type'>('times');
  const [times, setTimes] = useState<string[]>([]);
  const [mode, setMode] = useState<SessionMode>('food');
  // Só usado quando mode === 'mixed' -- tipo individual por horário. Nos
  // outros modos, o tipo de todo mundo é derivado direto de `mode`.
  const [slotTypes, setSlotTypes] = useState<SlotType[]>([]);

  const resetAll = () => {
    setStep('times');
    setTimes([]);
    setMode('food');
    setSlotTypes([]);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleAddTime = (time: string) => {
    if (times.length >= MAX_SLOTS) return;
    setTimes(prev => [...prev, time]);
    setSlotTypes(prev => [...prev, mode === 'recipe' ? 'recipe' : 'food']);
  };

  const handleRemoveTime = (index: number) => {
    setTimes(prev => prev.filter((_, i) => i !== index));
    setSlotTypes(prev => prev.filter((_, i) => i !== index));
  };

  const goToType = () => {
    if (times.length === 0) return;
    setStep('type');
  };

  // Trocar o modo geral reaplica o tipo em todos os horários -- exceto indo
  // pra "mistura", onde o que já estava em slotTypes é preservado como
  // ponto de partida (usuário ajusta individualmente a partir daí).
  const handleModeChange = (next: SessionMode) => {
    setMode(next);
    if (next !== 'mixed') {
      setSlotTypes(times.map(() => next));
    }
  };

  const toggleSlotType = (index: number) => {
    setSlotTypes(prev => prev.map((t, i) => (i === index ? (t === 'food' ? 'recipe' : 'food') : t)));
  };

  const handleConfirm = () => {
    if (times.length === 0) return;
    const slots = times.map((time, i) => ({
      time,
      period: periodForTime(time),
      type: slotTypes[i] ?? 'food',
    }));
    startQuickSchedule(selectedDate, slots);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <ScrollView>
            <Text style={styles.modalTitle}>Agendar nesse dia</Text>
            <Text style={styles.modalSubtitle}>{formatLong(parseDateKey(selectedDate))}</Text>

            {step === 'times' && (
              <>
                <Text style={styles.formHint}>
                  Marque até {MAX_SLOTS} horários — um pra cada refeição que você pretende fazer hoje.
                </Text>

                <TimeSlotPicker
                  dateKey={selectedDate}
                  times={times}
                  onAddTime={handleAddTime}
                  onRemoveTime={handleRemoveTime}
                  catalog={catalog}
                  userFoods={userFoods}
                  userRecipes={userRecipes}
                  maxSlots={MAX_SLOTS}
                />

                <View style={styles.modalButtonsRow}>
                  <PressableScale style={styles.modalCancel} onPress={handleClose}>
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </PressableScale>
                  <PressableScale
                    style={[styles.modalSave, times.length === 0 && styles.modalSaveDisabled]}
                    onPress={goToType}
                    disabled={times.length === 0}>
                    <Text style={styles.modalSaveText}>Próximo</Text>
                  </PressableScale>
                </View>
              </>
            )}

            {step === 'type' && (
              <>
                <Text style={styles.modalSubtitle}>
                  {times.length} {times.length === 1 ? 'refeição' : 'refeições'} hoje
                </Text>
                <Text style={styles.formHint}>
                  Essas refeições vão ser de alimentos simples, receitas, ou uma mistura dos dois?
                </Text>

                <View style={styles.chipRow}>
                  <PressableScale
                    style={[styles.sourceChip, mode === 'food' && styles.sourceChipActive]}
                    onPress={() => handleModeChange('food')}>
                    <Text style={[styles.sourceChipText, mode === 'food' && styles.sourceChipTextActive]}>
                      Só alimentos
                    </Text>
                  </PressableScale>
                  <PressableScale
                    style={[styles.sourceChip, mode === 'recipe' && styles.sourceChipActive]}
                    onPress={() => handleModeChange('recipe')}>
                    <Text style={[styles.sourceChipText, mode === 'recipe' && styles.sourceChipTextActive]}>
                      Só receitas
                    </Text>
                  </PressableScale>
                  <PressableScale
                    style={[styles.sourceChip, mode === 'mixed' && styles.sourceChipActive]}
                    onPress={() => handleModeChange('mixed')}>
                    <Text style={[styles.sourceChipText, mode === 'mixed' && styles.sourceChipTextActive]}>
                      Misturar
                    </Text>
                  </PressableScale>
                </View>

                {mode === 'mixed' && (
                  <>
                    <Text style={styles.formLabel}>Tipo de cada horário</Text>
                    <View style={styles.timeGrid}>
                      {times.map((time, i) => {
                        const type = slotTypes[i] ?? 'food';
                        return (
                          <PressableScale
                            key={`${time}-${i}`}
                            style={[styles.timeChip, styles.timeChipActive]}
                            onPress={() => toggleSlotType(i)}>
                            <Text style={[styles.timeChipText, styles.timeChipTextActive]}>{time}</Text>
                            <Text style={styles.timeChipOccupiedLabel}>
                              {type === 'food' ? 'Alimento' : 'Receita'} · toque pra trocar
                            </Text>
                          </PressableScale>
                        );
                      })}
                    </View>
                  </>
                )}

                <Text style={styles.formHint}>
                  Ao confirmar, você volta pra Organização pra escolher cada item, na ordem dos horários, com o
                  indicador "1 de {times.length}".
                </Text>

                <View style={styles.modalButtonsRow}>
                  <PressableScale style={styles.modalCancel} onPress={() => setStep('times')}>
                    <Text style={styles.modalCancelText}>Voltar</Text>
                  </PressableScale>
                  <PressableScale style={styles.modalSave} onPress={handleConfirm}>
                    <Text style={styles.modalSaveText}>Agendar</Text>
                  </PressableScale>
                </View>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}