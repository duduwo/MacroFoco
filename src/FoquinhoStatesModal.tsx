import React, {useMemo} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {DiaryMascot} from './DiaryMascot';
import type {FoquinhoStage} from './MutantDropMascot';
import PressableScale from './PressableScale';
import {useTheme} from './context/ThemeContext';
import {
  DIARY_MASCOT_NAMES,
  type DiaryMascotId,
} from './data/mascotStorage';
import {radius, spacing, type ThemeColors} from './theme';

type StateInfo = {
  stage: FoquinhoStage;
  criterion: string;
  sampleProgress: number;
};

const STATES: StateInfo[] = [
  {stage: 0, criterion: 'Nenhum alimento registrado no dia.', sampleProgress: 0},
  {stage: 1, criterion: '1 alimento e menos de 35% da meta calórica.', sampleProgress: 0.18},
  {stage: 2, criterion: '2 alimentos ou 35% da meta calórica.', sampleProgress: 0.42},
  {stage: 3, criterion: '4 alimentos ou 65% da meta calórica.', sampleProgress: 0.7},
  {stage: 4, criterion: '5 alimentos ou 90% da meta calórica.', sampleProgress: 0.95},
];

const STATE_COPY: Record<DiaryMascotId, {name: string; description: string}[]> = {
  foquinho: [
    {name: 'Gotinha adormecida', description: 'Foquinho espera o primeiro registro para despertar.'},
    {name: 'Foquinho despertando', description: 'Os olhos se abrem e surgem os primeiros sinais dos macros.'},
    {name: 'Foquinho brotando', description: 'Uma folha nasce e os pontos coloridos ficam mais vivos.'},
    {name: 'Foquinho mutante', description: 'Ele ganha uma segunda folha, braços e mais expressão.'},
    {name: 'Foquinho completo', description: 'A forma final recebe um halo maior e celebra o progresso.'},
  ],
  mudinha: [
    {name: 'Semente em descanso', description: 'Mudinha permanece recolhida enquanto o diário está vazio.'},
    {name: 'Primeiro broto', description: 'Um caule e a primeira folha aparecem com o primeiro registro.'},
    {name: 'Duas folhas', description: 'A copa cresce e os três nutrientes começam a colorir a semente.'},
    {name: 'Planta curiosa', description: 'Mudinha ganha folhas laterais e braços para acompanhar o dia.'},
    {name: 'Mudinha florida', description: 'Uma flor com as três cores dos macros marca a forma completa.'},
  ],
  panelito: [
    {name: 'Panela em descanso', description: 'Panelito fica fechado e sem vapor enquanto nada foi registrado.'},
    {name: 'Começando a aquecer', description: 'O primeiro fio de vapor aparece e Panelito desperta.'},
    {name: 'Tampa levantando', description: 'A tampa inclina, as alças surgem e o vapor aumenta.'},
    {name: 'Cozinhando com energia', description: 'Panelito ganha pés e três sinais de vapor sobre a tampa.'},
    {name: 'Receita completa', description: 'Os vapores assumem as cores dos macros e ele celebra o dia.'},
  ],
};

const MASCOTS: DiaryMascotId[] = ['foquinho', 'mudinha', 'panelito'];
const PREVIEW_MACROS = {protein: 55, carbs: 55, fat: 55};
const PREVIEW_GOALS = {protein: 100, carbs: 100, fat: 100};

export function FoquinhoStatesModal({
  visible,
  onClose,
  currentStage,
  selectedMascot,
  onSelectMascot,
}: {
  visible: boolean;
  onClose: () => void;
  currentStage: FoquinhoStage;
  selectedMascot: DiaryMascotId;
  onSelectMascot: (mascot: DiaryMascotId) => void;
}) {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const copy = STATE_COPY[selectedMascot];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar mascotes do Diário"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.title}>Mascotes do Diário</Text>
          <Text style={styles.subtitle}>
            Escolha seu pet. A seleção é salva, e todos evoluem com os mesmos critérios.
          </Text>

          <View style={styles.mascotPicker}>
            {MASCOTS.map(mascot => {
              const selected = mascot === selectedMascot;
              return (
                <PressableScale
                  key={mascot}
                  accessibilityRole="button"
                  accessibilityState={{selected}}
                  accessibilityLabel={`Usar ${DIARY_MASCOT_NAMES[mascot]}`}
                  style={[styles.mascotOption, selected && styles.mascotOptionSelected]}
                  onPress={() => onSelectMascot(mascot)}>
                  <DiaryMascot
                    mascotId={mascot}
                    size={52}
                    foodCount={2}
                    calorieProgress={0.42}
                    macrosConsumed={PREVIEW_MACROS}
                    macroGoals={PREVIEW_GOALS}
                    forcedStage={2}
                  />
                  <Text style={[styles.mascotOptionName, selected && styles.mascotOptionNameSelected]}>
                    {DIARY_MASCOT_NAMES[mascot]}
                  </Text>
                  {selected && <View style={styles.selectedDot} />}
                </PressableScale>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Estados de {DIARY_MASCOT_NAMES[selectedMascot]}</Text>
          <Text style={styles.criteriaHint}>Quando houver “ou”, basta atingir um dos critérios.</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            {STATES.map(item => {
              const isCurrent = item.stage === currentStage;
              const stateCopy = copy[item.stage];
              const sampleMacros = {
                protein: 100 * item.sampleProgress,
                carbs: 100 * item.sampleProgress,
                fat: 100 * item.sampleProgress,
              };
              return (
                <View
                  key={item.stage}
                  style={[styles.stateCard, isCurrent && styles.currentCard]}>
                  <View style={styles.mascotPreview}>
                    <DiaryMascot
                      mascotId={selectedMascot}
                      size={66}
                      foodCount={item.stage}
                      calorieProgress={item.sampleProgress}
                      macrosConsumed={sampleMacros}
                      macroGoals={PREVIEW_GOALS}
                      forcedStage={item.stage}
                    />
                  </View>
                  <View style={styles.stateText}>
                    <View style={styles.stateTitleRow}>
                      <View style={styles.stageNumber}>
                        <Text style={styles.stageNumberText}>{item.stage + 1}</Text>
                      </View>
                      <Text style={styles.stateTitle}>{stateCopy.name}</Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>ATUAL</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.criterion}>{item.criterion}</Text>
                    <Text style={styles.description}>{stateCopy.description}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <PressableScale style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Pronto</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(43,38,33,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  mascotPicker: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  mascotOption: {
    flex: 1,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 5,
  },
  mascotOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.proteinTint,
  },
  mascotOptionName: {
    marginTop: -3,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  mascotOptionNameSelected: {
    color: colors.primary,
  },
  selectedDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  criteriaHint: {
    fontSize: 10,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 2,
  },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  currentCard: {
    borderColor: colors.primary,
    backgroundColor: colors.proteinTint,
  },
  mascotPreview: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    flex: 1,
    paddingLeft: 4,
  },
  stateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageNumber: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt2,
  },
  stageNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
  },
  stateTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  currentBadge: {
    marginLeft: 'auto',
    borderRadius: radius.chip,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  criterion: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt2,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
