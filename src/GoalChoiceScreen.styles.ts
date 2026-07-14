import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.buttonPrimary,
  },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.card,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: colors.textMuted,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  linkButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
