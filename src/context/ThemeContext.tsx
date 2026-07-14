import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getThemeColors, type ThemeColors, type ThemeMode} from '../theme';

const STORAGE_KEY = 'macrofoco:themeMode';

type ThemeContextType = {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({children}: {children: React.ReactNode}) {
  // Parte do esquema do sistema (claro/escuro do celular) até o usuário
  // escolher manualmente — a partir daí, a escolha manual persiste e vale
  // sobre o esquema do sistema.
  const [mode, setMode] = useState<ThemeMode>(() =>
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  const toggleTheme = () => {
    setMode(prev => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const colors = useMemo(() => getThemeColors(mode), [mode]);

  return (
    <ThemeContext.Provider value={{mode, colors, toggleTheme}}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme precisa ser usado dentro de ThemeProvider');
  }
  return context;
}
