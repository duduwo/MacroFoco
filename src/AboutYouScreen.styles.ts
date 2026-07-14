import {StyleSheet} from 'react-native';
import {spacing, radius, shadows, type ThemeColors} from './theme';

export const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginBottom: 12,
  },
  // Cada grupo de campos (dados pessoais, sexo, atividade, objetivo) fica
  // dentro de um desses cards -- mesmo radius/sombra usados em Perfil, pra
  // separar visualmente as paradas do formulário em vez de tudo escorrido
  // num bloco só.
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.cardLg,
    padding: 14,
    marginBottom: 10,
    ...shadows.card,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  numericFieldsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  numericField: {
    flex: 1,
    minWidth: 0,
  },
  compactLabel: {
    minHeight: 18,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  fieldUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  compactInput: {
    height: 48,
    paddingVertical: 0,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  infoIcon: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  infoBox: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  infoBoxText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    lineHeight: 17,
  },
  infoBoxLabel: {
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.input,
    padding: 13,
    fontSize: 16,
    color: colors.text,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.chip,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFF9F2',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 14,
  },
  // Rodapé fixo (fora do ScrollView) com o botão "Continuar" -- fica sempre
  // visível na tela, sem precisar rolar até o fim do formulário. A borda +
  // fundo sólido separam ele do conteúdo que rola por trás.
  footer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: colors.backgroundAlt2,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFF9F2',
    fontSize: 16,
    fontWeight: '700',
  },
});
