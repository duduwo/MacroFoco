import React, {useEffect, useState, useCallback, useMemo, forwardRef, useImperativeHandle} from 'react';
import {View, Text, ScrollView, Alert, Modal, TextInput} from 'react-native';
import PressableScale from './PressableScale';
import {useFocusEffect} from '@react-navigation/native';
import {useCalorie, type ConsumedFood} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import {getTintByMacro} from './theme';
import {
  findCatalogFoodByName,
  loadFoodCatalog,
  type Food,
} from './data/foodCatalogStorage';
import {loadUserFoods} from './data/userFoodsStorage';
import {loadUserRecipes, saveUserRecipes} from './data/userRecipesStorage';
import {RECIPES, MEAL_ORDER, MEAL_LABELS, MEAL_HINTS, recipeMealTypes, type Recipe, type MealType} from './data/recipes';
import {MealPeriodIcon} from './MealPeriodIcons';
import {FoodIcon} from './FoodIcon';
import {scaleDosage, scaleMacros, dominantMacro, QUANTITY_STEPS} from './foodMath';
import {makeStyles} from './RecipesSection.styles';

type RecipeIngredientInfo = {name: string; dosage: string; quantity: number};

type RecipeTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: RecipeIngredientInfo[];
  missing: string[]; // ingredientes não achados no catálogo (não deveria acontecer)
};

// Cada receita tem um horário (MealType); ao adicionar ao diário, isso vira
// o período da refeição (MealPeriod) exigido pelo ConsumedFood.
const MEAL_TYPE_TO_PERIOD: Record<MealType, ConsumedFood['period']> = {
  cafe: 'manha',
  almoco: 'almoco',
  lanche: 'tarde',
  janta: 'noite',
};

// Soma os macros dos ingredientes de uma receita a partir dos valores reais
// do catálogo, aplicando o multiplicador individual de cada ingrediente (ex:
// 2x banana) antes de somar — assim o total da receita reflete os ajustes
// feitos item a item, e não um multiplicador único pra receita inteira.
function computeRecipeTotals(
  recipe: Recipe,
  catalog: Food[],
  getIngredientQuantity: (index: number) => number,
): RecipeTotals {
  const totals: RecipeTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ingredients: [],
    missing: [],
  };

  recipe.ingredientNames.forEach((ingredientName, index) => {
    const food = findCatalogFoodByName(catalog, ingredientName);
    if (!food) {
      totals.missing.push(ingredientName);
      return;
    }
    const quantity = getIngredientQuantity(index);
    const scaled = scaleMacros(food, quantity);
    totals.calories += scaled.calories;
    totals.protein += scaled.protein;
    totals.carbs += scaled.carbs;
    totals.fat += scaled.fat;
    totals.ingredients.push({name: food.name, dosage: scaleDosage(food.dosage, quantity), quantity});
  });

  return totals;
}

// Sub-seção "Receitas" dentro de Organização. As receitas criadas pelo
// usuário entram direto na lista padrão, misturadas ao catálogo fixo por
// horário — não existe mais aba "Minhas receitas". O botão "Criar receita"
// fica em OrganizationScreen (ao lado do seletor de período) e abre o modal
// daqui através da ref (openCreateModal).

type RecipesSectionProps = {
  /** Quando presente, o "+" chama este callback em vez de persistir direto.
   * ingredientQuantities: multiplicador de cada ingrediente (mesma ordem de
   * recipe.ingredientNames), pra o ajuste de porção sobreviver até o Diário. */
  onAddRecipe?: (
    recipe: Recipe,
    totals: RecipeTotals,
    isUserRecipe: boolean,
    ingredientQuantities: number[],
  ) => void;
  /** Quando presente, filtra a lista pelo horário atual (Organização). */
  externalPeriod?: string;
  /** Quando presente, chamado a cada ajuste de quantidade de ingrediente
   * (steppers do card expandido) — permite que quem já adicionou essa
   * receita ao rascunho (Organização) mantenha o item sincronizado com a
   * porção atual, em vez de ficar com o total congelado do momento do "+". */
  onIngredientQuantityChange?: (
    recipeId: string,
    ingredientQuantities: number[],
    totals: {calories: number; protein: number; carbs: number; fat: number},
  ) => void;
};

