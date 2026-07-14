import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {LogoMark} from './LogoMark';
import {useTheme} from './context/ThemeContext';

// Logo completa (marca + "Macro Foco" + tagline) recriada sem PNG -- o
// arquivo antigo (assets/images/logo.png) tinha um quadrado creme carimbado
// como fundo, que destoava do modo escuro (mesmo problema já resolvido pro
// ícone sozinho em LogoMark.tsx). Aqui o texto usa as cores do tema
// (colors.text/colors.primary), então se adapta sozinho a claro/escuro; só
// a marca (anel + círculo) mantém as cores fixas da identidade visual.
export function LogoWordmark({markSize = 120}: {markSize?: number}) {
  const {colors} = useTheme();

  return (
    <View style={styles.container}>
      <LogoMark size={markSize} />
      <Text style={[styles.title, {color: colors.text}]}>Macro Foco</Text>
      <Text style={[styles.subtitle, {color: colors.primary}]}>CONTROLE CALÓRICO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    marginTop: 18,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: Platform.select({ios: 'Georgia', android: 'serif'}),
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
