import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Recipe} from './recipes';

// Receitas criadas pelo próprio usuário, guardadas separadas das receitas
// prontas (RECIPES em recipes.ts). Usam o mesmo formato de Recipe — só o id
// tem prefixo "user-" pra não colidir com os ids das receitas prontas (r1, r2...).

const STORAGE_KEY = 'macrofoco:userRecipes';

export async function loadUserRecipes(): Promise<Recipe[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Recipe[]) : [];
  } catch (e) {
    console.warn('Falha ao carregar receitas do usuário.', e);
    return [];
  }
}

export async function saveUserRecipes(recipes: Recipe[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch (e) {
    console.warn('Falha ao salvar receitas do usuário.', e);
  }
}
