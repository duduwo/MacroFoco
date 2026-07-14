import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 100,
  },

  // --- Avatar + nome ---
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholderText: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textMuted,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
    minWidth: 160,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    paddingVertical: 4,
  },
  avatarEditHint: {
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 2,
  },

  // --- Strip de stats (kcal / peso / água) ---
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.divider,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  // --- Chips de macro ---
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  macroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.chip,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 3,
  },
  macroChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // --- Card de Progresso, em destaque ---
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.cardLg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.buttonPrimary,
  },
  progressIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextWrap: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF9F2',
  },
  progressHint: {
    fontSize: 12,
    color: 'rgba(255,249,242,0.85)',
    marginTop: 2,
  },

  // --- Menu de ações ---
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  menuHint: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 1,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.md + 36 + spacing.md,
  },

  // --- Card genérico (lembretes) — mesmo radius/sombra do menuCard/
  // progressCard/statStrip, pra ficar visualmente consistente com o resto
  // da tela em vez do radius menor que tinha antes.
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Mesmo layout de MenuRow (ícone circular + texto), só sem o chevron —
  // o controle à direita aqui é o Switch.
  switchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
