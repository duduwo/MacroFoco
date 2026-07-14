import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.sm,
  },
  themeToggleCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  goalsInfoButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  goalsInfoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateArrow: {
    width: 26,
    height: 26,
    borderRadius: radius.chip,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: spacing.sm,
  },
  headerDate: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  todayLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  mascotAccentStripe: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
    // Mesmo respiro entre os 3 containers (anel → macros → água): também
    // usado em macroCard.marginBottom logo abaixo.
    marginBottom: spacing.sm,
    ...shadows.cardLg,
  },
  summaryContent: {
    minHeight: 142,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrapper: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotName: {
    marginTop: -4,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  mascotHint: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: '600',
    color: colors.primary,
  },
  // Card dos macros, separado do card do anel de calorias (antes vivia
  // dentro do mesmo card) -- mesmo respiro do summaryCard.marginBottom, pra
  // unificar a distância entre os 3 containers (anel/macros/água).
  macroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.cardLg,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringKcal: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  ringGoal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  macroChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: 4,
    borderRadius: radius.card,
    backgroundColor: colors.backgroundAlt,
  },
  macroIconSquare: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  waterCard: {
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.cardLg,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  waterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  waterAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.water,
  },
  waterGoalText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  waterTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.waterTint,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  waterFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.water,
  },
  waterButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  waterUndoButton: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterUndoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  waterUndoButtonTextDisabled: {
    color: colors.textFaint,
  },
  waterAddButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.button,
    backgroundColor: colors.water,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterAddButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
