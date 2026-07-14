// Cálculo de TDEE e macros — extraído de TdeeScreen.tsx para ser reutilizado
// entre AboutYouScreen (coleta os dados) e TdeeScreen (só exibe o resultado
// calculado a partir deles). Fórmula de Mifflin-St Jeor (placeholder, a ser
// revisada depois).
import {KCAL_PER_GRAM} from './foodMath';

export const ACTIVITY_LEVELS = [
  {
    key: 'sedentary',
    label: 'Sedentário',
    multiplier: 1.2,
    description: 'Pouco ou nenhum exercício, rotina sentada no trabalho',
  },
  {
    key: 'light',
    label: 'Leve',
    multiplier: 1.375,
    description: 'Exercício leve 1 a 3 dias por semana',
  },
  {
    key: 'moderate',
    label: 'Moderado',
    multiplier: 1.55,
    description: 'Exercício moderado 3 a 5 dias por semana',
  },
  {
    key: 'active',
    label: 'Ativo',
    multiplier: 1.725,
    description: 'Exercício intenso 6 a 7 dias por semana',
  },
  {
    key: 'very_active',
    label: 'Muito ativo',
    multiplier: 1.9,
    description: 'Exercício muito intenso, treino 2x por dia ou trabalho físico pesado',
  },
] as const;

export const OBJECTIVES = [
  {key: 'lose', label: 'Emagrecer', offset: -500},
  {key: 'maintain', label: 'Manter', offset: 0},
  {key: 'gain', label: 'Ganhar massa', offset: 500},
] as const;

export type ActivityKey = (typeof ACTIVITY_LEVELS)[number]['key'];
export type ObjectiveKey = (typeof OBJECTIVES)[number]['key'];
export type Gender = 'male' | 'female';

// Dados coletados em "Sobre você" — usados tanto pelo cálculo automático
// quanto (o peso) pela escolha manual de macros, pra sempre alimentar a meta
// de água (35 ml/kg) independente do caminho escolhido depois.
export type AboutYouData = {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  activityKey: ActivityKey;
  objectiveKey: ObjectiveKey;
};

// Divisão de macros por peso corporal (g/kg), seguindo a faixa recomendada
// pela ISSN (International Society of Sports Nutrition):
// - Proteína: 1,4–2,2 g/kg/dia (mais alta em déficit, pra preservar massa magra)
// - Gordura: ~0,8–1 g/kg/dia (piso pra não prejudicar produção hormonal)
// - Carboidrato: preenche o restante das calorias, não é definido por g/kg
const PROTEIN_G_PER_KG: Record<ObjectiveKey, number> = {
  lose: 2.2,
  maintain: 1.8,
  gain: 1.8,
};
const FAT_G_PER_KG = 1.0;

export type TdeeGoals = {
  totalCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function computeTdeeGoals(data: AboutYouData): TdeeGoals {
  const {heightCm, weightKg, age, gender, activityKey, objectiveKey} = data;

  const bmr =
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const activity = ACTIVITY_LEVELS.find(a => a.key === activityKey)!;
  const objective = OBJECTIVES.find(o => o.key === objectiveKey)!;

  const totalCalories = Math.round(bmr * activity.multiplier + objective.offset);

  const proteinG = Math.round(weightKg * (PROTEIN_G_PER_KG[objectiveKey] ?? 1.8));
  const fatG = Math.round(weightKg * FAT_G_PER_KG);
  const proteinKcal = proteinG * KCAL_PER_GRAM.protein;
  const fatKcal = fatG * KCAL_PER_GRAM.fat;
  const carbsG = Math.max(0, Math.round((totalCalories - proteinKcal - fatKcal) / KCAL_PER_GRAM.carbs));

  return {totalCalories, proteinG, carbsG, fatG};
}