export type RecipesSectionHandle = {
  openCreateModal: () => void;
};

const RecipesSection = forwardRef<RecipesSectionHandle, RecipesSectionProps>(function RecipesSectionInner(
  {onAddRecipe, externalPeriod, onIngredientQuantityChange}: RecipesSectionProps,
  ref,
) {
  const {addImmediatePlannedItem, selectedDate, recalculateRecipeItems} = useCalorie();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tintByMacro = useMemo(() => getTintByMacro(colors), [colors]);
  // Cor do ícone da receita, em cima do fundo tingido (tintByMacro) do
  // mesmo macro -- usa a cor sólida (não a versão pálida) pra ter contraste.
  const iconColorByMacro = useMemo(
    () => ({protein: colors.protein, carbs: colors.carbs, fat: colors.fat}),
    [colors],
  );
  const [catalog, setCatalog] = useState<Food[]>([]);
  // Quantidade de cada ingrediente, individualmente, chaveada por "recipeId:index".
  const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, number>>({});

  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  // Receitas começam minimizadas; guardamos aqui só o id expandido no momento
  // (apenas uma por vez — abrir outra fecha a anterior).
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  // Id da receita própria em edição -- presente só quando o modal foi aberto
  // via "Editar" (não via "Criar receita"). Determina se handleSaveRecipe
  // atualiza a receita existente (mesmo id) ou cria uma nova.
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  // Multi-seleção: a mesma receita pode valer pra mais de um horário.
  const [newMealTypes, setNewMealTypes] = useState<MealType[]>(['almoco']);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  // Espelho do "Cadastrados" de alimentos: filtra pra só receitas criadas
  // pelo usuário.
  const [showOnlyUserRecipes, setShowOnlyUserRecipes] = useState(false);

  // useFocusEffect (não useEffect simples) porque as abas ficam montadas em
  // memória: sem isso, um alimento salvo no Scanner só apareceria como opção
  // de ingrediente depois de reiniciar o app.
  useFocusEffect(
    useCallback(() => {
      Promise.all([loadFoodCatalog(), loadUserFoods()]).then(([catalogFoods, userFoods]) => {
        setCatalog([...userFoods, ...catalogFoods]);
      });
    }, []),
  );

  useEffect(() => {
    loadUserRecipes().then(setUserRecipes);
  }, []);

  const getIngredientQuantity = (recipeId: string, index: number) =>
    ingredientQuantities[`${recipeId}:${index}`] ?? 1;

  const changeIngredientQuantity = (recipe: Recipe, index: number, direction: 1 | -1) => {
    const key = `${recipe.id}:${index}`;
    const current = ingredientQuantities[key] ?? 1;
    const idx = QUANTITY_STEPS.indexOf(current);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= QUANTITY_STEPS.length) return;

    const nextQuantities = {...ingredientQuantities, [key]: QUANTITY_STEPS[nextIdx]};
    setIngredientQuantities(nextQuantities);

    if (onIngredientQuantityChange) {
      const quantities = recipe.ingredientNames.map((_, i) => nextQuantities[`${recipe.id}:${i}`] ?? 1);
      const totals = computeRecipeTotals(recipe, catalog, i => quantities[i]);
      onIngredientQuantityChange(recipe.id, quantities, {
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
      });
    }
  };

  const handleAdd = (
    recipe: Recipe,
    totals: RecipeTotals,
    isUserRecipe: boolean,
    sectionMealType: MealType,
    recipeIngredientQuantities: number[],
  ) => {
    // Quando usado dentro de OrganizationScreen, delega para o callback externo
    // em vez de persistir direto — o rascunho fica no pai.
    if (onAddRecipe) {
      onAddRecipe(recipe, totals, isUserRecipe, recipeIngredientQuantities);
      return;
    }

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    // Período vem da seção onde o "+" foi tocado — receita multi-horário
    // entra no período certo de cada seção.
    const period = MEAL_TYPE_TO_PERIOD[sectionMealType];
    const source = isUserRecipe
      ? {kind: 'recipeCustom' as const, recipeId: recipe.id, ingredientQuantities: recipeIngredientQuantities}
      : {kind: 'recipeFixed' as const, recipeId: recipe.id, ingredientQuantities: recipeIngredientQuantities};

    addImmediatePlannedItem(
      {dateKey: selectedDate, time, period, quantityMultiplier: 1, source},
      {
        name: recipe.name,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
      },
    );
    Alert.alert('Adicionado', `"${recipe.name}" adicionada ao diário.`);
  };

  const toggleExpanded = (recipeId: string) => {
    setExpandedId(prev => (prev === recipeId ? null : recipeId));
  };

  // --- Criação de receita própria ---

  const toggleIngredientSelection = (foodName: string) => {
    setSelectedIngredients(prev =>
      prev.includes(foodName) ? prev.filter(n => n !== foodName) : [...prev, foodName],
    );
  };

  const toggleNewMealType = (mealType: MealType) => {
    setNewMealTypes(prev =>
      prev.includes(mealType) ? prev.filter(m => m !== mealType) : [...prev, mealType],
    );
  };

  const resetCreateForm = () => {
    setNewName('');
    setNewMealTypes(['almoco']);
    setSelectedIngredients([]);
    setIngredientSearch('');
  };

  const openCreateModal = (initialMealType?: MealType) => {
    setEditingRecipeId(null);
    resetCreateForm();
    if (initialMealType) setNewMealTypes([initialMealType]);
    setModalVisible(true);
  };

  const openEditModal = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setNewName(recipe.name);
    setNewMealTypes(recipeMealTypes(recipe));
    setSelectedIngredients(recipe.ingredientNames);
    setIngredientSearch('');
    setModalVisible(true);
  };

  useImperativeHandle(ref, () => ({openCreateModal}));

  const handleSaveRecipe = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      Alert.alert('Nome obrigatório', 'Dê um nome para a receita.');
      return;
    }
    if (newMealTypes.length === 0) {
      Alert.alert('Escolha um horário', 'Marque pelo menos um horário para a receita.');
      return;
    }
    if (selectedIngredients.length === 0) {
      Alert.alert('Selecione ingredientes', 'Escolha pelo menos um ingrediente do catálogo.');
      return;
    }
    // Ordena os horários na ordem canônica do dia; mealType (legado) recebe o
    // primeiro deles pra compatibilidade com qualquer leitor antigo.
    const orderedMealTypes = MEAL_ORDER.filter(m => newMealTypes.includes(m));

    if (editingRecipeId) {
      const updated = userRecipes.map(r =>
        r.id === editingRecipeId
          ? {
              ...r,
              name: trimmedName,
              mealType: orderedMealTypes[0],
              mealTypes: orderedMealTypes,
              ingredientNames: selectedIngredients,
            }
          : r,
      );
      setUserRecipes(updated);
      saveUserRecipes(updated);
      // Itens já lançados no Diário a partir dessa receita ficam com um
      // valor congelado do momento em que foram adicionados (ver
      // CalorieContext.recalculateRecipeItems) -- sem isso, editar a
      // receita nunca refletiria nos itens já registrados.
      recalculateRecipeItems(editingRecipeId, catalog, [], updated);
      setModalVisible(false);
      setEditingRecipeId(null);
      resetCreateForm();
      return;
    }

    const newRecipe: Recipe = {
      id: `user-${Date.now()}`,
      name: trimmedName,
      emoji: '⭐',
      mealType: orderedMealTypes[0],
      mealTypes: orderedMealTypes,
      ingredientNames: selectedIngredients,
    };
    const updated = [...userRecipes, newRecipe];
    setUserRecipes(updated);
    saveUserRecipes(updated);
    setModalVisible(false);
    resetCreateForm();
  };

  // Selecionados primeiro: com muitos ingredientes, o usuário vê o que já
  // marcou sem precisar rolar a lista inteira.
  const filteredIngredientOptions = catalog
    .filter(food => food.name.toLowerCase().includes(ingredientSearch.trim().toLowerCase()))
    .sort((a, b) => {
      const aSel = selectedIngredients.includes(a.name) ? 0 : 1;
      const bSel = selectedIngredients.includes(b.name) ? 0 : 1;
      return aSel - bSel;
    });

  const handleDeleteRecipe = (recipe: Recipe) => {
    Alert.alert('Remover receita', `Remover "${recipe.name}"?`, [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const updated = userRecipes.filter(r => r.id !== recipe.id);
          setUserRecipes(updated);
          saveUserRecipes(updated);
        },
      },
    ]);
  };

  // --- Renderização ---

  const renderRecipeCard = (recipe: Recipe, isUserRecipe: boolean, sectionMealType: MealType) => {
    // Snapshot dos multiplicadores atuais, na ordem de ingredientNames — é o
    // que viaja com o item pro Diário (ver PlannedSource.ingredientQuantities).
    const recipeIngredientQuantities = recipe.ingredientNames.map((_, index) =>
      getIngredientQuantity(recipe.id, index),
    );
    const baseTotals = computeRecipeTotals(recipe, catalog, index => getIngredientQuantity(recipe.id, index));
    const macro = dominantMacro(baseTotals);
    const isExpanded = expandedId === recipe.id;

    return (
      <View key={`${sectionMealType}-${recipe.id}`} style={styles.recipeCard}>
        <View style={styles.recipeHeader}>
          <PressableScale
            style={styles.recipeTitleRow}
            onPress={() => toggleExpanded(recipe.id)}>
            <View style={[styles.recipeEmojiBadge, {backgroundColor: tintByMacro[macro]}]}>
              <FoodIcon token={recipe.emoji} size={18} color={iconColorByMacro[macro]} />
            </View>
            <View style={styles.recipeNameCol}>
              <Text style={styles.recipeName} numberOfLines={isExpanded ? 2 : 1}>
                {recipe.name}
              </Text>
              {!isExpanded && (
                <Text style={styles.collapsedSummary}>
                  {baseTotals.calories} kcal · {baseTotals.ingredients.length}{' '}
                  {baseTotals.ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}
                </Text>
              )}
            </View>
          </PressableScale>
          <View style={styles.headerActions}>
            {isUserRecipe && (
              <PressableScale style={styles.addButton} onPress={() => openEditModal(recipe)}>
                <Text style={styles.addButtonText}>✎</Text>
              </PressableScale>
            )}
            {isUserRecipe && (
              <PressableScale style={styles.addButton} onPress={() => handleDeleteRecipe(recipe)}>
                <Text style={styles.addButtonText}>×</Text>
              </PressableScale>
            )}
            <PressableScale
              style={styles.addButton}
              onPress={() =>
                handleAdd(recipe, baseTotals, isUserRecipe, sectionMealType, recipeIngredientQuantities)
              }>
              <Text style={styles.addButtonText}>+</Text>
            </PressableScale>
          </View>
        </View>

        <View style={styles.footerDivider} />
        <PressableScale
          style={styles.footerExpand}
          onPress={() => toggleExpanded(recipe.id)}>
          <View style={[styles.expandHandle, isExpanded && styles.expandHandleUp]} />
        </PressableScale>

        {isExpanded && (
          <>
            {baseTotals.ingredients.map((ing, index) => (
              <View key={`${recipe.id}-${index}`} style={styles.quantityRow}>
                <Text style={styles.quantityLabel} numberOfLines={1}>
                  {ing.name} ({ing.dosage})
                </Text>
                <View style={styles.quantityStepper}>
                  <PressableScale
                    style={styles.quantityButton}
                    onPress={() => changeIngredientQuantity(recipe, index, -1)}>
                    <Text style={styles.quantityButtonText}>−</Text>
                  </PressableScale>
                  <Text style={styles.quantityValue}>×{ing.quantity}</Text>
                  <PressableScale
                    style={styles.quantityButton}
                    onPress={() => changeIngredientQuantity(recipe, index, 1)}>
                    <Text style={styles.quantityButtonText}>+</Text>
                  </PressableScale>
                </View>
              </View>
            ))}

            <View style={styles.macroRow}>
              <Text style={styles.kcalText}>{baseTotals.calories} kcal</Text>
            </View>
            <View style={styles.macroRow}>
              <Text style={[styles.macroText, {color: colors.protein}]}>P: {baseTotals.protein.toFixed(1)}g</Text>
              <Text style={[styles.macroText, {color: colors.carbs}]}>C: {baseTotals.carbs.toFixed(1)}g</Text>
              <Text style={[styles.macroText, {color: colors.fat}]}>G: {baseTotals.fat.toFixed(1)}g</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  // Mapeamento período (OrganizationScreen) → mealType (Recipe)
  const PERIOD_TO_MEALTYPE: Record<string, MealType> = {
    manha: 'cafe',
    almoco: 'almoco',
    tarde: 'lanche',
    noite: 'janta',
  };
  const activeMealType = externalPeriod ? PERIOD_TO_MEALTYPE[externalPeriod] : undefined;

  // Receitas próprias entram direto na lista padrão, junto ao catálogo fixo,
  // em vez de ficarem numa aba separada. O toggle "Cadastradas" filtra pra
  // só as criadas pelo usuário (mesma mecânica do "Cadastrados" de alimentos).
  // Se a última receita própria for apagada com o filtro ligado, cai de volta
  // pra lista completa (o toggle também some) — evita tela vazia sem saída.
  const combinedRecipes =
    showOnlyUserRecipes && userRecipes.length > 0 ? userRecipes : [...RECIPES, ...userRecipes];

  const renderMealSections = (recipesList: Recipe[]) =>
    MEAL_ORDER.map(mealType => {
      if (activeMealType && mealType !== activeMealType) return null;
      // Receita multi-horário aparece em cada seção que marcou.
      const recipesForMeal = recipesList.filter(r => recipeMealTypes(r).includes(mealType));
      // O cabeçalho (título, toggle "Cadastradas" e "+ Criar receita") fica
      // sempre visível, mesmo com a lista vazia — antes, quando o filtro
      // "Cadastradas" não achava nenhuma receita própria naquele horário, a
      // seção inteira sumia (incluindo o próprio botão de criar receita),
      // deixando a tela em branco sem saída.

      return (
        <View key={mealType} style={styles.mealSection}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealTitle}>{MEAL_LABELS[mealType]}</Text>
            <View style={styles.mealTitleActions}>
              {userRecipes.length > 0 && (
                <PressableScale
                  style={[
                    styles.registeredToggle,
                    showOnlyUserRecipes && styles.registeredToggleActive,
                  ]}
                  onPress={() => setShowOnlyUserRecipes(v => !v)}>
                  <Text
                    style={[
                      styles.registeredToggleText,
                      showOnlyUserRecipes && styles.registeredToggleTextActive,
                    ]}>
                    Cadastradas
                  </Text>
                </PressableScale>
              )}
              <PressableScale style={styles.createRecipeButtonSmall} onPress={() => openCreateModal(mealType)}>
                <Text style={styles.createRecipeButtonSmallText}>+ Criar receita</Text>
              </PressableScale>
            </View>
          </View>
          <Text style={styles.mealHint}>{MEAL_HINTS[mealType]}</Text>
          {recipesForMeal.length > 0 ? (
            recipesForMeal.map(recipe =>
              renderRecipeCard(recipe, recipe.id.startsWith('user-'), mealType),
            )
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>
                {showOnlyUserRecipes
                  ? `Você ainda não tem receitas cadastradas para ${MEAL_LABELS[mealType].toLowerCase()}.`
                  : `Nenhuma receita disponível para ${MEAL_LABELS[mealType].toLowerCase()}.`}
              </Text>
              <PressableScale style={styles.emptyStateButton} onPress={() => openCreateModal(mealType)}>
                <Text style={styles.emptyStateButtonText}>
                  + Criar receita para {MEAL_LABELS[mealType].toLowerCase()}
                </Text>
              </PressableScale>
            </View>
          )}
        </View>
      );
    });

  return (
    <View>
      {catalog.length === 0 && <Text style={styles.loadingText}>Carregando receitas…</Text>}

      {catalog.length > 0 && renderMealSections(combinedRecipes)}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>{editingRecipeId ? 'Editar receita' : 'Nova receita'}</Text>

            {/* Nome e horários ficam fixos; só a lista de ingredientes rola. */}
            <TextInput
              style={styles.input}
              placeholder="Nome da receita"
              placeholderTextColor={colors.textFaint}
              value={newName}
              onChangeText={setNewName}
            />

            <View style={styles.modalSectionHeader}>
              <Text style={styles.modalSectionLabel}>Horários</Text>
              <Text style={styles.modalSectionHint}>marque um ou mais</Text>
            </View>
            {/* Bandeja lado a lado, mesmo estilo do seletor de período —
                só os ícones (sol nascendo / sol / nuvem / lua). */}
            <View style={styles.mealTypeTray}>
              {MEAL_ORDER.map(mealType => {
                const selected = newMealTypes.includes(mealType);
                return (
                  <PressableScale
                    key={mealType}
                    style={[styles.mealTypeTrayChip, selected && styles.mealTypeTrayChipActive]}
                    onPress={() => toggleNewMealType(mealType)}>
                    <MealPeriodIcon
                      period={MEAL_TYPE_TO_PERIOD[mealType]}
                      size={20}
                      color={selected ? '#FFF9F2' : colors.text}
                    />
                  </PressableScale>
                );
              })}
            </View>

            <View style={styles.modalSectionHeader}>
              <Text style={styles.modalSectionLabel}>Ingredientes</Text>
              {selectedIngredients.length > 0 && (
                <View style={styles.selectedCountBadge}>
                  <Text style={styles.selectedCountBadgeText}>{selectedIngredients.length}</Text>
                </View>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Pesquisar ingrediente…"
              placeholderTextColor={colors.textFaint}
              value={ingredientSearch}
              onChangeText={setIngredientSearch}
            />
            {/* Scroll próprio da lista — o resto do sheet não rola. */}
            <ScrollView
              style={styles.ingredientScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              <View style={styles.ingredientPickerWrap}>
                {filteredIngredientOptions.map(food => {
                  const selected = selectedIngredients.includes(food.name);
                  return (
                    <PressableScale
                      key={food.name}
                      style={[styles.ingredientChip, styles.ingredientChipRow, selected && styles.ingredientChipActive]}
                      onPress={() => toggleIngredientSelection(food.name)}>
                      <FoodIcon
                        token={selected ? '✓' : food.emoji}
                        size={14}
                        color={selected ? '#FFF9F2' : colors.text}
                      />
                      <Text
                        style={[styles.ingredientChipText, selected && styles.ingredientChipTextActive]}
                        numberOfLines={1}>
                        {' '}
                        {food.name}
                      </Text>
                    </PressableScale>
                  );
                })}
                {filteredIngredientOptions.length === 0 && (
                  <Text style={styles.loadingText}>Nenhum ingrediente encontrado.</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <PressableScale
                style={styles.modalButtonCancel}
                onPress={() => {
                  setModalVisible(false);
                  setEditingRecipeId(null);
                  resetCreateForm();
                }}>
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </PressableScale>
              <PressableScale style={styles.modalButtonSave} onPress={handleSaveRecipe}>
                <Text style={styles.modalButtonSaveText}>
                  {editingRecipeId
                    ? 'Salvar alterações'
                    : `Salvar${newMealTypes.length > 1 ? ` em ${newMealTypes.length} horários` : ''}`}
                </Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

export default RecipesSection;
