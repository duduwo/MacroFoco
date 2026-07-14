// Receitas prontas: cada uma referencia alimentos já existentes no catálogo
// (por nome exato) — os totais de kcal/macros são somados em tempo de
// execução a partir dos valores reais do catálogo, não digitados na mão.
export type MealType = 'cafe' | 'almoco' | 'lanche' | 'janta';

export type Recipe = {
  id: string;
  name: string;
  // Receitas prontas (RECIPES) guardam uma categoria de FoodIcon.tsx (ex:
  // 'redMeat', 'pasta') -- receitas criadas pelo usuário guardam o emoji
  // literal escolhido no momento da criação (ver RecipesSection). FoodIcon
  // decide qual dos dois é.
  emoji: string;
  mealType: MealType;
  // Horários adicionais: uma receita pode aparecer em mais de um horário
  // (ex: "Pão com ovo" no café E no lanche). Opcional para manter
  // compatibilidade com receitas salvas antes desse campo existir —
  // ausente, vale só o mealType. Leia sempre via recipeMealTypes().
  mealTypes?: MealType[];
  // Nomes precisam bater exatamente com o campo "name" no catálogo de alimentos.
  ingredientNames: string[];
};

// Fonte única pra saber em quais horários uma receita aparece, cobrindo tanto
// receitas antigas (só mealType) quanto as novas (mealTypes múltiplos).
export function recipeMealTypes(recipe: Recipe): MealType[] {
  return recipe.mealTypes && recipe.mealTypes.length > 0 ? recipe.mealTypes : [recipe.mealType];
}

export const MEAL_ORDER: MealType[] = ['cafe', 'almoco', 'lanche', 'janta'];

export const MEAL_LABELS: Record<MealType, string> = {
  cafe: 'Café da manhã',
  almoco: 'Almoço',
  lanche: 'Lanche da tarde',
  janta: 'Janta',
};

export const MEAL_HINTS: Record<MealType, string> = {
  cafe: 'Combinações leves para começar o dia',
  almoco: 'Combinações mais completas, com proteína e carboidrato',
  lanche: 'Leve, para segurar até a janta',
  janta: 'Combinações mais completas, fechando as metas do dia',
};

