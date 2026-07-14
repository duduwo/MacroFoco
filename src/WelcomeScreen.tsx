import React, {useState, useEffect, useMemo} from 'react';
import {View, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types/navigation';
import {useCalorie} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import PressableScale from './PressableScale';
import {LogoWordmark} from './LogoWordmark';
import {makeStyles} from './WelcomeScreen.styles';

const ACCEPTED_WARNING_KEY = '@macrofoco:acceptedWarning';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({navigation}: Props) {
  const {dailyGoal, hydrated} = useCalorie();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [accepted, setAccepted] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ACCEPTED_WARNING_KEY).then(value => {
      if (value === 'true') {
        setAccepted(true);
        setAlreadyAccepted(true);
      }
    });
  }, []);

  useEffect(() => {
    // Se o aviso já havia sido aceito em uma sessão anterior, pula esta tela
    // e vai direto para o app principal assim que os dados estiverem prontos.
    if (alreadyAccepted && hydrated) {
      if (dailyGoal !== null) {
        navigation.replace('MainTabs');
      } else {
        navigation.replace('AboutYou');
      }
    }
  }, [alreadyAccepted, hydrated, dailyGoal, navigation]);

  const toggleAccepted = () => {
    const next = !accepted;
    setAccepted(next);
    AsyncStorage.setItem(ACCEPTED_WARNING_KEY, next ? 'true' : 'false');
  };

  const handleContinue = () => {
    // Se já existe uma meta salva (usuário já passou pela configuração antes),
    // pula direto para o app principal em vez de repetir o fluxo de configuração.
    if (dailyGoal !== null) {
      navigation.navigate('MainTabs');
    } else {
      navigation.navigate('AboutYou');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <LogoWordmark markSize={110} />
      </View>

    <View style={styles.warningWrapper}>
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          As informações fornecidas pelo MacroFoco têm caráter informativo e não substituem a avaliação de um profissional da saúde.
        </Text>
      </View>
    </View>
    
      <View style={styles.acceptContainer}>
        <PressableScale
          style={styles.checkbox}
          onPress={toggleAccepted}>
          {accepted && <Text style={styles.checkmark}>✓</Text>}
        </PressableScale>

        <Text style={styles.acceptText}>
          Confirmo que li e compreendi este aviso.
        </Text>
      </View>

      <PressableScale
        style={[
          styles.button,
          (!hydrated || !accepted) && styles.buttonDisabled,
        ]}
        disabled={!hydrated || !accepted}
        onPress={handleContinue}>
        <Text style={styles.buttonText}>
          {hydrated ? 'Entendi, continuar' : 'Carregando...'}
        </Text>
      </PressableScale>
    </View>
  );
}