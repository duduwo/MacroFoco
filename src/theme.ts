// Paleta de cores compartilhada do MacroFoco — tons neutros quentes
// (redesign baseado no handoff "Redesign Health Tracker" — opção "Anel refinado")
//
// Dark mode: em vez de um `colors` estático, o app tem duas paletas
// (lightColors/darkColors) com as mesmas chaves, e cada tela lê a paleta
// ativa via useTheme() (ThemeContext). Os arquivos *.styles.ts viraram
// funções `makeStyles(colors)` em vez de StyleSheet.create({...}) fixo no
// carregamento do módulo — StyleSheet.create não é reativo, então precisa
// ser chamado de novo quando o modo muda.
export type ThemeMode = 'light' | 'dark';

const lightColors = {
  primary: '#C6603E', // terracota — CTA, progresso, accent de proteína
  danger: '#C6603E', // no novo design não há vermelho separado; "Limpar" usa terracota mesmo

  background: '#FBF7F1', // off-white quente
  backgroundAlt: '#F3ECE2',
  backgroundAlt2: '#EDE6DC',
  card: '#FFFFFF',

  border: '#E9DFCF',
  borderStrong: '#E3D6C4',
  divider: '#F0E6D8',

  text: '#2B2621',
  textMuted: '#5C5348',
  textFaint: '#9C8E7F',
  textFaint2: '#B3A695',

  progressTrack: '#F1E7DA',

  // cores dos 3 macros
  protein: '#C6603E', // terracota (mesma da marca)
  carbs: '#D4A144', // mostarda
  fat: '#6E8F6E', // verde sálvia

  // versões bem claras das 3 cores acima, usadas como fundo tingido de card
  // conforme o macro predominante do alimento (ex: arroz = mais carbo = amarelado)
  proteinTint: '#F5E4DD',
  carbsTint: '#FBF0D9',
  fatTint: '#E8F0E4',

  // água — azul-ardósia dessaturado pra sugerir água sem destoar dos tons quentes
  water: '#5B8AA6',
  waterTint: '#E4EDF2',

  // Texto fixo sobre superfícies coloridas (botão primário, badges) — não
  // inverte com o tema, porque o fundo por trás dele também não inverte.
  onPrimary: '#FFF9F2',
};

const darkColors: typeof lightColors = {
  primary: '#E0825E', // terracota clareada — mesma identidade, contraste em fundo escuro
  danger: '#E0825E',

  background: '#1E1A17', // "preto" quente, não neutro/frio
  backgroundAlt: '#262019',
  backgroundAlt2: '#2E2620',
  card: '#2A241F',

  border: '#3D352C',
  borderStrong: '#4A4033',
  divider: '#362E26',

  text: '#F5EFE7',
  textMuted: '#C4B8A8',
  textFaint: '#8C8072',
  textFaint2: '#6E6353',

  progressTrack: '#3A3128',

  protein: '#E0825E',
  carbs: '#E0B85A',
  fat: '#8FB08A',

  // Tints escuros (não claros): fundo tingido do card usa uma versão escura
  // do tom do macro, em vez do pastel claro que faz sentido no fundo off-white.
  proteinTint: '#3D2A22',
  carbsTint: '#3D3420',
  fatTint: '#253A28',

  water: '#7BA8C4',
  waterTint: '#223440',

  onPrimary: '#FFF9F2',
};

export type ThemeColors = typeof lightColors;

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

export const spacing = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  input: 14,
  button: 16,
  chip: 20,
  card: 20,
  cardLg: 26,
};

// Sombras "quentes" do handoff (aproximação — CSS box-shadow com spread negativo
// não tem equivalente exato no React Native; usei shadowRadius/opacity próximos).
// Não variam por tema: no Android (foco deste app) elevation ignora shadowColor,
// e no fundo escuro uma sombra mais sutil já é o efeito visual esperado.
export const shadows = {
  card: {
    shadowColor: '#785A3C',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLg: {
    shadowColor: '#785A3C',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonPrimary: {
    shadowColor: '#C6603E',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 5,
  },
};

// Fundo tingido do card conforme o macro predominante do alimento/receita
// (ex: arroz = mais carbo = amarelado). Fonte única usada por Diário e Receitas.
export function getTintByMacro(colors: ThemeColors): Record<'protein' | 'carbs' | 'fat', string> {
  return {
    protein: colors.proteinTint,
    carbs: colors.carbsTint,
    fat: colors.fatTint,
  };
}