export const RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: 'Aveia com banana e mel',
    emoji: 'grainMisc',
    mealType: 'cafe',
    ingredientNames: ['Aveia em flocos', 'Banana prata', 'Mel de abelha'],
  },
  {
    id: 'r2',
    name: 'Pão com ovo',
    emoji: 'eggBoiled',
    mealType: 'cafe',
    ingredientNames: ['Pão francês', 'Ovo cozido'],
  },
  {
    id: 'r3',
    name: 'Iogurte com aveia',
    emoji: 'dairyCup',
    mealType: 'cafe',
    ingredientNames: ['Iogurte natural', 'Aveia em flocos'],
  },
  {
    id: 'r4',
    name: 'Arroz, feijão e frango',
    emoji: 'rice',
    mealType: 'almoco',
    ingredientNames: ['Arroz branco', 'Feijão carioca', 'Peito de frango'],
  },
  {
    id: 'r5',
    name: 'Batata doce com carne moída',
    emoji: 'redMeat',
    mealType: 'almoco',
    ingredientNames: ['Batata doce', 'Carne moída'],
  },
  {
    id: 'r6',
    name: 'Arroz, brócolis e frango',
    emoji: 'poultry',
    mealType: 'almoco',
    ingredientNames: ['Arroz branco', 'Brócolis', 'Peito de frango'],
  },
  {
    id: 'r7',
    name: 'Whey com banana',
    emoji: 'shaker',
    mealType: 'lanche',
    ingredientNames: ['Whey protein', 'Banana prata'],
  },
  {
    id: 'r8',
    name: 'Pão integral com queijo',
    emoji: 'cheese',
    mealType: 'lanche',
    ingredientNames: ['Pão integral', 'Queijo minas frescal'],
  },
  {
    id: 'r9',
    name: 'Macarrão com frango',
    emoji: 'pasta',
    mealType: 'janta',
    ingredientNames: ['Macarrão', 'Peito de frango'],
  },
  {
    id: 'r10',
    name: 'Arroz, brócolis e carne moída',
    emoji: 'rice',
    mealType: 'janta',
    ingredientNames: ['Arroz branco', 'Brócolis', 'Carne moída'],
  },
  {
    id: 'r11',
    name: 'Tapioca com queijo',
    emoji: 'prepared',
    mealType: 'cafe',
    ingredientNames: ['Tapioca', 'Queijo minas frescal'],
  },
  {
    id: 'r12',
    name: 'Ovo com aveia',
    emoji: 'eggBoiled',
    mealType: 'cafe',
    ingredientNames: ['Ovo cozido', 'Aveia em flocos'],
  },
  {
    id: 'r13',
    name: 'Macarrão com carne moída',
    emoji: 'pasta',
    mealType: 'almoco',
    ingredientNames: ['Macarrão', 'Carne moída'],
  },
  {
    id: 'r14',
    name: 'Arroz com carne suína',
    emoji: 'redMeat',
    mealType: 'almoco',
    ingredientNames: ['Arroz branco', 'Carne suína (lombo)'],
  },
  {
    id: 'r15',
    name: 'Amendoim com banana',
    emoji: 'nut',
    mealType: 'lanche',
    ingredientNames: ['Amendoim torrado', 'Banana prata'],
  },
  {
    id: 'r16',
    name: 'Batata doce, frango e brócolis',
    emoji: 'poultry',
    mealType: 'janta',
    ingredientNames: ['Batata doce', 'Peito de frango', 'Brócolis'],
  },

  // Receitas genéricas do dia a dia do brasileiro, adicionadas a pedido do
  // usuário — todas usando alimentos já existentes no catálogo.
  {
    id: 'r17',
    name: 'Cuscuz com ovo frito',
    emoji: 'eggFried',
    mealType: 'cafe',
    ingredientNames: ['Cuscuz de milho', 'Ovo frito'],
  },
  {
    id: 'r18',
    name: 'Tapioca com queijo e presunto',
    emoji: 'cheese',
    mealType: 'cafe',
    ingredientNames: ['Tapioca', 'Queijo minas frescal', 'Presunto'],
  },
  {
    id: 'r19',
    name: 'Feijoada completa',
    emoji: 'stew',
    mealType: 'almoco',
    ingredientNames: ['Feijoada', 'Arroz branco', 'Farofa de mandioca', 'Couve refogada'],
  },
  {
    id: 'r20',
    name: 'Filé mignon com arroz e feijão',
    emoji: 'redMeat',
    mealType: 'almoco',
    ingredientNames: ['Filé mignon grelhado', 'Arroz branco', 'Feijão carioca'],
  },
  {
    id: 'r21',
    name: 'Açaí na tigela',
    emoji: 'berry',
    mealType: 'lanche',
    ingredientNames: ['Açaí polpa', 'Banana prata', 'Aveia em flocos'],
  },
  {
    id: 'r22',
    name: 'Sanduíche de atum',
    emoji: 'fish',
    mealType: 'lanche',
    ingredientNames: ['Pão de forma', 'Atum em lata (água)', 'Alface americana'],
  },
  {
    id: 'r23',
    name: 'Coxinha com refrigerante',
    emoji: 'prepared',
    mealType: 'lanche',
    ingredientNames: ['Coxinha', 'Refrigerante cola'],
  },
  {
    id: 'r24',
    name: 'Picanha com farofa',
    emoji: 'redMeat',
    mealType: 'janta',
    ingredientNames: ['Picanha grelhada', 'Arroz branco', 'Farofa de mandioca'],
  },
  {
    id: 'r25',
    name: 'Frango assado com batata e salada',
    emoji: 'poultry',
    mealType: 'janta',
    ingredientNames: ['Frango assado (com pele)', 'Batata inglesa cozida', 'Alface americana'],
  },
  {
    id: 'r26',
    name: 'Polenta com linguiça',
    emoji: 'corn',
    mealType: 'janta',
    ingredientNames: ['Polenta cozida', 'Linguiça calabresa'],
  },
  {
    id: 'r27',
    name: 'Pão de queijo com leite',
    emoji: 'prepared',
    mealType: 'cafe',
    ingredientNames: ['Pão de queijo', 'Leite integral'],
  },
  {
    id: 'r28',
    name: 'Vitamina de banana',
    emoji: 'dairyCup',
    mealType: 'cafe',
    ingredientNames: ['Banana prata', 'Leite integral', 'Aveia em flocos'],
  },
  {
    id: 'r29',
    name: 'Pernil com farofa e mandioca',
    emoji: 'redMeat',
    mealType: 'almoco',
    ingredientNames: ['Carne de porco (pernil assado)', 'Farofa de mandioca', 'Mandioca cozida'],
  },
  {
    id: 'r30',
    name: 'Grão de bico com frango e tomate',
    emoji: 'legume',
    mealType: 'almoco',
    ingredientNames: ['Grão de bico cozido', 'Peito de frango', 'Tomate'],
  },
  {
    id: 'r31',
    name: 'Sardinha com farofa e arroz',
    emoji: 'fish',
    mealType: 'almoco',
    ingredientNames: ['Sardinha em lata', 'Farofa de mandioca', 'Arroz branco'],
  },
  {
    id: 'r32',
    name: 'Salada de frutas',
    emoji: 'berry',
    mealType: 'lanche',
    ingredientNames: ['Maçã', 'Melancia', 'Uva', 'Morango'],
  },
  {
    id: 'r33',
    name: 'Pão de queijo com requeijão',
    emoji: 'prepared',
    mealType: 'lanche',
    ingredientNames: ['Pão de queijo', 'Requeijão cremoso'],
  },
  {
    id: 'r34',
    name: 'Castanha de caju com maçã',
    emoji: 'nut',
    mealType: 'lanche',
    ingredientNames: ['Castanha de caju', 'Maçã'],
  },
  {
    id: 'r35',
    name: 'Camarão com arroz integral e abobrinha',
    emoji: 'fish',
    mealType: 'janta',
    ingredientNames: ['Camarão cozido', 'Arroz integral', 'Abobrinha cozida'],
  },
  {
    id: 'r36',
    name: 'Pizza com suco de laranja',
    emoji: 'pizza',
    mealType: 'janta',
    ingredientNames: ['Pizza mussarela', 'Suco de laranja natural'],
  },
];
