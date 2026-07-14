import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Food} from './foodCatalogStorage';

// Alimentos personalizados criados pelo usuário (ex: escaneados via código de
// barras), guardados separados do catálogo semeado (foodCatalogStorage) pra
// não se perderem quando o catálogo padrão for atualizado (CATALOG_VERSION).
// Mesmo formato de Food usado no catálogo.

const STORAGE_KEY = 'macrofoco:userFoods';

export async function loadUserFoods(): Promise<Food[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Food[]) : [];
  } catch (e) {
    console.warn('Falha ao carregar alimentos personalizados.', e);
    return [];
  }
}

export async function saveUserFoods(foods: Food[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
  } catch (e) {
    console.warn('Falha ao salvar alimentos personalizados.', e);
  }
}
