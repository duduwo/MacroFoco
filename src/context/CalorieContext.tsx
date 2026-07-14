import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {todayKey} from '../dateUtils';
import type {MealPeriod} from '../foodMath';
import {scaleMacros} from '../foodMath';
import {
  loadPlannedItems,
  savePlannedItems,
  type PlannedByDate,
  type PlannedItem,
  type PlannedSource,
} from '../data/plannedItemsStorage';
import {resolveSourceBase} from '../data/planningResolvers';
import type {Food} from '../data/foodCatalogStorage';
import type {Recipe} from '../data/recipes';

export type MacroGoals = {
  protein: number;
  carbs: number;
  fat: number;
};

// Período do dia em que a refeição foi registrada. O tipo canônico vive em
// foodMath (perto da lógica de períodos); é reexportado aqui porque as telas
// costumam importá-lo a partir do contexto.
export type {MealPeriod};

export type ConsumedFood = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  period: MealPeriod;
};

// Alimentos consumidos, agrupados por data (chave 'YYYY-MM-DD').
export type FoodsByDate = Record<string, ConsumedFood[]>;

export type {PlannedByDate, PlannedItem, PlannedSource};

type PlannedResolution =
  | {status: 'skipped'}
  | {
      status: 'done' | 'done_modified';
      food: {name: string; calories: number; protein: number; carbs: number; fat: number};
      period: MealPeriod;
    };

// Sessão ativa de "Agendar nesse dia" (QuickScheduleModal): define só a
// forma do dia (horários + tipo de cada um) -- a escolha do item em si
// acontece nas abas Alimentos/Receitas de Organização, consumindo um slot
// por vez, na ordem em que os horários foram marcados (ver AI_CONTEXT.md --
// Organização / Agendamento).
export type QuickScheduleSlot = {time: string; period: MealPeriod; type: 'food' | 'recipe'};
export type ActiveQuickSchedule = {dateKey: string; slots: QuickScheduleSlot[]; currentIndex: number} | null;

