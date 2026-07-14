import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  warningWrapper: {
    borderRadius: radius.card,
    backgroundColor: colors.card,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  warningBox: {
    backgroundColor: colors.card,
    borderLeftWidth: 8,
    borderLeftColor: colors.carbs,
    borderRadius: radius.card,
    padding: spacing.md,
    overflow: 'hidden',
  },
  warningText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'justify',
    lineHeight: 22,
  },
  acceptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  acceptText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.button,
    alignItems: 'center',
    ...shadows.buttonPrimary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF9F2',
    fontSize: 16,
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },

  checkmark: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  logo: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});