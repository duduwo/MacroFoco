import AsyncStorage from '@react-native-async-storage/async-storage';
import type {MealPeriod} from '../foodMath';

// De onde vem o item planejado — cada "kind" carrega só os campos que fazem
// sentido pra aquela origem. Alimentos (catálogo ou personalizados) são
// referenciados por "name" porque Food não tem id — mesmo padrão já usado
// em recipes.ts (ingredientNames bate por nome exato).
export type PlannedSource =
  // ingredientQuantities: multiplicador de cada ingrediente da receita, na
  // mesma ordem de recipe.ingredientNames (ex: 2x banana). Opcional para
  // compatibilidade com itens salvos antes desse campo existir — ausente,
  // vale 1x em todos. Sem isso, o ajuste de porção feito em Receitas se
  // perdia ao resolver o item mais tarde (voltava pra 1x em cada ingrediente).
  | {kind: 'recipeFixed'; recipeId: string; ingredientQuantities?: number[]}
  | {kind: 'recipeCustom'; recipeId: string; ingredientQuantities?: number[]}
  | {kind: 'foodCatalog'; foodName: string}
  | {kind: 'foodCustom'; foodName: string}
  | {kind: 'manual'; name: string; calories: number; protein: number; carbs: number; fat: number};

type PlannedStatus = 'pending' | 'done' | 'done_modified' | 'skipped';

export type PlannedItem = {
  id: string;
  dateKey: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  period: MealPeriod;
  quantityMultiplier: number;
  source: PlannedSource;
  status: PlannedStatus;
  notificationId?: string;
  notifyOffsetMinutes: 0 | 5;
  createdAt: number;
  resolvedAt?: number;
  actualCalories?: number;
  actualProtein?: number;
  actualCarbs?: number;
  actualFat?: number;
  // Id do ConsumedFood criado no Diário quando este item foi resolvido como
  // 'done'/'done_modified' (via addFoodToDate). Usado pra "Desfazer" remover
  // exatamente essa entrada do Diário, sem afetar outros alimentos do dia.
  linkedFoodId?: string;
};

export type PlannedByDate = Record<string, PlannedItem[]>;

const STORAGE_KEY = 'macrofoco:plannedItems';

export async function loadPlannedItems(): Promise<PlannedByDate> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as PlannedByDate) : {};
  } catch (e) {
    console.warn('Falha ao carregar itens planejados do MacroFoco:', e);
    return {};
  }
}

export async function savePlannedItems(data: PlannedByDate): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Falha ao salvar itens planejados do MacroFoco:', e);
  }
}