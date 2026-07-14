import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from './types/navigation';
import {CalorieProvider} from './src/context/CalorieContext';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import WelcomeScreen from './src/WelcomeScreen';
import AboutYouScreen from './src/AboutYouScreen';
import GoalChoiceScreen from './src/GoalChoiceScreen';
import MacrosScreen from './src/MacrosScreen';
import TdeeScreen from './src/TdeeScreen';
import MainTabs from './src/MainTabs';
import ScannerScreen from './src/ScannerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Precisa estar dentro do ThemeProvider pra usar useTheme() — App() em si
// fica só com o wiring dos providers.
function AppNavigator() {
  const {colors, mode} = useTheme();

  // Tema do próprio NavigationContainer (fundo atrás das telas durante
  // transições, cor padrão de header/borda) — evita um flash claro ao trocar
  // de tela no modo escuro.
  const navigationTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerStyle: {backgroundColor: colors.background},
            headerShadowVisible: false,
            headerTintColor: colors.text,
            headerTitleStyle: {fontWeight: '700', fontSize: 16, color: colors.text},
          }}>
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{title: 'MacroFoco', headerShown: false}}
          />
          <Stack.Screen
            name="AboutYou"
            component={AboutYouScreen}
            options={{title: 'Sobre você'}}
          />
          <Stack.Screen
            name="GoalChoice"
            component={GoalChoiceScreen}
            options={{title: 'Suas metas'}}
          />
          <Stack.Screen
            name="Macros"
            component={MacrosScreen}
            options={{title: 'Seus macronutrientes'}}
          />
          <Stack.Screen
            name="Tdee"
            component={TdeeScreen}
            options={{title: 'Gasto calórico diário'}}
          />
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{headerShown: false}}
          />
          {/* Antiga aba Scanner — agora empilha por cima das abas (com botão
              de voltar), aberta pelo "Novo alimento" na tela de Alimentos. */}
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{title: 'Adicionar alimento'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CalorieProvider>
        <AppNavigator />
      </CalorieProvider>
    </ThemeProvider>
  );
}
