import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
    padding: spacing.lg,
    maxHeight: '75%',
    ...shadows.card,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  templatesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  templatesScroll: {
    flexGrow: 0,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  templateCell: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
