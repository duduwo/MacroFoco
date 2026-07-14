import {StyleSheet} from 'react-native';
import {spacing, radius, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavButtonText: {fontSize: 18, fontWeight: '700', color: colors.text},
  calendarMonthLabel: {fontSize: 15, fontWeight: '700', color: colors.text, textTransform: 'capitalize'},

  calendarWeekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarWeekdayCell: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textFaint,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayInner: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayInnerSelected: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  calendarDayNumber: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  calendarDayNumberToday: {
    fontWeight: '800',
    color: colors.primary,
  },
  calendarDayNumberSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  footerRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  todayButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.chip,
    backgroundColor: colors.backgroundAlt2,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  clearToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  clearToggleButtonText: {
    fontSize: 16,
  },
  cancelClearButton: {
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.chip,
    backgroundColor: colors.backgroundAlt2,
  },
  cancelClearButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  clearConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.chip,
    backgroundColor: colors.danger,
  },
  clearConfirmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.card,
  },
  multiConfirmButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.chip,
    backgroundColor: colors.primary,
  },
  multiConfirmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.card,
  },
});