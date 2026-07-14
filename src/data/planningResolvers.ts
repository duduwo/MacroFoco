// Lógica de resolução do Planejamento — movida de PlanningSection.tsx durante
// a Grande Refatoração de UX. Centraliza tudo que ScheduledAgendaSection
// (dentro do Diário) e ScheduleSection (dentro de Organização > Programação)
// precisam para transformar um PlannedItem em macros reais, sem duplicar a
// lógica entre os dois lugares.
import type {PlannedSource} from './plannedItemsStorage';
import {findCatalogFoodByName, type Food} from './foodCatalogStorage';
import {RECIPES, type Recipe} from './recipes';
import {scaleMacros} from '../foodMath';
import type {MealPeriod} from '../foodMath';

export type BaseMacros = {name: string; emoji: string; calories: number; protein: number; carbs: number; fat: number};

function findFood(name: string, catalog: Food[], userFoods: Food[]): Food | undefined {
  return catalog.find(f => f.name === name)
    ?? userFoods.find(f => f.name === name)
    ?? findCatalogFoodByName(catalog, name);
}

function findRecipe(id: string, userRecipes: Recipe[]): Recipe | undefined {
  return RECIPES.find(r => r.id === id) ?? userRecipes.find(r => r.id === id);
}

// ingredientQuantities: multiplicador de cada ingrediente (mesma ordem de
// recipe.ingredientNames) — ausente ou index sem valor cai em 1x. É o que
// faz o ajuste de porção feito em Receitas (ex: 2x banana) valer de verdade
// quando o item é resolvido no Diário, e não só na prévia da tela.
function recipeBaseMacros(
  recipe: Recipe,
  catalog: Food[],
  userFoods: Food[],
  ingredientQuantities?: number[],
): BaseMacros {
  const totals = recipe.ingredientNames.reduce(
    (acc, name, index) => {
      const food = findFood(name, catalog, userFoods);
      if (!food) return acc;
      const scaled = scaleMacros(food, ingredientQuantities?.[index] ?? 1);
      return {
        calories: acc.calories + scaled.calories,
        protein: acc.protein + scaled.protein,
        carbs: acc.carbs + scaled.carbs,
        fat: acc.fat + scaled.fat,
      };
    },
    {calories: 0, protein: 0, carbs: 0, fat: 0},
  );
  return {name: recipe.name, emoji: recipe.emoji, ...totals};
}

// Resolve a origem de um item planejado nos valores base (1x), procurando
// nos catálogos/receitas carregados. Retorna null se a origem não existe
// mais (ex: alimento personalizado apagado depois de agendado).
export function resolveSourceBase(
  source: PlannedSource,
  catalog: Food[],
  userFoods: Food[],
  userRecipes: Recipe[],
): BaseMacros | null {
  if (source.kind === 'manual') {
    return {
      name: source.name,
      emoji: '📝',
      calories: source.calories,
      protein: source.protein,
      carbs: source.carbs,
      fat: source.fat,
    };
  }
  if (source.kind === 'foodCatalog' || source.kind === 'foodCustom') {
    const food = findFood(source.foodName, catalog, userFoods);
    if (!food) return null;
    return {name: food.name, emoji: food.emoji, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat};
  }
  const recipe = findRecipe(source.recipeId, userRecipes);
  if (!recipe) return null;
  return recipeBaseMacros(recipe, catalog, userFoods, source.ingredientQuantities);
}

export function toTimestamp(dateKeyStr: string, time: string): number {
  const [y, m, d] = dateKeyStr.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}

// No Planejamento não existe "Avulso": aqui é o próprio usuário que está
// definindo o horário na mão, então sempre existe um período de fato.
export type PlanningPeriod = 'manha' | 'almoco' | 'tarde' | 'noite';

const PLANNING_PERIOD_ORDER: PlanningPeriod[] = ['manha', 'almoco', 'tarde', 'noite'];

export const PLANNING_PERIOD_OPTIONS: {key: PlanningPeriod; label: string}[] = [
  {key: 'manha', label: 'Manhã'},
  {key: 'almoco', label: 'Almoço'},
  {key: 'tarde', label: 'Tarde'},
  {key: 'noite', label: 'Noite'},
];

// Os ícones de período agora vivem em MealPeriodIcons.tsx (SVG de linha) —
// o antigo mapa de emoji (PERIOD_EMOJI) foi removido.

// Faixa de horário de cada período — a grade de horários só mostra slots
// dentro dessa faixa, pra não virar uma lista de 36 horários (6h-23h).
const PERIOD_TIME_RANGE: Record<PlanningPeriod, {startHour: number; endHour: number}> = {
  manha: {startHour: 6, endHour: 11},
  almoco: {startHour: 11, endHour: 14},
  tarde: {startHour: 14, endHour: 18},
  noite: {startHour: 18, endHour: 22},
};

// Horário padrão sugerido ao tocar num período na grade 2x2 do passo 1
// (o relógio grande pula direto pra esse horário).
export const DEFAULT_PERIOD_TIME: Record<PlanningPeriod, string> = {
  manha: '06:00',
  almoco: '11:00',
  tarde: '14:00',
  noite: '18:00',
};

// Intervalo (em minutos) pulado pelas setas do relógio grande.
export const TIME_STEP_OPTIONS: readonly number[] = [15, 30, 60];

// Pra ordenar receitas priorizando o que é típico do período escolhido
// (ex: período "manhã" prioriza receitas de mealType "cafe").
export const PERIOD_TO_MEALTYPE: Record<PlanningPeriod, 'cafe' | 'almoco' | 'lanche' | 'janta'> = {
  manha: 'cafe',
  almoco: 'almoco',
  tarde: 'lanche',
  noite: 'janta',
};

export const STATUS_LABELS: Record<'done' | 'done_modified' | 'skipped', string> = {
  done: 'Feito ✓',
  done_modified: 'Feito (ajustado) ✓',
  skipped: 'Pulado',
};

// Deriva automaticamente o período de um horário, com base nas faixas de
// PERIOD_TIME_RANGE (sem sobreposição: o limite pertence ao período
// seguinte). Horários fora de todas as faixas (madrugada) caem em "noite".
export function periodForTime(time: string): PlanningPeriod {
  const [hh, mm] = time.split(':').map(Number);
  const minutes = hh * 60 + mm;
  for (const period of PLANNING_PERIOD_ORDER) {
    const {startHour, endHour} = PERIOD_TIME_RANGE[period];
    if (minutes >= startHour * 60 && minutes < endHour * 60) return period;
  }
  return 'noite';
}


// Grade de 7 colunas do mês, com null nas pontas pra alinhar o dia 1 no dia
// da semana certo (padrão de calendário tipo "grade escolar").
export function getMonthGridDays(monthDate: Date): (Date | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export type {MealPeriod};
