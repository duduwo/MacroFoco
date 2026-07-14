import AsyncStorage from '@react-native-async-storage/async-storage';
import type {MealPeriod} from '../foodMath';

// "Banco de dados" local do catálogo de alimentos: guardado no AsyncStorage do
// dispositivo. Na primeira execução, semeia com a lista abaixo (baseada na TACO
// — ver nota original). Depois disso, lê sempre do armazenamento local.

export type Food = {
  // Alimentos do catálogo (FOOD_SEED) guardam uma categoria de FoodIcon.tsx
  // (ex: 'rice', 'legume') -- alimentos criados pelo usuário (scanner/
  // cadastro manual) guardam um emoji literal escolhido por ele. FoodIcon
  // decide qual dos dois é, então esse campo aceita ambos.
  emoji: string;
  name: string;
  dosage: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Marca itens ultraprocessados/fast-food (refrigerante, doces, frituras
  // industrializadas etc). Usado só pra não destacá-los como "Recomendado" —
  // continuam aparecendo normalmente no catálogo e podem ser adicionados.
  ultraProcessed?: boolean;
  // Períodos em que o alimento é tradicionalmente comum no Brasil (ex: arroz
  // e feijão no almoço/janta, pão e tapioca de manhã). Usado só como
  // desempate no score de recomendação — alimentos sem essa tag (frutas,
  // ovos, whey etc) são "coringa" e ficam neutros em qualquer período.
  commonPeriods?: MealPeriod[];
  // Marca um alimento como "base" do período em commonPeriods — recebe um
  // bônus maior que o padrão, pra ele tender a aparecer como Recomendado
  // acima dos demais alimentos do mesmo período.
  staple?: boolean;
  // Fixa manualmente um alimento como um dos 2 principais daquele macro pro
  // pin do topo (ex: Peito de frango pra proteína, Arroz branco pra carbo) —
  // usado quando o mais comum/representativo não é simplesmente quem tem
  // mais gramas daquele macro (ex: evitar arroz branco + arroz integral
  // juntos, que é meio redundante). Sem essa marcação, o pin cai de volta
  // pro ranking automático por gramas.
  pinnedPick?: 'protein' | 'carbs';
};

const FOOD_SEED: Food[] = [
  {emoji: 'rice', name: 'Arroz branco', dosage: '100g', calories: 128, protein: 2.5, carbs: 28.1, fat: 0.2, commonPeriods: ['almoco', 'noite'], staple: true, pinnedPick: 'carbs'},
  {emoji: 'legume', name: 'Feijão carioca', dosage: '100g', calories: 76, protein: 4.8, carbs: 13.6, fat: 0.5, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'poultry', name: 'Peito de frango', dosage: '100g', calories: 163, protein: 31.5, carbs: 0, fat: 3.2, commonPeriods: ['almoco', 'noite'], staple: true, pinnedPick: 'protein'},
  {emoji: 'eggBoiled', name: 'Ovo cozido', dosage: '1 unidade', calories: 72, protein: 6.5, carbs: 0.8, fat: 4.5, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'roundProduce', name: 'Banana prata', dosage: '1 unidade', calories: 69, protein: 1, carbs: 18.2, fat: 0.1, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'bread', name: 'Pão francês', dosage: '1 unidade', calories: 150, protein: 4, carbs: 29, fat: 1.6, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'rootVeg', name: 'Batata doce', dosage: '100g', calories: 77, protein: 0.6, carbs: 18.4, fat: 0.1, commonPeriods: ['almoco', 'noite'], staple: true, pinnedPick: 'carbs'},
  {emoji: 'redMeat', name: 'Carne moída', dosage: '100g', calories: 212, protein: 26.7, carbs: 0, fat: 10.9, commonPeriods: ['almoco', 'noite'], staple: true, pinnedPick: 'protein'},
  {emoji: 'prepared', name: 'Tapioca', dosage: '1 unidade média', calories: 130, protein: 0.2, carbs: 32, fat: 0.1, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'grainMisc', name: 'Aveia em flocos', dosage: '30g', calories: 118, protein: 4.2, carbs: 20, fat: 2.5, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'dairyCup', name: 'Iogurte natural', dosage: '170g', calories: 87, protein: 7, carbs: 5.8, fat: 5.1, commonPeriods: ['manha', 'tarde'], staple: true},
  // TACO 4ª ed., "Queijo, minas, frescal" (valores por 100g escalados pra 30g).
  {emoji: 'cheese', name: 'Queijo minas frescal', dosage: '30g', calories: 79, protein: 5.2, carbs: 1, fat: 6.1, commonPeriods: ['manha', 'tarde']},
  {emoji: 'dairyCup', name: 'Leite integral', dosage: '200ml', calories: 122, protein: 5.8, carbs: 8.6, fat: 6.4, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'pasta', name: 'Macarrão', dosage: '100g', calories: 111, protein: 3.8, carbs: 23.2, fat: 0.4, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'leafy', name: 'Brócolis', dosage: '100g', calories: 25, protein: 2.2, carbs: 4.4, fat: 0.4, commonPeriods: ['almoco', 'noite'], staple: true},
  // TACO 4ª ed., "Alface, americana, crua".
  {emoji: 'leafy', name: 'Alface americana', dosage: '100g', calories: 9, protein: 0.6, carbs: 1.7, fat: 0.1, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'roundProduce', name: 'Tomate', dosage: '100g', calories: 15, protein: 1.1, carbs: 3.1, fat: 0.2, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'rootVeg', name: 'Cenoura crua', dosage: '100g', calories: 34, protein: 1.3, carbs: 7.7, fat: 0.2, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'rootVeg', name: 'Cenoura cozida', dosage: '100g', calories: 30, protein: 0.8, carbs: 6.7, fat: 0.2, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'citrus', name: 'Laranja', dosage: '1 unidade', calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2},
  {emoji: 'apple', name: 'Maçã', dosage: '1 unidade', calories: 78, protein: 0.3, carbs: 20, fat: 0.2},
  {emoji: 'melonFruit', name: 'Mamão papaya', dosage: '100g', calories: 40, protein: 0.6, carbs: 10.4, fat: 0.1},
  {emoji: 'roundProduce', name: 'Abacate', dosage: '100g', calories: 96, protein: 1.2, carbs: 6, fat: 8.4},
  {emoji: 'nut', name: 'Castanha do Pará', dosage: '1 unidade', calories: 32, protein: 0.7, carbs: 0.6, fat: 3.2},
  {emoji: 'nut', name: 'Amendoim torrado', dosage: '30g', calories: 180, protein: 6.8, carbs: 6, fat: 16.2, commonPeriods: ['tarde']},
  {emoji: 'bread', name: 'Pão integral', dosage: '1 fatia', calories: 65, protein: 2.5, carbs: 12, fat: 1, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'shaker', name: 'Whey protein', dosage: '1 dose (30g)', calories: 120, protein: 24, carbs: 3, fat: 1.5, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'stew', name: 'Feijoada', dosage: '100g', calories: 117, protein: 8.7, carbs: 12, fat: 6.5, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'prepared', name: 'Coxinha', dosage: '1 unidade média', calories: 250, protein: 8, carbs: 22, fat: 14, ultraProcessed: true, commonPeriods: ['tarde']},
  {emoji: 'prepared', name: 'Pão de queijo', dosage: '1 unidade', calories: 100, protein: 2.3, carbs: 10, fat: 5, commonPeriods: ['manha', 'tarde']},
  {emoji: 'redMeat', name: 'Carne suína (lombo)', dosage: '100g', calories: 210, protein: 28.6, carbs: 0, fat: 9.7, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'processedMeat', name: 'Linguiça calabresa', dosage: '100g', calories: 325, protein: 16, carbs: 2, fat: 28, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'fish', name: 'Tilápia grelhada', dosage: '100g', calories: 128, protein: 26, carbs: 0, fat: 2, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'fish', name: 'Sardinha em lata', dosage: '100g', calories: 208, protein: 21, carbs: 0, fat: 13, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'fish', name: 'Atum em lata (água)', dosage: '100g', calories: 116, protein: 26, carbs: 0, fat: 0.8, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'processedMeat', name: 'Bacon', dosage: '30g', calories: 162, protein: 9, carbs: 0, fat: 14, commonPeriods: ['manha', 'tarde']},
  {emoji: 'cheese', name: 'Queijo mussarela', dosage: '30g', calories: 99, protein: 7, carbs: 1, fat: 8, commonPeriods: ['manha', 'tarde']},
  {emoji: 'spread', name: 'Requeijão cremoso', dosage: '1 colher (20g)', calories: 51, protein: 2.5, carbs: 1, fat: 4.5, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'spread', name: 'Manteiga', dosage: '1 ponta de faca (10g)', calories: 73, protein: 0.1, carbs: 0.1, fat: 8, commonPeriods: ['manha', 'tarde'], staple: true},
  // TACO 4ª ed., "Maionese, tradicional com ovos" (100g → porção de 15g).
  {emoji: 'spread', name: 'Maionese tradicional com ovos', dosage: '1 colher de sopa (15g)', calories: 45, protein: 0.1, carbs: 1.2, fat: 4.6, ultraProcessed: true, commonPeriods: ['manha', 'almoco', 'tarde', 'noite']},
  {emoji: 'pineapple', name: 'Abacaxi', dosage: '100g', calories: 48, protein: 0.9, carbs: 12.3, fat: 0.1},
  {emoji: 'melonFruit', name: 'Melancia', dosage: '100g', calories: 33, protein: 0.9, carbs: 8.1, fat: 0},
  {emoji: 'grape', name: 'Uva', dosage: '100g', calories: 53, protein: 0.7, carbs: 14, fat: 0.3},
  {emoji: 'berry', name: 'Morango', dosage: '100g', calories: 30, protein: 0.9, carbs: 6.8, fat: 0.3},
  {emoji: 'roundProduce', name: 'Manga', dosage: '100g', calories: 64, protein: 0.4, carbs: 16.7, fat: 0.2},
  {emoji: 'roundProduce', name: 'Cebola crua', dosage: '100g', calories: 39, protein: 1.2, carbs: 8.9, fat: 0.2, commonPeriods: ['almoco', 'noite']},
  {emoji: 'leafy', name: 'Abobrinha cozida', dosage: '100g', calories: 19, protein: 1.2, carbs: 4.3, fat: 0.1, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'corn', name: 'Milho verde cozido', dosage: '100g', calories: 98, protein: 3.4, carbs: 19, fat: 1.4, commonPeriods: ['almoco', 'noite']},
  {emoji: 'rootVeg', name: 'Mandioca cozida', dosage: '100g', calories: 125, protein: 0.6, carbs: 30, fat: 0.3, commonPeriods: ['almoco', 'noite']},
  {emoji: 'legume', name: 'Lentilha cozida', dosage: '100g', calories: 93, protein: 6.3, carbs: 16.3, fat: 0.5, commonPeriods: ['almoco', 'noite']},
  {emoji: 'legume', name: 'Grão de bico cozido', dosage: '100g', calories: 164, protein: 8.4, carbs: 27.4, fat: 2.6, commonPeriods: ['almoco', 'noite']},
  {emoji: 'nut', name: 'Castanha de caju', dosage: '5 unidades', calories: 57, protein: 1.8, carbs: 3, fat: 4.5},
  {emoji: 'pizza', name: 'Pizza mussarela', dosage: '1 fatia (100g)', calories: 266, protein: 11, carbs: 33, fat: 9, ultraProcessed: true, commonPeriods: ['noite']},
  {emoji: 'pasta', name: 'Lasanha à bolonhesa', dosage: '100g', calories: 145, protein: 7, carbs: 13, fat: 7, commonPeriods: ['almoco', 'noite']},
  {emoji: 'candy', name: 'Chocolate ao leite', dosage: '25g', calories: 135, protein: 2, carbs: 15, fat: 7.5, ultraProcessed: true},
  {emoji: 'soda', name: 'Refrigerante cola', dosage: '1 lata (350ml)', calories: 140, protein: 0, carbs: 35, fat: 0, ultraProcessed: true},
  {emoji: 'spread', name: 'Mel de abelha', dosage: '1 colher (20g)', calories: 62, protein: 0.1, carbs: 16.6, fat: 0, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'leafy', name: 'Espinafre cozido', dosage: '100g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, commonPeriods: ['almoco', 'noite']},
  {emoji: 'leafy', name: 'Pepino', dosage: '100g', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, commonPeriods: ['almoco', 'noite']},
  {emoji: 'legume', name: 'Ervilha cozida', dosage: '100g', calories: 81, protein: 5.4, carbs: 14, fat: 0.4, commonPeriods: ['almoco', 'noite']},
  {emoji: 'rice', name: 'Arroz integral', dosage: '100g', calories: 124, protein: 2.6, carbs: 25.8, fat: 1.0, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'legume', name: 'Feijão preto cozido', dosage: '100g', calories: 77, protein: 4.5, carbs: 14.0, fat: 0.5, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'rootVeg', name: 'Batata inglesa cozida', dosage: '100g', calories: 68, protein: 1.3, carbs: 14.1, fat: 0.9, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'corn', name: 'Polenta cozida', dosage: '100g', calories: 65, protein: 1.4, carbs: 14, fat: 0.3, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'berry', name: 'Açaí polpa', dosage: '100g', calories: 58, protein: 0.8, carbs: 6.2, fat: 3.9, commonPeriods: ['manha', 'tarde']},
  {emoji: 'leafy', name: 'Couve refogada', dosage: '100g', calories: 90, protein: 1.7, carbs: 4.7, fat: 6.6, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'leafy', name: 'Repolho cru', dosage: '100g', calories: 17, protein: 1.0, carbs: 3.6, fat: 0.1, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'grainMisc', name: 'Farofa de mandioca', dosage: '30g', calories: 135, protein: 1.0, carbs: 20, fat: 6.5, commonPeriods: ['almoco', 'noite']},
  {emoji: 'redMeat', name: 'Picanha grelhada', dosage: '100g', calories: 289, protein: 25, carbs: 0, fat: 21, commonPeriods: ['almoco', 'noite']},
  {emoji: 'poultry', name: 'Frango assado (com pele)', dosage: '100g', calories: 216, protein: 27, carbs: 0, fat: 11, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'fish', name: 'Camarão cozido', dosage: '100g', calories: 90, protein: 19, carbs: 0, fat: 1, commonPeriods: ['almoco', 'noite']},
  {emoji: 'citrus', name: 'Suco de laranja natural', dosage: '200ml', calories: 90, protein: 1.4, carbs: 21, fat: 0.4, commonPeriods: ['manha', 'tarde']},
  {emoji: 'melonFruit', name: 'Goiaba', dosage: '100g', calories: 54, protein: 1.1, carbs: 12.4, fat: 0.5},
  {emoji: 'melonFruit', name: 'Melão', dosage: '100g', calories: 29, protein: 0.8, carbs: 7.5, fat: 0.1},
  {emoji: 'citrus', name: 'Maracujá polpa', dosage: '100g', calories: 68, protein: 2, carbs: 12.3, fat: 2},
  {emoji: 'bread', name: 'Pão de forma', dosage: '1 fatia', calories: 65, protein: 2, carbs: 12, fat: 1, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'redMeat', name: 'Filé mignon grelhado', dosage: '100g', calories: 220, protein: 32.8, carbs: 0, fat: 8.8, commonPeriods: ['almoco', 'noite']},
  {emoji: 'eggFried', name: 'Omelete (2 ovos)', dosage: '120g', calories: 200, protein: 13, carbs: 1.5, fat: 15, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'eggFried', name: 'Ovo frito', dosage: '1 unidade', calories: 120, protein: 7.8, carbs: 0.7, fat: 9.3, commonPeriods: ['manha', 'tarde'], staple: true},
  {emoji: 'redMeat', name: 'Carne de porco (pernil assado)', dosage: '100g', calories: 262, protein: 32.1, carbs: 0, fat: 13.9, commonPeriods: ['almoco', 'noite']},
  {emoji: 'cookie', name: 'Bolacha (biscoito doce maisena)', dosage: '100g', calories: 443, protein: 8.1, carbs: 75.2, fat: 12.0, ultraProcessed: true, commonPeriods: ['manha', 'tarde']},
  {emoji: 'noodles', name: 'Miojo (macarrão instantâneo)', dosage: '100g', calories: 436, protein: 8.8, carbs: 62.4, fat: 17.2, ultraProcessed: true, commonPeriods: ['almoco', 'noite']},
  {emoji: 'citrus', name: 'Suco de limão natural (sem açúcar)', dosage: '100ml', calories: 22, protein: 0.6, carbs: 7.3, fat: 0.1},
  {emoji: 'processedMeat', name: 'Mortadela', dosage: '100g', calories: 269, protein: 12.0, carbs: 5.8, fat: 21.6, ultraProcessed: true, commonPeriods: ['manha', 'tarde']},
  {emoji: 'processedMeat', name: 'Presunto', dosage: '1 fatia (15g)', calories: 14, protein: 2.1, carbs: 0.3, fat: 0.4, commonPeriods: ['manha', 'tarde']},
  {emoji: 'dairyCup', name: 'Leite condensado', dosage: '100g', calories: 313, protein: 7.7, carbs: 57.0, fat: 6.7, ultraProcessed: true},
  {emoji: 'rootVeg', name: 'Beterraba crua', dosage: '100g', calories: 49, protein: 1.9, carbs: 11.1, fat: 0.1, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'rootVeg', name: 'Beterraba cozida', dosage: '100g', calories: 32, protein: 1.3, carbs: 7.2, fat: 0.1, commonPeriods: ['almoco', 'noite'], staple: true},

  // --------------------------------------------------------------------
  // Adicionados após comparar o catálogo com a Tabela 2 (Frequência de
  // consumo alimentar) da POF 2017-2018/IBGE — "Análise do Consumo
  // Alimentar Pessoal no Brasil". Valores da TACO 4ª ed. (ou, quando a
  // TACO não cobre o item — bebida alcoólica —, de tabelas nutricionais
  // brasileiras equivalentes, citadas item a item).
  // --------------------------------------------------------------------
  // TACO 4ª ed., "Café, infusão 10%" (2 kcal/100g) — 78,1% da população
  // consumiu no dia de referência da POF; era o item mais citado da
  // pesquisa e não existia no catálogo.
  {emoji: 'coffee', name: 'Café coado', dosage: '1 xícara (50ml)', calories: 1, protein: 0.1, carbs: 0.2, fat: 0, commonPeriods: ['manha', 'tarde'], staple: true},
  // TACO 4ª ed., "Chá, mate, infusão 5%".
  {emoji: 'tea', name: 'Chá', dosage: '1 xícara (200ml)', calories: 6, protein: 0, carbs: 1.4, fat: 0, commonPeriods: ['manha', 'tarde']},
  // TACO 4ª ed., "Óleo, soja" — presente em "Óleos e gorduras" (46,8%,
  // 2º item mais citado da POF); o catálogo só tinha manteiga/requeijão.
  {emoji: 'oil', name: 'Óleo de soja', dosage: '1 colher de sopa (13g)', calories: 115, protein: 0, carbs: 0, fat: 13, commonPeriods: ['almoco', 'noite'], staple: true},
  {emoji: 'oil', name: 'Azeite de oliva', dosage: '1 colher de sopa (13g)', calories: 117, protein: 0, carbs: 0, fat: 13, commonPeriods: ['almoco', 'noite']},
  // TACO 4ª ed., "Biscoito, cream cracker" — biscoito salgado, distinto do
  // biscoito doce (maisena) que já existia no catálogo.
  {emoji: 'cookie', name: 'Biscoito de água e sal', dosage: '100g', calories: 432, protein: 10.1, carbs: 71.7, fat: 12.5, ultraProcessed: true, commonPeriods: ['manha', 'tarde']},
  // TACO 4ª ed., "Bolo, fubá, com erva doce" (valor aproximado de bolo caseiro simples).
  {emoji: 'cake', name: 'Bolo simples (fubá)', dosage: '1 fatia (60g)', calories: 190, protein: 3.2, carbs: 29, fat: 6, commonPeriods: ['manha', 'tarde']},
  // TACO 4ª ed., "Farinha de mandioca, crua" — distinta da farofa (já frita/temperada).
  {emoji: 'grainMisc', name: 'Farinha de mandioca', dosage: '2 colheres de sopa (20g)', calories: 72, protein: 0.3, carbs: 17.6, fat: 0.1, commonPeriods: ['almoco', 'noite']},
  // TACO 4ª ed., "Doce de leite".
  {emoji: 'spread', name: 'Doce de leite', dosage: '1 colher de sopa (20g)', calories: 63, protein: 1.0, carbs: 11.2, fat: 1.5, ultraProcessed: true, commonPeriods: ['manha', 'tarde']},
  // Cerveja tipo lager — a TACO não cobre bebidas alcoólicas; valor de
  // tabela nutricional padrão (~43 kcal/100ml).
  {emoji: 'beer', name: 'Cerveja', dosage: '1 lata (350ml)', calories: 150, protein: 1.4, carbs: 10.5, fat: 0},
  // Vinho tinto de mesa — mesma ressalva da cerveja (sem cobertura TACO).
  {emoji: 'wine', name: 'Vinho tinto de mesa', dosage: '1 taça (150ml)', calories: 107, protein: 0.2, carbs: 3, fat: 0},
  // TACO 4ª ed., "Goiabada".
  {emoji: 'candy', name: 'Goiabada', dosage: '1 fatia (30g)', calories: 79, protein: 0.1, carbs: 19.8, fat: 0, ultraProcessed: true},
  // TACO 4ª ed., "Sorvete, sabor chocolate" (aprox.).
  {emoji: 'iceCream', name: 'Sorvete de massa', dosage: '1 bola (60g)', calories: 124, protein: 2.3, carbs: 19.2, fat: 4.2, ultraProcessed: true},
  // TACO 4ª ed., "Carne, bovina, charque, cozida".
  {emoji: 'redMeat', name: 'Carne seca (charque)', dosage: '100g', calories: 254, protein: 34, carbs: 0, fat: 12.6, commonPeriods: ['almoco', 'noite']},
  // TACO 4ª ed., "Salsicha, hot dog, cozida".
  {emoji: 'processedMeat', name: 'Salsicha', dosage: '1 unidade (50g)', calories: 130, protein: 6.2, carbs: 1, fat: 11, ultraProcessed: true, commonPeriods: ['almoco', 'noite']},
  // TACO 4ª ed., "Cereais matinais, milho" (tipo flocos de milho).
  {emoji: 'grainMisc', name: 'Cereal matinal (flocos de milho)', dosage: '30g', calories: 107, protein: 2.1, carbs: 25.2, fat: 0.1, ultraProcessed: true, commonPeriods: ['manha']},
  // TACO 4ª ed., "Abóbora, moranga, cozida".
  {emoji: 'leafy', name: 'Abóbora cozida', dosage: '100g', calories: 40, protein: 1.4, carbs: 9.4, fat: 0.2, commonPeriods: ['almoco', 'noite']},
  // TACO 4ª ed., "Achocolatado em pó".
  {emoji: 'dairyCup', name: 'Achocolatado em pó', dosage: '2 colheres de sopa (20g)', calories: 77, protein: 1.0, carbs: 17.2, fat: 0.6, ultraProcessed: true, commonPeriods: ['manha', 'tarde']},
  // TACO 4ª ed., "Chuchu, cozido".
  {emoji: 'leafy', name: 'Chuchu cozido', dosage: '100g', calories: 19, protein: 0.6, carbs: 4.4, fat: 0.1, commonPeriods: ['almoco', 'noite']},
  // TACO 4ª ed., "Tangerina, poncã".
  {emoji: 'citrus', name: 'Tangerina', dosage: '1 unidade (100g)', calories: 46, protein: 0.9, carbs: 11.9, fat: 0.2},
  // TACO 4ª ed., "Salgadinho, de milho, tipo fandangos" (aprox.).
  {emoji: 'chips', name: 'Salgadinho de pacote', dosage: '1 pacote pequeno (50g)', calories: 252, protein: 3, carbs: 30, fat: 13, ultraProcessed: true, commonPeriods: ['tarde']},
  // TACO 4ª ed., "Leite de vaca, desnatado".
  {emoji: 'dairyCup', name: 'Leite desnatado', dosage: '200ml', calories: 70, protein: 6.8, carbs: 9.8, fat: 0.4, commonPeriods: ['manha', 'tarde']},
];

const STORAGE_KEY = 'macrofoco:foodCatalog';
const VERSION_KEY = 'macrofoco:foodCatalogVersion';
// Incrementar sempre que FOOD_SEED mudar, para o catálogo salvo no aparelho
// ser substituído automaticamente em vez de manter uma versão antiga.
const CATALOG_VERSION = 9;

// Compatibilidade com receitas/itens planejados salvos antes dos nomes serem
// alinhados às descrições específicas da TACO na versão 8 do catálogo.
export const FOOD_NAME_ALIASES: Record<string, string> = {
  'Queijo minas': 'Queijo minas frescal',
  Alface: 'Alface americana',
};

export function findCatalogFoodByName(catalog: Food[], name: string): Food | undefined {
  return catalog.find(food => food.name === name)
    ?? catalog.find(food => food.name === FOOD_NAME_ALIASES[name]);
}

export async function loadFoodCatalog(): Promise<Food[]> {
  const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
    ]);

  try {
    const storedVersion = await withTimeout(AsyncStorage.getItem(VERSION_KEY), 3000, null);
    if (storedVersion === String(CATALOG_VERSION)) {
      const stored = await withTimeout(AsyncStorage.getItem(STORAGE_KEY), 3000, null);
      if (stored) {
        return JSON.parse(stored) as Food[];
      }
    }
    // Primeira execução ou versão do catálogo mudou: semeia com a lista padrão atual.
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(FOOD_SEED)).catch(() => {});
    AsyncStorage.setItem(VERSION_KEY, String(CATALOG_VERSION)).catch(() => {});
    return FOOD_SEED;
  } catch (e) {
    console.warn('Falha ao carregar catálogo de alimentos, usando lista padrão em memória.', e);
    return FOOD_SEED;
  }
}
