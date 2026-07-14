import React, {useState, useRef, useMemo} from 'react';
import {View, Text, TextInput, ScrollView, Alert, Animated} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import PressableScale from './PressableScale';

import {makeStyles} from './ScannerScreen.styles';
import {useTheme} from './context/ThemeContext';
import BarcodeScannerModal, {type ScannedProduct} from './BarcodeScannerModal';
import {scaleMacros} from './foodMath';
import type {Food} from './data/foodCatalogStorage';
import {loadUserFoods, saveUserFoods} from './data/userFoodsStorage';

type IconProps = {size?: number; color: string; style?: StyleProp<ViewStyle>};



function SaveIcon({size = 17, color}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 4.5A1.5 1.5 0 016.5 3h9.17a1.5 1.5 0 011.06.44l2.83 2.83c.28.28.44.66.44 1.06V19.5A1.5 1.5 0 0118.5 21h-13A1.5 1.5 0 014 19.5v-15z" />
      <Path d="M8 3v5h8V3" />
      <Path d="M8 21v-6.5h8V21" />
    </Svg>
  );
}

function ChevronDownIcon({size = 16, color, style}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}>
      <Path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

function PackageIcon({size = 28, color}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3.5 8.2L12 3.5l8.5 4.7v7.6L12 20.5l-8.5-4.7V8.2z" />
      <Path d="M3.7 8.4L12 13l8.3-4.6" />
      <Path d="M12 13v7.4" />
    </Svg>
  );
}

function CameraIcon({size = 20, color}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 8a2 2 0 012-2h1.6l1.1-1.5A2 2 0 0110.3 3.7h3.4a2 2 0 011.6.8L16.4 6H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
      <Circle cx="12" cy="13" r="3.2" />
    </Svg>
  );
}

function EditIcon({size = 19, color}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 20h4.3L18.4 9.9a2 2 0 000-2.8l-1.5-1.5a2 2 0 00-2.8 0L4 15.7V20z" />
      <Path d="M13.6 6.6l3.8 3.8" />
    </Svg>
  );
}

