// Utilitários compartilhados: escalar porção/macros por um multiplicador, e
// descobrir o macronutriente predominante de um alimento/receita (usado para
// tingir o card de acordo com a composição — ex: arroz mais amarelado por
// ser majoritariamente carboidrato).

export type MacroAmounts = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// Fatores de Atwater (kcal por grama de cada macro). Centralizados aqui e
// reutilizados pelas telas de configuração de meta (Macros e Tdee).
export const KCAL_PER_GRAM = {protein: 4, carbs: 4, fat: 9} as const;

// Escala o texto da porção (ex: "100g" -> "200g" com multiplicador 2,
// "1 unidade" -> "2 unidade" com multiplicador 2). Funciona em cima do
// primeiro número encontrado no texto, então serve pra qualquer unidade.
export function scaleDosage(dosage: string, multiplier: number): string {
  const match = dosage.match(/^([\d.,]+)/);
  if (!match) return dosage;
  const baseNum = parseFloat(match[1].replace(',', '.'));
  if (isNaN(baseNum)) return dosage;
  const scaled = baseNum * multiplier;
  const scaledStr = Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
  return dosage.replace(match[1], scaledStr);
}

export function scaleMacros(base: MacroAmounts, multiplier: number): MacroAmounts {
  return {
    calories: Math.round(base.calories * multiplier),
    protein: Math.round(base.protein * multiplier * 10) / 10,
    carbs: Math.round(base.carbs * multiplier * 10) / 10,
    fat: Math.round(base.fat * multiplier * 10) / 10,
  };
}

export type DominantMacro = 'protein' | 'carbs' | 'fat';

// Descobre qual macro domina a composição calórica do alimento (não a
// massa em gramas — usa a contribuição em kcal de cada um, via Atwater:
// proteína e carbo 4 kcal/g, gordura 9 kcal/g).
export function dominantMacro(food: {protein: number; carbs: number; fat: number}): DominantMacro {
  const proteinKcal = food.protein * 4;
  const carbsKcal = food.carbs * 4;
  const fatKcal = food.fat * 9;
  const max = Math.max(proteinKcal, carbsKcal, fatKcal);
  if (max === proteinKcal) return 'protein';
  if (max === carbsKcal) return 'carbs';
  return 'fat';
}

export const QUANTITY_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

type MacroProportions = {protein: number; carbs: number; fat: number};

// Proporção calórica de cada macro dentro de um conjunto de gramas (via
// Atwater: proteína/carbo 4 kcal/g, gordura 9 kcal/g). Usada só para
// descrever a composição real de um alimento/receita (que é medido em
// gramas), não para o "quanto falta" da meta.
function macroProportions(amounts: {protein: number; carbs: number; fat: number}): MacroProportions {
  const proteinKcal = amounts.protein * 4;
  const carbsKcal = amounts.carbs * 4;
  const fatKcal = amounts.fat * 9;
  const total = proteinKcal + carbsKcal + fatKcal;
  if (total <= 0) return {protein: 0, carbs: 0, fat: 0};
  return {protein: proteinKcal / total, carbs: carbsKcal / total, fat: fatKcal / total};
}

// Normaliza valores (ex: percentuais de meta restante) para que somem 1,
// sem nenhum peso calórico — usado pro "remaining", que já vem como
// percentual de cada macro, não em gramas (aplicar Atwater aqui inflaria a
// gordura artificialmente, já que seu fator é 9 contra 4 dos outros).
function normalizeProportions(values: {protein: number; carbs: number; fat: number}): MacroProportions {
  const total = values.protein + values.carbs + values.fat;
  if (total <= 0) return {protein: 0, carbs: 0, fat: 0};
  return {protein: values.protein / total, carbs: values.carbs / total, fat: values.fat / total};
}

// "Score de encaixe" (0 a 1): quão parecida é a composição de um
// alimento/receita com o que ainda falta pra bater a meta do dia. Quanto
// mais alto, melhor esse item ajuda a equilibrar o que está faltando —
// usado pra ordenar/destacar as melhores sugestões.
export function fitScore(
  item: {protein: number; carbs: number; fat: number},
  remaining: {protein: number; carbs: number; fat: number},
): number {
  const need = normalizeProportions(remaining);
  const has = macroProportions(item);
  return need.protein * has.protein + need.carbs * has.carbs + need.fat * has.fat;
}

