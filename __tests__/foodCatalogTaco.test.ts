import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  findCatalogFoodByName,
  loadFoodCatalog,
} from '../src/data/foodCatalogStorage';

describe('itens do catálogo alinhados à TACO', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('inclui maionese, queijo minas frescal e alface americana', async () => {
    const catalog = await loadFoodCatalog();

    expect(findCatalogFoodByName(catalog, 'Maionese tradicional com ovos')).toMatchObject({
      dosage: '1 colher de sopa (15g)',
      calories: 45,
      protein: 0.1,
      carbs: 1.2,
      fat: 4.6,
    });
    expect(findCatalogFoodByName(catalog, 'Queijo minas frescal')).toMatchObject({
      calories: 79,
      protein: 5.2,
      carbs: 1,
      fat: 6.1,
    });
    expect(findCatalogFoodByName(catalog, 'Alface americana')).toMatchObject({
      calories: 9,
      protein: 0.6,
      carbs: 1.7,
      fat: 0.1,
    });
  });

  it('mantém os nomes antigos como aliases para dados já salvos', async () => {
    const catalog = await loadFoodCatalog();

    expect(findCatalogFoodByName(catalog, 'Queijo minas')?.name).toBe('Queijo minas frescal');
    expect(findCatalogFoodByName(catalog, 'Alface')?.name).toBe('Alface americana');
  });
});