function ChevronRightIcon({size = 18, color}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

// Alert.alert() de confirmação — ver AI_CONTEXT.md ("Problemas históricos"):
// usar setTimeout(...,0) por causa do Bridgeless.
function confirmAlert(title: string, message: string, onConfirm: () => void) {
  setTimeout(() => {
    Alert.alert(title, message, [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Apagar', style: 'destructive', onPress: onConfirm},
    ]);
  }, 0);
}


export default function ScannerScreen() {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);

  // Toast in-app
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastOpacity, {toValue: 1, duration: 200, useNativeDriver: true}),
      Animated.delay(1600),
      Animated.timing(toastOpacity, {toValue: 0, duration: 200, useNativeDriver: true}),
    ]).start();
    toastTimeout.current = setTimeout(() => setToastMessage(''), 2000);
  };
  // Produto original (valores por 100g, vindos do Open Food Facts) e a
  // quantidade em gramas escolhida pelo usuário. Só existe quando o alimento
  // veio do scanner — permite recalcular os macros proporcionalmente.
  const [baseProduct, setBaseProduct] = useState<ScannedProduct | null>(null);
  const [grams, setGrams] = useState('100');
  const [showUserFoods, setShowUserFoods] = useState(false);
  const [userFoods, setUserFoods] = useState<Food[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);

  const handleToggleUserFoods = async () => {
    if (!showUserFoods) {
      const foods = await loadUserFoods();
      setUserFoods(foods);
    }
    setShowUserFoods(prev => !prev);
  };

  const handleDeleteUserFood = (index: number) => {
    const food = userFoods[index];
    confirmAlert('Apagar alimento', `Remover "${food.name}" do catálogo personalizado?`, async () => {
      const updated = userFoods.filter((_, i) => i !== index);
      await saveUserFoods(updated);
      setUserFoods(updated);
    });
  };

  const handleDeleteAllUserFoods = () => {
    confirmAlert('Apagar todos', 'Remover todos os alimentos personalizados criados?', async () => {
      await saveUserFoods([]);
      setUserFoods([]);
    });
  };

  const handleProductFound = (product: ScannedProduct) => {
    setBaseProduct(product);
    setGrams('100');
    setName(product.name);
    setCalories(String(product.calories));
    setProtein(String(product.protein));
    setCarbs(String(product.carbs));
    setFat(String(product.fat));
    setScannerVisible(false);
  };

  const handleGramsChange = (value: string) => {
    setGrams(value);
    if (!baseProduct) return;
    const multiplier = (Number(value.replace(',', '.')) || 0) / 100;
    const scaled = scaleMacros(baseProduct, multiplier);
    setCalories(String(scaled.calories));
    setProtein(String(scaled.protein));
    setCarbs(String(scaled.carbs));
    setFat(String(scaled.fat));
  };

  const handleProductNotFound = () => {
    setScannerVisible(false);
    Alert.alert(
      'Produto não encontrado',
      'Não encontramos esse código na base do Open Food Facts. Preencha os campos manualmente.',
    );
  };

  const resetForm = () => {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setBaseProduct(null);
    setGrams('100');
    setShowManualForm(false);
  };

  const handleSaveCustomFood = async () => {
    if (!name.trim() || !calories.trim()) {
      Alert.alert('Faltou algo', 'Preencha ao menos o nome e as calorias.');
      return;
    }

    const newFood: Food = {
      emoji: '🍽️',
      name: name.trim(),
      dosage: baseProduct ? `${grams}g` : '1 porção',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    };

    const existing = await loadUserFoods();
    const updatedUserFoods = [...existing, newFood];
    await saveUserFoods(updatedUserFoods);
    if (showUserFoods) {
      setUserFoods(updatedUserFoods);
    }

    resetForm();
    showToast('Alimento adicionado na lista');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {toastMessage !== '' && (
        <Animated.View style={[styles.toast, {opacity: toastOpacity}]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
      {/* Título vem do cabeçalho nativo da tela (stack) — aqui só o apoio. */}
      <Text style={styles.subtitle}>Escolha como deseja registrar o alimento no diário de hoje.</Text>

      <View style={styles.menuList}>
        <PressableScale style={styles.menuCard} onPress={() => setScannerVisible(true)}>
          <View style={styles.menuCardIconWrap}>
            <CameraIcon size={20} color={colors.primary} />
          </View>
          <View style={styles.menuCardTextWrap}>
            <Text style={styles.menuCardTitle}>Ler código de barras</Text>
            <Text style={styles.menuCardSubtitle}>
              Escaneie o produto para preencher automaticamente
            </Text>
          </View>
          <ChevronRightIcon size={18} color={colors.textMuted} />
        </PressableScale>

        <PressableScale
          style={[styles.menuCard, showManualForm && styles.menuCardActive]}
          onPress={() => setShowManualForm(prev => !prev)}>
          <View style={styles.menuCardIconWrap}>
            <EditIcon size={19} color={colors.primary} />
          </View>
          <View style={styles.menuCardTextWrap}>
            <Text style={styles.menuCardTitle}>Adicionar manualmente</Text>
            <Text style={styles.menuCardSubtitle}>Ou receba os dados do scanner</Text>
          </View>
          <ChevronDownIcon
            size={18}
            color={colors.textMuted}
            style={[styles.chevron, showManualForm && styles.chevronRotated]}
          />
        </PressableScale>

        {showManualForm && (
          <View style={styles.manualFormBox}>
            <Text style={[styles.label, styles.labelFirst]}>Nome do alimento</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Salada de atum"
              placeholderTextColor={colors.textFaint}
            />

            <View style={[styles.row, styles.rowSpacingTop]}>
              <View style={styles.rowItem}>
                <Text style={styles.rowItemLabel}>Quantidade (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={grams}
                  onChangeText={handleGramsChange}
                  placeholder="100"
                  placeholderTextColor={colors.textFaint}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowItemLabel}>Calorias (kcal)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="Ex: 220"
                  placeholderTextColor={colors.textFaint}
                />
              </View>
            </View>

            <View style={styles.sectionDivider} />
            <Text style={styles.label}>Macros (g)</Text>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <View style={styles.macroInputLabel}>
                  <View style={[styles.macroDot, {backgroundColor: colors.protein}]} />
                  <Text style={styles.macroInputLabelText}>Proteína</Text>
                </View>
                <TextInput
                  style={styles.macroInput}
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="0"
                  placeholderTextColor={colors.textFaint}
                />
              </View>
              <View style={styles.rowItem}>
                <View style={styles.macroInputLabel}>
                  <View style={[styles.macroDot, {backgroundColor: colors.carbs}]} />
                  <Text style={styles.macroInputLabelText}>Carbo</Text>
                </View>
                <TextInput
                  style={styles.macroInput}
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="0"
                  placeholderTextColor={colors.textFaint}
                />
              </View>
              <View style={styles.rowItem}>
                <View style={styles.macroInputLabel}>
                  <View style={[styles.macroDot, {backgroundColor: colors.fat}]} />
                  <Text style={styles.macroInputLabelText}>Gordura</Text>
                </View>
                <TextInput
                  style={styles.macroInput}
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={setFat}
                  placeholder="0"
                  placeholderTextColor={colors.textFaint}
                />
              </View>
            </View>

            <PressableScale style={styles.button} onPress={handleSaveCustomFood}>
              <View style={styles.buttonContent}>
                <SaveIcon size={20} color="#FFF9F2" />
                <Text style={styles.buttonText}>Salvar alimento personalizado</Text>
              </View>
            </PressableScale>
          </View>
        )}

        <View style={[styles.userFoodsWrapper, showUserFoods && styles.userFoodsWrapperActive]}>
          <PressableScale style={styles.userFoodsHeaderRow} onPress={handleToggleUserFoods}>
            <View style={styles.menuCardIconWrap}>
              <PackageIcon size={19} color={colors.primary} />
            </View>
            <View style={styles.menuCardTextWrap}>
              <View style={styles.userFoodsTitleRow}>
                <Text style={styles.menuCardTitle}>Alimentos criados</Text>
                <View style={styles.userFoodsCountBadge}>
                  <Text style={styles.userFoodsCountBadgeText}>{userFoods.length}</Text>
                </View>
              </View>
              {/* Some quando expandido -- vira redundante com o conteúdo logo
                  abaixo, e volta a aparecer ao recolher. */}
              {!showUserFoods && (
                <Text style={styles.menuCardSubtitle}>
                  Veja e reutilize seus alimentos personalizados
                </Text>
              )}
            </View>
            <ChevronDownIcon
              size={18}
              color={colors.textMuted}
              style={[styles.chevron, showUserFoods && styles.chevronRotated]}
            />
          </PressableScale>

          {showUserFoods && (
            <View style={styles.userFoodsBody}>
              {userFoods.length > 0 && (
                <View style={styles.userFoodsBodyActions}>
                  <PressableScale style={styles.deleteAllButton} onPress={handleDeleteAllUserFoods}>
                    <Text style={styles.deleteAllButtonText}>Apagar todos</Text>
                  </PressableScale>
                </View>
              )}

              {userFoods.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIconWrap}>
                    <PackageIcon size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyStateTitle}>Nenhum alimento salvo</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Salve alimentos personalizados para encontrá-los rapidamente da próxima vez.
                  </Text>
                </View>
              ) : (
                userFoods.map((food, index) => (
                  <View key={`${food.name}-${index}`} style={styles.userFoodItem}>
                    <Text style={styles.userFoodItemText} numberOfLines={1}>
                      {food.emoji} {food.name}
                    </Text>
                    <PressableScale
                      style={styles.userFoodDeleteButton}
                      onPress={() => handleDeleteUserFood(index)}>
                      <Text style={styles.userFoodDeleteButtonText}>🗑️</Text>
                    </PressableScale>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </View>

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onProductFound={handleProductFound}
        onProductNotFound={handleProductNotFound}
      />
    </ScrollView>
  );
}