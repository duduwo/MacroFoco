import React, {useMemo} from 'react';
import {View, Text} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types/navigation';
import {useTheme} from './context/ThemeContext';
import PressableScale from './PressableScale';
import {LogoMark} from './LogoMark';
import {makeStyles} from './GoalChoiceScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalChoice'>;

// Segundo passo do onboarding: com altura/peso/idade/atividade/objetivo já
// coletados (AboutYouScreen), pergunta só como definir as metas — calcular
// automaticamente (Tdee) ou informar os macros manualmente (Macros). Os dois
// caminhos recebem o peso já coletado, então a meta de água nunca fica sem
// dado, seja qual for o caminho escolhido aqui.
export default function GoalChoiceScreen({navigation, route}: Props) {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {aboutYou, showUpdateAboutYou = true} = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <LogoMark size={120} />
      </View>
      <Text style={styles.title}>Como você quer definir suas metas?</Text>
      <PressableScale
        style={styles.button}
        onPress={() => navigation.navigate('Tdee', {aboutYou})}>
        <Text style={styles.buttonText}>Calcular automaticamente</Text>
      </PressableScale>
      <PressableScale
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => navigation.navigate('Macros', {weightKg: aboutYou.weightKg})}>
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
          Já sei a divisão dos meus macronutrientes
        </Text>
      </PressableScale>

      {showUpdateAboutYou && (
        <PressableScale
          style={styles.linkButton}
          onPress={() =>
            navigation.navigate('AboutYou', {initial: aboutYou, origin: 'goals'})
          }>
          <Text style={styles.linkButtonText}>Atualizar suas informações</Text>
        </PressableScale>
      )}
    </View>
  );
}
