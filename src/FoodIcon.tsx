import React from 'react';
import {Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Ícones "de verdade" (MaterialCommunityIcons, vetorial) pro catálogo de
// alimentos e receitas — substituem o emoji do sistema, que quebra em
// aparelhos/fontes sem o glifo mais recente (ver histórico do bug de
// "tofu box"). Um único pacote de fonte (só essa família), sem depender de
// múltiplos arquivos de fonte por estilo.
//
// Cobertura: a biblioteca não tem um ícone específico pra cada prato (não
// existe "feijão" ou "banana" no MaterialCommunityIcons) — por isso o mapa
// abaixo é por CATEGORIA (ex: todo feijão/lentilha/grão-de-bico cai em
// "legume"), não um desenho único por alimento. Alimentos/receitas criados
// pelo usuário continuam livres pra escolher qualquer emoji — só o catálogo
// e as receitas prontas usam essas categorias (ver Food.emoji/Recipe.emoji).
export const FOOD_ICON_CATEGORIES = {
  rice: 'rice',
  poultry: 'food-drumstick',
  eggBoiled: 'egg-outline',
  eggFried: 'egg-fried',
  bread: 'bread-slice',
  redMeat: 'food-steak',
  processedMeat: 'sausage',
  fish: 'fish',
  cheese: 'cheese',
  corn: 'corn',
  rootVeg: 'carrot',
  apple: 'food-apple',
  roundProduce: 'food-apple-outline',
  citrus: 'fruit-citrus',
  grape: 'fruit-grapes',
  pineapple: 'fruit-pineapple',
  melonFruit: 'fruit-watermelon',
  berry: 'fruit-cherries',
  legume: 'peanut',
  nut: 'peanut-outline',
  grainMisc: 'grain',
  dairyCup: 'cup',
  shaker: 'shaker',
  spread: 'silverware-spoon',
  pasta: 'pasta',
  noodles: 'noodles',
  pizza: 'pizza',
  cookie: 'cookie',
  soda: 'bottle-soda',
  candy: 'candy',
  leafy: 'sprout',
  stew: 'pot-steam',
  prepared: 'food-variant',
  coffee: 'coffee',
  tea: 'tea',
  oil: 'oil',
  beer: 'beer',
  wine: 'glass-wine',
  cake: 'cake-variant',
  iceCream: 'ice-cream',
  chips: 'popcorn',
} as const;

export type FoodIconCategory = keyof typeof FOOD_ICON_CATEGORIES;

const CATEGORY_KEYS = new Set(Object.keys(FOOD_ICON_CATEGORIES));

function isFoodIconCategory(token: string): token is FoodIconCategory {
  return CATEGORY_KEYS.has(token);
}

type FoodIconProps = {
  /** Food.emoji / Recipe.emoji: categoria conhecida (ver FOOD_ICON_CATEGORIES)
   * ou, pra alimentos/receitas do usuário, um emoji literal qualquer. */
  token: string;
  size?: number;
  color: string;
};

// Ponto único de renderização do "emoji" de um alimento/receita — decide
// entre ícone vetorial (catálogo/receitas prontas) e emoji de texto (criado
// pelo usuário), pra quem consome não precisar saber a diferença.
export function FoodIcon({token, size = 20, color}: FoodIconProps) {
  if (isFoodIconCategory(token)) {
    return <Icon name={FOOD_ICON_CATEGORIES[token]} size={size} color={color} />;
  }
  return <Text style={{fontSize: size, lineHeight: size * 1.15}}>{token}</Text>;
}
