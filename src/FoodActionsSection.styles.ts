import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitleGrow: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
    color: colors.textFaint,
    marginBottom: spacing.md,
  },

  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundAlt2,
    borderRadius: radius.chip,
    padding: 4,
  },
  periodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: radius.chip,
    backgroundColor: 'transparent',
  },
  periodChipActive: {
    backgroundColor: colors.primary,
  },
  periodChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  periodChipTextActive: {
    color: '#FFF9F2',
  },
  newFoodButton: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    ...shadows.buttonPrimary,
  },
  newFoodButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF9F2',
  },
  viewToggleButton: {
    backgroundColor: colors.backgroundAlt2,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  viewToggleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  viewToggleButtonTextActive: {
    color: '#FFFFFF',
  },

  searchInput: {
    backgroundColor: colors.card,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.md,
  },
  addButtonText: {
    color: '#FFF9F2',
    fontSize: 18,
    fontWeight: '700',
  },
  foodName: {
    width: '100%',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  foodDosage: {
    width: '100%',
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 1,
  },

  foodCardListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  foodThumbnailList: {
    width: 52,
    height: 52,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  foodInfoList: {
    flex: 1,
  },
  addButtonList: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    ...shadows.buttonPrimary,
  },
  recommendedBadgeTextList: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 1,
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
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
  },
  modalEmoji: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  modalDosage: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalMacroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  modalMacroLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  modalMacroValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  modalHint: {
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: radius.chip,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  quantityValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.lg,
    minWidth: 40,
    textAlign: 'center',
  },
  modalAddButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.buttonPrimary,
  },
  modalAddButtonText: {
    color: '#FFF9F2',
    fontSize: 15,
    fontWeight: '700',
  },
  foodCardRecommended: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.card,
  },
});