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
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    color: colors.text,
  },
  // Primeiro campo do card: sem marginTop, senão soma com o padding do
  // próprio card (manualFormBox) e vira um vão duplo antes de "Nome do
  // alimento".
  labelFirst: {
    marginTop: 0,
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
  // Divisor antes de "Macros (g)" -- separa visualmente os dados básicos
  // (nome/quantidade/calorias) do bloco de macros, dentro do mesmo card.
  sectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowSpacingTop: {
    marginTop: spacing.lg,
  },
  rowItem: {
    flex: 1,
  },
  // Label compacto pra campos lado a lado (Quantidade/Calorias) -- sem o
  // marginTop grande do label de campo empilhado, que sobraria em dobro
  // dentro da row.
  rowItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  // Label pequeno com uma bolinha da cor do macro, em vez de pintar a borda/
  // fundo do próprio input (que fazia "Proteína"/"Gordura" cortar o texto
  // numa coluna estreita, e lia como campo com erro de validação).
  macroInputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  macroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  macroInputLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  macroInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.input,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.buttonPrimary,
  },
  buttonText: {
    color: '#FFF9F2',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chevron: {
    transform: [{rotate: '0deg'}],
  },
  chevronRotated: {
    transform: [{rotate: '180deg'}],
  },
  menuList: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  menuCardActive: {
    borderColor: colors.primary,
  },
  menuCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCardTextWrap: {
    flex: 1,
    gap: 2,
  },
  menuCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  menuCardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  manualFormBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: colors.card,
    shadowColor: colors.text,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  // Card único (header + corpo), em vez de dois cards soltos empilhados --
  // o corpo fica "grudado" no header por um divisor, então abrir/fechar lê
  // como uma coisa só (acordeão), não duas seções separadas.
  userFoodsWrapper: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    overflow: 'hidden',
  },
  userFoodsWrapperActive: {
    borderColor: colors.primary,
  },
  // Header do acordeão: mesmo layout do menuCard, mas sem borda/fundo/
  // sombra próprios (o wrapper acima já cuida disso).
  userFoodsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  userFoodsBody: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    padding: spacing.lg,
  },
  userFoodsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userFoodsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  // Linha só com "Apagar todos", alinhada à direita dentro do corpo --
  // substitui o antigo cabeçalho duplicado ("Alimentos criados" de novo).
  userFoodsBodyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  userFoodsCountBadge: {
    backgroundColor: colors.backgroundAlt2,
    paddingVertical: 2,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  userFoodsCountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  deleteAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.chip,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  deleteAllButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  userFoodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userFoodItemText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  userFoodDeleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  userFoodDeleteButtonText: {
    fontSize: 13,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  emptyStateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  toast: {
  position: 'absolute',
  top: 16,
  left: 24,
  right: 24,
  backgroundColor: '#2D2A26',
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 16,
  zIndex: 999,
  alignItems: 'center',
},
toastText: {
  color: '#FBF7F1',
  fontSize: 14,
  fontWeight: '500',
},
});