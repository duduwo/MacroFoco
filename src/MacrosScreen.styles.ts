import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    color: colors.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.input,
    padding: 13,
    fontSize: 16,
    color: colors.text,
  },
  inputProtein: {
    borderColor: colors.protein,
  },
  inputCarbs: {
    borderColor: colors.carbs,
  },
  inputFat: {
    borderColor: colors.fat,
  },
  resultBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.buttonPrimary,
  },
  buttonText: {
    color: '#FFF9F2',
    fontSize: 16,
    fontWeight: '700',
  },
});