// Pesos por período de refeição (o mesmo período escolhido pelo usuário nos
// chips da tela), pra recomendação favorecer bons hábitos alimentares além
// de só "o que falta pra meta". Segue a lógica de distribuição de macros ao
// longo do dia comum na nutrição esportiva (linha ISSN, já usada no cálculo
// de TDEE do app): de manhã o corpo aproveita melhor carboidrato e proteína
// pra ter energia pro dia, evitando gordura pesada em jejum; o almoço é a
// refeição mais completa e balanceada; à tarde sustenta energia sem pesar; e
// à noite/jantar pesa a mão em proteína e alivia carboidrato e gordura, pra
// não pesar a digestão perto de dormir.
export type MealPeriod = 'manha' | 'almoco' | 'tarde' | 'noite' | 'avulso';

// Metadados dos períodos de refeição — fonte única de verdade, reutilizada por
// Diário, Scanner e Planejamento (antes cada tela redeclarava esses literais).
// MEAL_PERIODS: ordem canônica (com "avulso"). FIXED_MEAL_PERIODS: só os
// períodos "de verdade" (usado pra ranquear o período com menos consumo).
// MEAL_PERIOD_LABELS: rótulo de exibição. MEAL_PERIOD_OPTIONS: lista {key,label}
// pronta para os chips de seleção de período.
export const MEAL_PERIODS: MealPeriod[] = ['manha', 'almoco', 'tarde', 'noite', 'avulso'];
export const FIXED_MEAL_PERIODS: MealPeriod[] = ['manha', 'almoco', 'tarde', 'noite'];
export const MEAL_PERIOD_LABELS: Record<MealPeriod, string> = {
  manha: 'Manhã',
  almoco: 'Almoço',
  tarde: 'Tarde',
  noite: 'Noite',
  avulso: 'Avulso',
};
export const MEAL_PERIOD_OPTIONS: {key: MealPeriod; label: string}[] = MEAL_PERIODS.map(
  key => ({key, label: MEAL_PERIOD_LABELS[key]}),
);

export function getMacroTimeWeights(period: MealPeriod): MacroProportions {
  if (period === 'manha') {
    return {protein: 1.15, carbs: 1.15, fat: 0.75};
  }
  if (period === 'almoco') {
    return {protein: 1.05, carbs: 1.1, fat: 1.0};
  }
  if (period === 'tarde') {
    return {protein: 1.1, carbs: 1.0, fat: 0.9};
  }
  if (period === 'noite') {
    return {protein: 1.2, carbs: 0.8, fat: 0.8};
  }
  // Avulso: fora do padrão de refeições, sem viés adicional
  return {protein: 1.0, carbs: 1.0, fat: 1.0};
}

// Bônus/penalidade de tradição alimentar: alimentos com um período comum no
// Brasil (ex: arroz e feijão no almoço/janta, pão e tapioca de manhã) ganham
// um pequeno empurrão no score quando batem com o período selecionado, e uma
// leve penalidade quando não batem — sem excluir nada, só desempatando a
// favor do que é culturalmente esperado naquele horário. Alimentos "staple"
// (base do período, ex: ovo/pão/tapioca de manhã) ganham um empurrão maior
// ainda, pra tenderem a aparecer acima dos demais do mesmo período. Alimentos
// sem período comum definido (frutas, castanhas etc) ficam neutros.
export function getPeriodFitWeight(
  commonPeriods: MealPeriod[] | undefined,
  period: MealPeriod,
  staple?: boolean,
): number {
  if (!commonPeriods || commonPeriods.length === 0) return 1.0;
  if (!commonPeriods.includes(period)) return 0.85;
  return staple ? 1.4 : 1.15;
}

// Aplica os pesos de horário sobre o "quanto falta" de cada macro, antes de
// normalizar em fitScore — não muda a escala, só a importância relativa.
export function applyTimeWeights(
  remaining: {protein: number; carbs: number; fat: number},
  weights: MacroProportions,
): MacroProportions {
  return {
    protein: remaining.protein * weights.protein,
    carbs: remaining.carbs * weights.carbs,
    fat: remaining.fat * weights.fat,
  };
}