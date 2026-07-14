import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AboutYouData} from '../tdeeMath';

// Guarda a última resposta de "Sobre você" (altura/peso/idade/sexo/
// atividade/objetivo), pra "Suas informações" (Perfil) conseguir reabrir o
// formulário já preenchido em vez de em branco. Sem isso, cada visita
// perdia tudo que a pessoa tinha respondido antes.
const STORAGE_KEY = 'macrofoco:aboutYou';

export async function loadAboutYou(): Promise<AboutYouData | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AboutYouData) : null;
  } catch (e) {
    console.warn('Falha ao carregar "Sobre você" do MacroFoco:', e);
    return null;
  }
}

export async function saveAboutYou(data: AboutYouData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Falha ao salvar "Sobre você" do MacroFoco:', e);
  }
}
