import React, {useMemo} from 'react';
import {View, Text} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types/navigation';
import {useCalorie} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import {ACTIVITY_LEVELS, OBJECTIVES, computeTdeeGoals} from './tdeeMath';
import PressableScale from './PressableScale';
import {makeStyles} from './TdeeScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Tdee'>;

// Segunda metade do cálculo automático: os dados (altura/peso/idade/sexo/
// atividade/objetivo) já vieram prontos de AboutYouScreen via route.params —
// aqui só mostramos o resultado e confirmamos.
export default function TdeeScreen({navigation, route}: Props) {
  const {setDailyGoal, setMacroGoals, setWeightKg} = useCalorie();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {aboutYou} = route.params;

  const {totalCalories, proteinG, carbsG, fatG} = computeTdeeGoals(aboutYou);
  const activityLabel = ACTIVITY_LEVELS.find(a => a.key === aboutYou.activityKey)?.label;
  const objectiveLabel = OBJECTIVES.find(o => o.key === aboutYou.objectiveKey)?.label;

  const handleConfirm = () => {
    setDailyGoal(totalCalories);
    setMacroGoals({protein: proteinG, carbs: carbsG, fat: fatG});
    // Persiste o peso pra alimentar a meta de água (35 ml/kg) no Diário.
    setWeightKg(aboutYou.weightKg);
    navigation.navigate('MainTabs');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sua meta calculada</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipText}>{aboutYou.heightCm} cm</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipText}>{aboutYou.weightKg} kg</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipText}>{aboutYou.age} anos</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipText}>{activityLabel}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipText}>{objectiveLabel}</Text>
        </View>
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.resultText}>{totalCalories} kcal</Text>
        <Text style={styles.resultSubtext}>
          Proteína {proteinG}g · Carbo {carbsG}g · Gordura {fatG}g
        </Text>
      </View>

      <PressableScale style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirmar meta</Text>
      </PressableScale>
    </View>
  );
}
