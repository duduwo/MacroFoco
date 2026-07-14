import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  loadingText: {
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  // --- Seções por refeição ---
  mealSection: {
    marginBottom: spacing.lg,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  mealTitleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Toggle "Cadastradas" — mesma mecânica do "Cadastrados" de alimentos.
  registeredToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.chip,
    backgroundColor: colors.backgroundAlt2,
  },
  registeredToggleActive: {
    backgroundColor: colors.primary,
  },
  registeredToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  registeredToggleTextActive: {
    color: '#FFF9F2',
  },
  createRecipeButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.chip,
    backgroundColor: colors.primary,
    ...shadows.buttonPrimary,
  },
  createRecipeButtonSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF9F2',
  },
  mealHint: {
    fontSize: 12,
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },

  // Estado vazio de uma seção (ex: filtro "Cadastradas" sem nenhuma receita
  // própria naquele horário) — cabeçalho da seção continua visível, só o
  // conteúdo abaixo do hint vira esse cartão com CTA pra criar uma.
  emptyStateCard: {
    backgroundColor: colors.backgroundAlt2,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyStateText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyStateButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    ...shadows.buttonPrimary,
  },
  emptyStateButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF9F2',
  },

  // --- Card de receita ---
  recipeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    position: 'relative',
    ...shadows.card,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  recipeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  recipeEmojiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  recipeEmoji: {
    fontSize: 18,
  },
  recipeNameCol: {
    flex: 1,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginTop: 4,
  },
  footerExpand: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    ...shadows.buttonPrimary,
  },
  expandHandleUp: {
    opacity: 0.6,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  addButtonText: {
    color: '#FFF9F2',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },

  collapsedSummary: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // --- Ajuste de quantidade por ingrediente (expandido) ---
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  quantityLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  quantityValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 6,
    minWidth: 22,
    textAlign: 'center',
  },

  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  kcalText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  macroText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // --- Modal: criar receita (bottom sheet) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43,38,33,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    maxHeight: '88%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalSectionHint: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textFaint,
  },
  selectedCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF9F2',
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  // Horários lado a lado numa bandeja — mesmo estilo do seletor de período
  // da tela de Alimentos, mas com multi-seleção.
  mealTypeTray: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.backgroundAlt2,
    borderRadius: radius.chip + 6,
    padding: 6,
    marginBottom: spacing.sm,
  },
  mealTypeTrayChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.chip,
    backgroundColor: 'transparent',
  },
  mealTypeTrayChipActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 3,
  },

  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  // Área de scroll exclusiva da lista de ingredientes — o resto do sheet é
  // fixo. flexShrink permite encolher quando o sheet atinge o maxHeight.
  ingredientScroll: {
    flexShrink: 1,
    marginBottom: spacing.sm,
  },
  // Grade 2 colunas: todos os chips com a mesma largura/altura, nomes longos
  // truncados com reticências (numberOfLines no componente).
  ingredientPickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    paddingBottom: spacing.sm,
  },
  // Chips padronizados: mesmo tamanho/peso de texto nos dois estados; o não
  // selecionado é card branco com borda (contrasta com o fundo do sheet).
  ingredientChip: {
    width: '48.5%',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ingredientChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  ingredientChipTextActive: {
    color: '#FFF9F2',
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalButtonSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF9F2',
  },
});