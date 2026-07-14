import AsyncStorage from '@react-native-async-storage/async-storage';
import {loadDiaryMascot, saveDiaryMascot} from '../src/data/mascotStorage';

describe('mascotStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('usa Foquinho como padrão', async () => {
    await expect(loadDiaryMascot()).resolves.toBe('foquinho');
  });

  it('salva e restaura Mudinha ou Panelito', async () => {
    await saveDiaryMascot('mudinha');
    await expect(loadDiaryMascot()).resolves.toBe('mudinha');

    await saveDiaryMascot('panelito');
    await expect(loadDiaryMascot()).resolves.toBe('panelito');
  });
});
