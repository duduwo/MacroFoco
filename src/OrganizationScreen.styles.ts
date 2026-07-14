import {StyleSheet, Platform} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  // -------------------------------------------------------------------------
  // Layout raiz
  // -------------------------------------------------------------------------
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingBottom: spacing.lg,
  },

  // -------------------------------------------------------------------------
  // Cabeçalho sticky — seletor de período
  // -------------------------------------------------------------------------
  stickyHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // Sombra sutil para indicar que o conteúdo rola por baixo
    ...Platform.select({
      ios: {
        shadowColor: colors.border,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {elevation: 2},
    }),
  },

  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },

  // -------------------------------------------------------------------------
  // Card de resumo da refeição
  // -------------------------------------------------------------------------
  summaryCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    overflow: 'hidden',
    ...shadows.card,
  },

  summaryCardEmpty: {
    // Sem sombra quando vazio — card mais discreto
    shadowOpacity: 0.06,
    elevation: 1,
  },

  summaryHeader: {
    padding: spacing.md,
  },

  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },

  summaryBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  summaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  summaryMacroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  summaryKcal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },

  summaryMacro: {
    fontSize: 13,
    fontWeight: '600',
  },

  summaryChevron: {
    fontSize: 11,
    color: colors.textFaint,
    marginLeft: 2,
  },

  // Lista de itens no resumo expandido
  summaryDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },

  summaryItems: {
    paddingBottom: spacing.sm,
  },

  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    gap: 10,
  },

  summaryItemEmoji: {
    width: 32,
    alignItems: 'center',
  },

  summaryItemInfo: {
    flex: 1,
  },

  summaryItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  summaryItemKcal: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 1,
  },

  summaryRemoveButton: {
    padding: 4,
  },

  summaryRemoveText: {
    fontSize: 20,
    color: colors.textFaint2,
    lineHeight: 22,
  },

  // -------------------------------------------------------------------------
  // Abas do catálogo
  // -------------------------------------------------------------------------
  catalogTabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.button,
    padding: 3,
  },

  catalogTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: radius.button - 3,
  },

  catalogTabActive: {
    backgroundColor: colors.card,
    ...Platform.select({
      ios: {
        shadowColor: '#785A3C',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {elevation: 2},
    }),
  },

  catalogTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textFaint,
  },

  catalogTabTextActive: {
    color: colors.text,
  },

  // -------------------------------------------------------------------------
  // Rodapé com botão de salvar
  // -------------------------------------------------------------------------
  bottomSpacer: {
    height: 90, // espaço para o footer fixo não cobrir o último item
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.select({ios: 28, android: spacing.md}),
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  clearButton: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },

  saveButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.buttonPrimary,
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Kcal numa segunda linha, em vez de dividir "Salvar refeição · X kcal"
  // num só Text — com o botão mais estreito (undo ao lado), a quebra
  // automática cortava a frase no meio de forma estranha.
  saveButtonKcal: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },

  // Botão "desfazer" (remove o último item) — vivia isolado no cabeçalho
  // peek; movido pro lado do botão de salvar, mais alcançável com o polegar.
  footerUndoButton: {
    width: 48,
    borderRadius: radius.button,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerUndoIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
