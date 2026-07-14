import React, {useState, useMemo} from 'react';
import {View, Text, TextInput} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types/navigation';
import {useCalorie} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import {KCAL_PER_GRAM} from './foodMath';
import PressableScale from './PressableScale';
import {makeStyles} from './MacrosScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Macros'>;

export default function MacrosScreen({navigation, route}: Props) {
  const {setDailyGoal, setMacroGoals, setWeightKg} = useCalorie();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {weightKg} = route.params;
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const proteinG = Number(protein) || 0;
  const carbsG = Number(carbs) || 0;
  const fatG = Number(fat) || 0;

  const totalCalories =
    proteinG * KCAL_PER_GRAM.protein +
    carbsG * KCAL_PER_GRAM.carbs +
    fatG * KCAL_PER_GRAM.fat;

  const handleConfirm = () => {
    setDailyGoal(totalCalories);
    setMacroGoals({protein: proteinG, carbs: carbsG, fat: fatG});
    // Peso coletado em "Sobre você" — alimenta a meta de água (35 ml/kg) no
    // Diário mesmo quando os macros são informados na mão.
    setWeightKg(weightKg);
    navigation.navigate('MainTabs');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Proteínas (g)</Text>
      <TextInput
        style={[styles.input, styles.inputProtein]}
        keyboardType="numeric"
        value={protein}
        onChangeText={setProtein}
        placeholder="Ex: 150"
      />

      <Text style={styles.label}>Carboidratos (g)</Text>
      <TextInput
        style={[styles.input, styles.inputCarbs]}
        keyboardType="numeric"
        value={carbs}
        onChangeText={setCarbs}
        placeholder="Ex: 250"
      />

      <Text style={styles.label}>Gorduras (g)</Text>
      <TextInput
        style={[styles.input, styles.inputFat]}
        keyboardType="numeric"
        value={fat}
        onChangeText={setFat}
        placeholder="Ex: 70"
      />

      <View style={styles.resultBox}>
        <Text style={styles.resultText}>{totalCalories} kcal por dia</Text>
      </View>

      <PressableScale style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirmar meta</Text>
      </PressableScale>
    </View>
  );
}