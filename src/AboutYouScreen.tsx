import React, {useState, useMemo} from 'react';
import {View, Text, TextInput, ScrollView, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types/navigation';
import {ACTIVITY_LEVELS, OBJECTIVES, type ActivityKey, type ObjectiveKey, type Gender} from './tdeeMath';
import {useTheme} from './context/ThemeContext';
import PressableScale from './PressableScale';
import {saveAboutYou} from './data/aboutYouStorage';
import {spacing} from './theme';
import {makeStyles} from './AboutYouScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AboutYou'>;

// Primeiro passo do onboarding (e de "Suas informações", no Perfil): coleta
// altura, peso, idade, sexo, nível de atividade e objetivo — sempre, antes
// de perguntar se o cálculo será automático ou manual. Isso garante que o
// peso (usado na meta de água, 35 ml/kg) fique disponível mesmo quando a
// pessoa escolhe informar os macros na mão em vez de calcular (ver
// GoalChoiceScreen).
//
// route.params.initial pré-preenche o formulário. origin='profile' marca o
// fluxo Perfil → Sobre você → Suas metas; nesse caso a tela seguinte não
// oferece o link redundante de voltar para cá.
export default function AboutYouScreen({navigation, route}: Props) {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const initial = route.params?.initial;
  const isEditing = !!initial;
  const [height, setHeight] = useState(initial ? String(initial.heightCm) : '');
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : '');
  const [age, setAge] = useState(initial ? String(initial.age) : '');
  const [gender, setGender] = useState<Gender>(initial?.gender ?? 'male');
  const [activityKey, setActivityKey] = useState<ActivityKey>(initial?.activityKey ?? ACTIVITY_LEVELS[0].key);
  const [objectiveKey, setObjectiveKey] = useState<ObjectiveKey>(initial?.objectiveKey ?? OBJECTIVES[1].key);
  const [showActivityInfo, setShowActivityInfo] = useState(false);

  const heightCm = Number(height) || 0;
  const weightKg = Number(weight) || 0;
  const ageYears = Number(age) || 0;
  const isValid = heightCm > 0 && weightKg > 0 && ageYears > 0;

  const handleContinue = () => {
    if (!isValid) {
      Alert.alert('Faltou algo', 'Preencha altura, peso e idade para continuar.');
      return;
    }
    const aboutYou = {heightCm, weightKg, age: ageYears, gender, activityKey, objectiveKey};
    saveAboutYou(aboutYou);
    navigation.navigate('GoalChoice', {
      aboutYou,
      showUpdateAboutYou: route.params?.origin !== 'profile',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          Esses dados ajudam a calcular suas metas de calorias, macros e água.
        </Text>

        <View style={styles.section}>
          <View style={styles.numericFieldsRow}>
            <View style={styles.numericField}>
              <Text style={styles.compactLabel}>
                Altura <Text style={styles.fieldUnit}>cm</Text>
              </Text>
              <TextInput
                accessibilityLabel="Altura em centímetros"
                style={[styles.input, styles.compactInput]}
                keyboardType="numeric"
                maxLength={3}
                value={height}
                onChangeText={setHeight}
              />
            </View>

            <View style={styles.numericField}>
              <Text style={styles.compactLabel}>
                Peso <Text style={styles.fieldUnit}>kg</Text>
              </Text>
              <TextInput
                accessibilityLabel="Peso em quilogramas"
                style={[styles.input, styles.compactInput]}
                keyboardType="numeric"
                maxLength={5}
                value={weight}
                onChangeText={setWeight}
              />
            </View>

            <View style={styles.numericField}>
              <Text style={styles.compactLabel}>Idade</Text>
              <TextInput
                accessibilityLabel="Idade em anos"
                style={[styles.input, styles.compactInput]}
                keyboardType="numeric"
                maxLength={3}
                value={age}
                onChangeText={setAge}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Sexo biológico</Text>
          <View style={styles.optionsRow}>
            {(['male', 'female'] as const).map(g => (
              <PressableScale
                key={g}
                style={[styles.optionButton, gender === g && styles.optionButtonSelected]}
                onPress={() => setGender(g)}>
                <Text style={[styles.optionText, gender === g && styles.optionTextSelected]}>
                  {g === 'male' ? 'Masculino' : 'Feminino'}
                </Text>
              </PressableScale>
            ))}
          </View>

          <View style={styles.sectionDivider} />

          <Text style={styles.label}>Objetivo</Text>
          <View style={styles.optionsRow}>
            {OBJECTIVES.map(o => (
              <PressableScale
                key={o.key}
                style={[styles.optionButton, objectiveKey === o.key && styles.optionButtonSelected]}
                onPress={() => setObjectiveKey(o.key)}>
                <Text style={[styles.optionText, objectiveKey === o.key && styles.optionTextSelected]}>
                  {o.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Nível de atividade física</Text>
            <PressableScale
              style={styles.infoButton}
              onPress={() => setShowActivityInfo(!showActivityInfo)}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.infoIcon}>i</Text>
            </PressableScale>
          </View>
          {showActivityInfo && (
            <View style={styles.infoBox}>
              {ACTIVITY_LEVELS.map(a => (
                <Text key={a.key} style={styles.infoBoxText}>
                  <Text style={styles.infoBoxLabel}>{a.label}: </Text>
                  {a.description}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.optionsRow}>
            {ACTIVITY_LEVELS.map(a => (
              <PressableScale
                key={a.key}
                style={[styles.optionButton, activityKey === a.key && styles.optionButtonSelected]}
                onPress={() => setActivityKey(a.key)}>
                <Text style={[styles.optionText, activityKey === a.key && styles.optionTextSelected]}>
                  {a.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* paddingBottom soma o inset da barra de navegação do sistema — sem
          isso, em aparelhos com barra de navegação maior (comum em telas
          MIUI/Xiaomi), o botão fica espremido ou parcialmente coberto por ela. */}
      <View style={[styles.footer, {paddingBottom: spacing.md + insets.bottom}]}>
        <PressableScale
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleContinue}>
          <Text style={styles.buttonText}>{isEditing ? 'Completar' : 'Continuar'}</Text>
        </PressableScale>
      </View>
    </View>
  );
}
