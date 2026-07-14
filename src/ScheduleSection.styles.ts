import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

// Estilos compartilhados por QuickScheduleModal e TimeSlotPicker.
// (Era o styles do antigo ScheduleSection — o wizard foi removido e as chaves
// que só ele usava foram podadas junto.)
export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  newButtonSmall: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    ...shadows.buttonPrimary,
  },
  newButtonSmallText: {color: '#FFF9F2', fontSize: 14, fontWeight: '700'},
  clearHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textFaint,
    marginBottom: spacing.md,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,38,33,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  formHint: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  formLabelHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  // Aviso de que o modal foi aberto a partir de "Alimentos Individuais",
  // com um alimento pré-selecionado pro primeiro horário adicionado.
  presetHint: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.proteinTint,
    borderRadius: radius.chip,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  // Relógio grande do passo 1 do "Novo agendamento" — o horário sendo
  // ajustado com os botões de avanço/retrocesso antes de ser adicionado.
  pickerTimeText: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
    minWidth: 150,
  },
  pickerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  pickerArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerArrowButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },

  // Seletor de período em grade 2x2 (Manhã/Almoço na 1ª linha, Tarde/Noite
  // na 2ª) — tocar num período pula o relógio grande pro horário padrão
  // daquele período (DEFAULT_PERIOD_TIME).
  periodGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  periodGridCell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.chip,
    backgroundColor: colors.backgroundAlt2,
    marginBottom: spacing.sm,
  },
  periodGridCellActive: {backgroundColor: colors.fat},
  periodGridIconWrap: {marginRight: spacing.sm},
  periodGridLabel: {fontSize: 13, fontWeight: '700', color: colors.textMuted},
  periodGridLabelActive: {color: '#FFF9F2'},

  // Bolinha "Intervalo de tempo": toque simples ou deslize (esquerda/
  // direita) alterna entre 15/30/60 minutos, usado pelas setas do relógio.
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  intervalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  intervalCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalCircleText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },

  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.chip,
    backgroundColor: colors.backgroundAlt2,
    minWidth: 62,
    alignItems: 'center',
  },
  timeChipActive: {backgroundColor: colors.primary},
  timeChipText: {fontSize: 12, fontWeight: '600', color: colors.textMuted},
  timeChipTextActive: {color: '#FFF9F2'},
  // Horário que já tem um item agendado pendente nesse dia.
  timeChipOccupiedLabel: {
    fontSize: 9,
    color: colors.textFaint,
    maxWidth: 58,
    marginTop: 2,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sourceChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    backgroundColor: colors.backgroundAlt2,
  },
  sourceChipActive: {backgroundColor: colors.primary},
  sourceChipText: {fontSize: 12, fontWeight: '600', color: colors.textMuted},
  sourceChipTextActive: {color: '#FFF9F2'},

  modalButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt2,
  },
  modalCancelText: {color: colors.textMuted, fontSize: 14, fontWeight: '700'},
  modalSave: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  modalSaveText: {color: '#FFF9F2', fontSize: 14, fontWeight: '700'},
  modalSaveDisabled: {backgroundColor: colors.backgroundAlt2},
});