type CalorieContextType = {
  dailyGoal: number | null;
  setDailyGoal: (value: number) => void;
  macroGoals: MacroGoals | null;
  setMacroGoals: (value: MacroGoals) => void;

  // Peso corporal (kg) informado no TDEE. Persistido porque a meta de água é
  // calculada a partir dele (35 ml/kg/dia); antes era descartado após o cálculo
  // de calorias.
  weightKg: number | null;
  setWeightKg: (value: number) => void;

  selectedDate: string;
  setSelectedDate: (dateKey: string) => void;

  // Água registrada por data (em ml). Fica fora de foodsByDate de propósito:
  // água não tem macro nenhum, então entra como um contador simples com um
  // template de +200 ml no Diário, sem passar pelo fluxo de alimentos.
  waterByDate: Record<string, number>;
  waterConsumed: number; // ml do selectedDate (atalho)
  waterGoalMl: number; // meta calculada (35 ml/kg, com fallback)
  addWater: (ml: number) => void; // ml negativo desfaz; nunca fica abaixo de 0

  foodsByDate: FoodsByDate;
  consumedFoods: ConsumedFood[]; // alimentos do selectedDate (atalho)
  addFood: (food: Omit<ConsumedFood, 'id'>) => void;
  addFoodToDate: (dateKey: string, food: Omit<ConsumedFood, 'id'>) => string;
  removeLastFood: () => void;
  removeFood: (id: string) => void;
  removeFoodFromDate: (dateKey: string, id: string) => void;
  clearFoods: () => void;
  totalConsumed: number;
  macrosConsumed: MacroGoals;

  // Planejamento
  plannedByDate: PlannedByDate;
  addPlannedItem: (item: Omit<PlannedItem, 'id' | 'status' | 'createdAt'>) => PlannedItem;
  updatePlannedItem: (dateKey: string, id: string, updates: Partial<PlannedItem>) => void;
  removePlannedItem: (dateKey: string, id: string) => void;
  clearPlannedForDate: (dateKey: string) => void;
  clearPlannedForDates: (dateKeys: string[]) => void;
  resolvePlannedItem: (dateKey: string, id: string, resolution: PlannedResolution) => void;
  unresolvePlannedItem: (dateKey: string, id: string) => void;

  // Recalcula, em todas as datas, os itens já registrados no Diário
  // ('done'/'done_modified') cuja origem é a receita recipeId -- usado
  // quando uma receita própria é editada (ingredientes/porções mudam), pra
  // que os itens já lançados deixem de mostrar um valor congelado do
  // momento em que foram adicionados. Mantém o quantityMultiplier e o
  // ingredientQuantities de cada item (a "porção" que a pessoa escolheu
  // continua a mesma) -- só os macros por unidade da receita são
  // atualizados a partir da definição/catálogo atuais.
  recalculateRecipeItems: (recipeId: string, catalog: Food[], userFoods: Food[], userRecipes: Recipe[]) => void;

  // Toda adição instantânea (não agendada) também vira um PlannedItem, já
  // nascendo "Feito" -- é o que unifica o Diário/Alimentação Programada numa
  // lista só, em vez de duas fontes de dado (ver AI_CONTEXT.md -- Organização
  // / Unificação com o Diário). Grava o ConsumedFood correspondente do mesmo
  // jeito que resolvePlannedItem faz pra um item agendado marcado como
  // Feito, então macrosConsumed continua vindo só de foodsByDate -- sem
  // contar nada em dobro.
  addImmediatePlannedItem: (
    item: {dateKey: string; time: string; period: MealPeriod; quantityMultiplier: number; source: PlannedSource},
    food: {name: string; calories: number; protein: number; carbs: number; fat: number},
  ) => PlannedItem;

  // Sessão ativa de "Agendar nesse dia" -- compartilhada entre as abas
  // Alimentos e Receitas de Organização (por isso mora aqui, e não no state
  // local de uma tela: as abas trocam via renderização condicional, o que
  // desmontaria um state local a cada troca de aba).
  activeQuickSchedule: ActiveQuickSchedule;
  startQuickSchedule: (dateKey: string, slots: QuickScheduleSlot[]) => void;
  advanceQuickSchedule: () => void;
  cancelQuickSchedule: () => void;

  hydrated: boolean;
};

const STORAGE_KEYS = {
  dailyGoal: 'macrofoco:dailyGoal',
  macroGoals: 'macrofoco:macroGoals',
  foodsByDate: 'macrofoco:foodsByDate',
  weightKg: 'macrofoco:weightKg',
  waterByDate: 'macrofoco:waterByDate',
};

// Meta de água: 35 ml por kg de peso/dia (recomendação clínica mais aceita).
// Sem peso salvo (usuários que configuraram antes dessa versão), cai pra
// ~1 ml por kcal da meta calórica — heurística reconhecida (IOM/NRC). Sem
// nenhum dos dois, um padrão de 2000 ml. Arredondado pra múltiplo de 50 ml.
const ML_PER_KG = 35;
const DEFAULT_WATER_GOAL_ML = 2000;
const roundTo50 = (n: number) => Math.round(n / 50) * 50;
const computeWaterGoalMl = (weightKg: number | null, dailyGoal: number | null): number => {
  if (weightKg && weightKg > 0) return roundTo50(weightKg * ML_PER_KG);
  if (dailyGoal && dailyGoal > 0) return roundTo50(dailyGoal);
  return DEFAULT_WATER_GOAL_ML;
};

const CalorieContext = createContext<CalorieContextType | undefined>(undefined);

// Contador em módulo, somado ao timestamp: Date.now() sozinho pode repetir
// quando dois alimentos são adicionados no mesmo milissegundo, gerando id
// duplicado (quebra keys de lista e o match do removeFood).
let idCounter = 0;
const generateFoodId = () => `${Date.now()}-${idCounter++}`;

