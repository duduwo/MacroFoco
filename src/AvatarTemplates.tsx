import React from 'react';
import {View, StyleSheet} from 'react-native';
import {FoodIcon, type FoodIconCategory} from './FoodIcon';
import {useTheme} from './context/ThemeContext';
import type {ThemeColors} from './theme';

// Templates de foto de perfil originais (sem imagem nenhuma baixada de
// fora) -- um ícone de comida (mesmo catálogo do FoodIcon) sobre um círculo
// colorido, temático com o app. Evita depender de bancos de imagem/pfp de
// terceiros com licença duvidosa.
export type AvatarTemplateId =
  | 'apple'
  | 'citrus'
  | 'grape'
  | 'fish'
  | 'poultry'
  | 'cheese'
  | 'leafy'
  | 'berry'
  | 'pineapple'
  | 'shaker';

type BgKey = Extract<keyof ThemeColors, 'protein' | 'carbs' | 'fat' | 'water' | 'primary'>;

const TEMPLATES: {id: AvatarTemplateId; category: FoodIconCategory; bg: BgKey}[] = [
  {id: 'apple', category: 'apple', bg: 'protein'},
  {id: 'citrus', category: 'citrus', bg: 'carbs'},
  {id: 'grape', category: 'grape', bg: 'fat'},
  {id: 'fish', category: 'fish', bg: 'water'},
  {id: 'poultry', category: 'poultry', bg: 'primary'},
  {id: 'cheese', category: 'cheese', bg: 'carbs'},
  {id: 'leafy', category: 'leafy', bg: 'fat'},
  {id: 'berry', category: 'berry', bg: 'protein'},
  {id: 'pineapple', category: 'pineapple', bg: 'carbs'},
  {id: 'shaker', category: 'shaker', bg: 'water'},
];

export const AVATAR_TEMPLATE_IDS: AvatarTemplateId[] = TEMPLATES.map(t => t.id);

function isAvatarTemplateId(value: string): value is AvatarTemplateId {
  return (AVATAR_TEMPLATE_IDS as string[]).includes(value);
}

export function AvatarTemplateImage({id, size = 64}: {id: AvatarTemplateId; size?: number}) {
  const {colors} = useTheme();
  const template = TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0];
  return (
    <View
      style={[
        styles.circle,
        {width: size, height: size, borderRadius: size / 2, backgroundColor: colors[template.bg]},
      ]}>
      <FoodIcon token={template.category} size={size * 0.5} color={colors.onPrimary} />
    </View>
  );
}

export {isAvatarTemplateId};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
