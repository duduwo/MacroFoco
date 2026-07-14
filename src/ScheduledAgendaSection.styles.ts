import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt2,
    borderRadius: radius.chip,
    padding: 2,
  },
  modeButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.chip,
  },
  modeButtonActive: {
    backgroundColor: colors.card,
    ...shadows.card,
  },
  modeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modeButtonTextActive: {
    color: colors.primary,
  },

  periodBlock: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.card,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  periodHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodChevron: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textFaint,
    marginRight: 6,
    transform: [{rotate: '0deg'}],
  },
  periodChevronOpen: {
    transform: [{rotate: '90deg'}],
    color: colors.primary,
  },
  periodIconWrap: {
    marginRight: 6,
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  periodCount: {
    fontSize: 12,
    color: colors.textFaint,
    marginLeft: 4,
  },
  periodKcal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  periodHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  periodDeleteButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodDeleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textFaint,
    lineHeight: 16,
  },
  periodBody: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  periodMacrosList: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundAlt,
  },
  periodMacrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  periodMacrosName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  // Badges coloridos por macro (bolinha + valor na cor do nutriente) — mesmo
  // padrão usado no "Itens da refeição" da Organização, em vez de um texto
  // corrido só numa cor.
  macroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  macroBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2,
  },
  macroBadgeValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Só no card do item (AgendaRow) — no resumo por período o badgeRow já
  // fica lado a lado com o nome, sem precisar de espaço acima.
  rowMacrosWrap: {
    marginTop: 2,
  },

  timeGroup: {
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rowDone: {
    backgroundColor: colors.backgroundAlt,
  },
  rowEmoji: {
    fontSize: 15,
    marginRight: 8,
  },
  rowTextBlock: {
    flex: 1,
  },
  rowName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  rowNameDone: {
    color: colors.textFaint,
  },
  rowStatus: {
    fontSize: 10,
    color: colors.textFaint,
    fontStyle: 'italic',
    marginTop: 1,
  },
  rowKcal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },

  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: 6,
  },
  rowActionDone: {
    backgroundColor: colors.fat,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.chip,
  },
  rowActionDoneText: {
    color: '#FFF9F2',
    fontSize: 11,
    fontWeight: '700',
  },
  rowActionDelete: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActionDeleteText: {
    color: '#FFF9F2',
    fontSize: 12,
    fontWeight: '700',
  },
  rowActionUndo: {
    backgroundColor: colors.backgroundAlt2,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.chip,
  },
  rowActionUndoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
});