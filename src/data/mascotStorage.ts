import AsyncStorage from '@react-native-async-storage/async-storage';

export type DiaryMascotId = 'foquinho' | 'mudinha' | 'panelito';

export const DIARY_MASCOT_NAMES: Record<DiaryMascotId, string> = {
  foquinho: 'Foquinho',
  mudinha: 'Mudinha',
  panelito: 'Panelito',
};

// Cor de identidade usada como detalhe discreto no Diário. Há uma versão
// mais clara para manter contraste no tema escuro sem mudar a personalidade
// de cada pet.
export const DIARY_MASCOT_ACCENTS: Record<
  DiaryMascotId,
  {light: string; dark: string}
> = {
  foquinho: {light: '#5B8AA6', dark: '#7BA8C4'},
  mudinha: {light: '#6E8F6E', dark: '#8FB08A'},
  panelito: {light: '#C6603E', dark: '#E0825E'},
};

const STORAGE_KEY = 'macrofoco:diaryMascot';

export async function loadDiaryMascot(): Promise<DiaryMascotId> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'mudinha' || stored === 'panelito' || stored === 'foquinho') return stored;
  } catch (e) {
    console.warn('Falha ao carregar o mascote do Diário:', e);
  }
  return 'foquinho';
}

export async function saveDiaryMascot(mascot: DiaryMascotId): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mascot);
  } catch (e) {
    console.warn('Falha ao salvar o mascote do Diário:', e);
  }
}

// Mensagens dos lembretes diários (Perfil), uma pro horário do almoço e
// outra pro jantar — escritas na "voz" de cada mascote pra ficarem
// consistentes com a personalidade já estabelecida em FoquinhoStatesModal.
export const DIARY_MASCOT_REMINDER_MESSAGES: Record<
  DiaryMascotId,
  {midday: string; evening: string}
> = {
  foquinho: {
    midday: 'Foquinho está esperando seu almoço pra continuar crescendo 💧',
    evening: 'Não deixe Foquinho dormir com fome — registre o jantar 🌙',
  },
  mudinha: {
    midday: 'Sua Mudinha precisa de nutrientes! Registre o almoço 🌱',
    evening: 'Hora de regar a Mudinha — não esqueça o jantar 🌿',
  },
  panelito: {
    midday: 'Panelito está esquentando o almoço, vem registrar! 🍳',
    evening: 'Panelito não quer esfriar sozinho — registre o jantar 🔥',
  },
};

export function getDiaryMascotReminderMessages(mascot: DiaryMascotId): [string, string] {
  const {midday, evening} = DIARY_MASCOT_REMINDER_MESSAGES[mascot];
  return [midday, evening];
}
