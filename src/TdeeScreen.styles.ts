import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  summaryChip: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.chip,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  resultBox: {
    padding: spacing.lg,
    borderRadius: radius.cardLg,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    ...shadows.card,
  },
  resultText: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
  },
  resultSubtext: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF9F2',
    fontSize: 16,
    fontWeight: '700',
  },
});