let plannedIdCounter = 0;
const generatePlannedId = () => `planned-${Date.now()}-${plannedIdCounter++}`;

// Repara dados antigos salvos antes desse fix: se dois alimentos persistidos
// têm o mesmo id (ex: adicionados no mesmo milissegundo), troca o id dos
// repetidos por um novo garantidamente único, senão a duplicata volta a
// cada abertura do app mesmo com o addFood já corrigido.
const repairDuplicateIds = (data: FoodsByDate): FoodsByDate => {
  const seenIds = new Set<string>();
  const repaired: FoodsByDate = {};
  for (const date of Object.keys(data)) {
    repaired[date] = data[date].map(food => {
      if (seenIds.has(food.id)) {
        return {...food, id: generateFoodId()};
      }
      seenIds.add(food.id);
      return food;
    });
  }
  return repaired;
};

export function CalorieProvider({children}: {children: React.ReactNode}) {
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
  const [macroGoals, setMacroGoals] = useState<MacroGoals | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [foodsByDate, setFoodsByDate] = useState<FoodsByDate>({});
  const [waterByDate, setWaterByDate] = useState<Record<string, number>>({});
  const [plannedByDate, setPlannedByDate] = useState<PlannedByDate>({});
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [activeQuickSchedule, setActiveQuickSchedule] = useState<ActiveQuickSchedule>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let settled = false;

    // Timeout de segurança: se o AsyncStorage nunca responder, libera o app
    // mesmo assim depois de 3s, só sem os dados salvos, em veze de travar.
    const safetyTimeout = setTimeout(() => {
      if (!settled) {
        console.warn(
          'MacroFoco: AsyncStorage não respondeu em 3s, liberando o app sem dados salvos.',
        );
        settled = true;
        setHydrated(true);
      }
    }, 3000);

    (async () => {
      try {
        const [savedGoal, savedMacros, savedWeight, savedFoodsByDate, savedWaterByDate, savedPlannedByDate] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.dailyGoal),
            AsyncStorage.getItem(STORAGE_KEYS.macroGoals),
            AsyncStorage.getItem(STORAGE_KEYS.weightKg),
            AsyncStorage.getItem(STORAGE_KEYS.foodsByDate),
            AsyncStorage.getItem(STORAGE_KEYS.waterByDate),
            loadPlannedItems(),
          ]);
        if (savedGoal !== null) setDailyGoal(JSON.parse(savedGoal));
        if (savedMacros !== null) setMacroGoals(JSON.parse(savedMacros));
        if (savedWeight !== null) setWeightKg(JSON.parse(savedWeight));
        if (savedFoodsByDate !== null) setFoodsByDate(repairDuplicateIds(JSON.parse(savedFoodsByDate)));
        if (savedWaterByDate !== null) setWaterByDate(JSON.parse(savedWaterByDate));
        setPlannedByDate(savedPlannedByDate);
      } catch (e) {
        console.warn('Falha ao carregar dados salvos do MacroFoco:', e);
      } finally {
        if (!settled) {
          settled = true;
          clearTimeout(safetyTimeout);
          setHydrated(true);
        }
      }
    })();

    return () => clearTimeout(safetyTimeout);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.dailyGoal, JSON.stringify(dailyGoal)).catch(() => {});
  }, [dailyGoal, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.macroGoals, JSON.stringify(macroGoals)).catch(() => {});
  }, [macroGoals, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.weightKg, JSON.stringify(weightKg)).catch(() => {});
  }, [weightKg, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEYS.foodsByDate,
      JSON.stringify(foodsByDate),
    ).catch(() => {});
  }, [foodsByDate, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.waterByDate, JSON.stringify(waterByDate)).catch(() => {});
  }, [waterByDate, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    savePlannedItems(plannedByDate);
  }, [plannedByDate, hydrated]);

  const addFoodToDate = (dateKey: string, food: Omit<ConsumedFood, 'id'>): string => {
    const id = generateFoodId();
    setFoodsByDate(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] ?? []), {id, ...food}],
    }));
    return id;
  };

  const addFood = (food: Omit<ConsumedFood, 'id'>) => {
    addFoodToDate(selectedDate, food);
  };

  const clearFoods = () => {
    setFoodsByDate(prev => ({...prev, [selectedDate]: []}));
  };

  // Soma ml ao selectedDate. ml negativo (botão "desfazer") subtrai, travado
  // em 0 pra nunca ficar negativo.
  const addWater = (ml: number) => {
    setWaterByDate(prev => {
      const next = Math.max(0, (prev[selectedDate] ?? 0) + ml);
      return {...prev, [selectedDate]: next};
    });
  };

  const removeLastFood = () => {
    setFoodsByDate(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] ?? []).slice(0, -1),
    }));
  };

  const removeFood = (id: string) => {
    removeFoodFromDate(selectedDate, id);
  };

  const removeFoodFromDate = (dateKeyStr: string, id: string) => {
    setFoodsByDate(prev => ({
      ...prev,
      [dateKeyStr]: (prev[dateKeyStr] ?? []).filter(f => f.id !== id),
    }));
  };

  const addPlannedItem = (item: Omit<PlannedItem, 'id' | 'status' | 'createdAt'>): PlannedItem => {
    const newItem: PlannedItem = {
      ...item,
      id: generatePlannedId(),
      status: 'pending',
      createdAt: Date.now(),
    };
    setPlannedByDate(prev => ({
      ...prev,
      [item.dateKey]: [...(prev[item.dateKey] ?? []), newItem],
    }));
    return newItem;
  };

  const updatePlannedItem = (dateKey: string, id: string, updates: Partial<PlannedItem>) => {
    setPlannedByDate(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).map(p => (p.id === id ? {...p, ...updates} : p)),
    }));
  };

  // Remove um item planejado. Se ele já estava resolvido ('done'/
  // 'done_modified'), tem uma entrada vinculada no Diário (linkedFoodId) --
  // sem removê-la junto, a comida ficava "órfã" contando pra sempre nos
  // totais do dia, mesmo com o item planejado já tendo sumido da lista (é
  // o mesmo cuidado que clearPlannedForDates já toma, só que pra 1 item).
  const removePlannedItem = (dateKey: string, id: string) => {
    const item = (plannedByDate[dateKey] ?? []).find(p => p.id === id);
    if (item?.linkedFoodId) {
      removeFoodFromDate(dateKey, item.linkedFoodId);
    }
    setPlannedByDate(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).filter(p => p.id !== id),
    }));
  };

  // Remove toda a programação (pendente ou já resolvida) de um dia. Itens
  // resolvidos ('done'/'done_modified') têm entrada vinculada no Diário
  // (linkedFoodId) -- removida junto pra não sobrar comida sem origem.
  const clearPlannedForDate = (dateKey: string) => {
    clearPlannedForDates([dateKey]);
  };

  // Mesma coisa que clearPlannedForDate, só que pra vários dias de uma vez
  // (seleção múltipla no calendário) -- feito num único setState por
  // coleção pra não disparar renders extras por dia.
  const clearPlannedForDates = (dateKeys: string[]) => {
    if (dateKeys.length === 0) return;

    const linkedFoodIdsByDate: Record<string, string[]> = {};
    dateKeys.forEach(dk => {
      const items = plannedByDate[dk] ?? [];
      linkedFoodIdsByDate[dk] = items.map(p => p.linkedFoodId).filter((id): id is string => !!id);
    });

    setFoodsByDate(prev => {
      const next = {...prev};
      dateKeys.forEach(dk => {
        const ids = linkedFoodIdsByDate[dk];
        if (ids.length > 0) {
          next[dk] = (next[dk] ?? []).filter(f => !ids.includes(f.id));
        }
      });
      return next;
    });

    setPlannedByDate(prev => {
      const next = {...prev};
      dateKeys.forEach(dk => {
        next[dk] = [];
      });
      return next;
    });
  };

  // Marca um item planejado como resolvido. Quando "done"/"done_modified",
  // joga o resultado pro diário daquele dia — é o elo entre Planejamento e
  // Diário. Quem calcula os macros finais (a partir de receita/catálogo/
  // alimento personalizado + multiplicador) é a tela, não o contexto.
  // Guarda o id do ConsumedFood criado (linkedFoodId) pra que
  // unresolvePlannedItem consiga desfazer removendo exatamente essa entrada.
  const resolvePlannedItem = (dateKey: string, id: string, resolution: PlannedResolution) => {
    if (resolution.status === 'skipped') {
      updatePlannedItem(dateKey, id, {
        status: 'skipped',
        resolvedAt: Date.now(),
      });
      return;
    }

    const linkedFoodId = addFoodToDate(dateKey, {
      name: resolution.food.name,
      calories: resolution.food.calories,
      protein: resolution.food.protein,
      carbs: resolution.food.carbs,
      fat: resolution.food.fat,
      period: resolution.period,
    });

    updatePlannedItem(dateKey, id, {
      status: resolution.status,
      resolvedAt: Date.now(),
      linkedFoodId,
      actualCalories: resolution.food.calories,
      actualProtein: resolution.food.protein,
      actualCarbs: resolution.food.carbs,
      actualFat: resolution.food.fat,
    });
  };

  // Desfaz uma resolução ('done'/'done_modified'/'skipped'): remove do
  // Diário a entrada que foi criada (se houver — 'skipped' não cria nenhuma)
  // e devolve o item planejado pro status 'pending', limpando os campos de
  // resolução. Com o item pendente de novo, o usuário pode marcar "Feito"
  // outra vez e o cálculo é refeito do zero (recalculado a partir da fonte
  // + multiplicador atuais, não reaproveita valores antigos).
  const unresolvePlannedItem = (dateKey: string, id: string) => {
    const item = (plannedByDate[dateKey] ?? []).find(p => p.id === id);
    if (!item) return;

    if (item.linkedFoodId) {
      removeFoodFromDate(dateKey, item.linkedFoodId);
    }

    updatePlannedItem(dateKey, id, {
      status: 'pending',
      resolvedAt: undefined,
      actualCalories: undefined,
      actualProtein: undefined,
      actualCarbs: undefined,
      actualFat: undefined,
      linkedFoodId: undefined,
    });
  };

  const recalculateRecipeItems = (
    recipeId: string,
    catalog: Food[],
    userFoods: Food[],
    userRecipes: Recipe[],
  ) => {
    // dateKey -> linkedFoodId -> novos valores, coletado enquanto os itens
    // planejados são percorridos, pra em seguida aplicar o mesmo recálculo
    // nas entradas correspondentes do Diário (foodsByDate) num único passo.
    const linkedFoodUpdates: Record<string, Record<string, {name: string} & MacroGoals & {calories: number}>> = {};

    setPlannedByDate(prev => {
      const next: PlannedByDate = {...prev};
      for (const dateKey of Object.keys(next)) {
        next[dateKey] = next[dateKey].map(item => {
          if (
            (item.source.kind !== 'recipeFixed' && item.source.kind !== 'recipeCustom') ||
            item.source.recipeId !== recipeId ||
            (item.status !== 'done' && item.status !== 'done_modified') ||
            !item.linkedFoodId
          ) {
            return item;
          }
          const base = resolveSourceBase(item.source, catalog, userFoods, userRecipes);
          if (!base) return item;
          const scaled = scaleMacros(base, item.quantityMultiplier);

          linkedFoodUpdates[dateKey] = linkedFoodUpdates[dateKey] ?? {};
          linkedFoodUpdates[dateKey][item.linkedFoodId] = {name: base.name, ...scaled};

          return {
            ...item,
            actualCalories: scaled.calories,
            actualProtein: scaled.protein,
            actualCarbs: scaled.carbs,
            actualFat: scaled.fat,
          };
        });
      }
      return next;
    });

    if (Object.keys(linkedFoodUpdates).length === 0) return;

    setFoodsByDate(prev => {
      const next: FoodsByDate = {...prev};
      for (const dateKey of Object.keys(linkedFoodUpdates)) {
        const patches = linkedFoodUpdates[dateKey];
        next[dateKey] = (next[dateKey] ?? []).map(food =>
          patches[food.id] ? {...food, ...patches[food.id]} : food,
        );
      }
      return next;
    });
  };

  const consumedFoods = foodsByDate[selectedDate] ?? [];
  const waterConsumed = waterByDate[selectedDate] ?? 0;
  const waterGoalMl = computeWaterGoalMl(weightKg, dailyGoal);

  // Ver comentário do tipo no CalorieContextType: mesma mecânica do ramo
  // "done" de resolvePlannedItem, só que sem passar pelo estado "pending" --
  // o item já nasce resolvido porque a adição foi instantânea.
  const addImmediatePlannedItem = (
    item: {dateKey: string; time: string; period: MealPeriod; quantityMultiplier: number; source: PlannedSource},
    food: {name: string; calories: number; protein: number; carbs: number; fat: number},
  ): PlannedItem => {
    const linkedFoodId = addFoodToDate(item.dateKey, {
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      period: item.period,
    });

    const newItem: PlannedItem = {
      ...item,
      id: generatePlannedId(),
      status: 'done',
      createdAt: Date.now(),
      resolvedAt: Date.now(),
      notifyOffsetMinutes: 0,
      actualCalories: food.calories,
      actualProtein: food.protein,
      actualCarbs: food.carbs,
      actualFat: food.fat,
      linkedFoodId,
    };
    setPlannedByDate(prev => ({
      ...prev,
      [item.dateKey]: [...(prev[item.dateKey] ?? []), newItem],
    }));
    return newItem;
  };

  const startQuickSchedule = (dateKey: string, slots: QuickScheduleSlot[]) => {
    setActiveQuickSchedule({dateKey, slots, currentIndex: 0});
  };

  // Avança pro próximo horário da sessão; fecha a sessão sozinha quando o
  // último slot é preenchido, sem precisar de uma tela chamar cancel.
  const advanceQuickSchedule = () => {
    setActiveQuickSchedule(prev => {
      if (!prev) return prev;
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.slots.length) return null;
      return {...prev, currentIndex: nextIndex};
    });
  };

  const cancelQuickSchedule = () => setActiveQuickSchedule(null);

  const totalConsumed = consumedFoods.reduce((sum, f) => sum + f.calories, 0);

  const macrosConsumed = consumedFoods.reduce(
    (acc, f) => ({
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    {protein: 0, carbs: 0, fat: 0},
  );

  return (
    <CalorieContext.Provider
      value={{
        dailyGoal,
        setDailyGoal,
        macroGoals,
        setMacroGoals,
        weightKg,
        setWeightKg,
        selectedDate,
        setSelectedDate,
        foodsByDate,
        consumedFoods,
        addFood,
        waterByDate,
        waterConsumed,
        waterGoalMl,
        addWater,
        addFoodToDate,
        removeLastFood,
        removeFood,
        removeFoodFromDate,
        clearFoods,
        totalConsumed,
        macrosConsumed,
        plannedByDate,
        addPlannedItem,
        updatePlannedItem,
        removePlannedItem,
        clearPlannedForDate,
        clearPlannedForDates,
        resolvePlannedItem,
        unresolvePlannedItem,
        recalculateRecipeItems,
        addImmediatePlannedItem,
        activeQuickSchedule,
        startQuickSchedule,
        advanceQuickSchedule,
        cancelQuickSchedule,
        hydrated,
      }}>
      {children}
    </CalorieContext.Provider>
  );
}

export function useCalorie() {
  const context = useContext(CalorieContext);
  if (!context) {
    throw new Error('useCalorie precisa ser usado dentro de CalorieProvider');
  }
  return context;
}