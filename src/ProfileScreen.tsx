import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {View, Text, Image, TextInput, ScrollView, Switch} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, Circle, Line} from 'react-native-svg';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import type {RootStackParamList} from '../types/navigation';
import {useCalorie} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import {loadAboutYou} from './data/aboutYouStorage';
import {ACTIVITY_LEVELS, OBJECTIVES, type AboutYouData} from './tdeeMath';
import {
  requestNotificationPermission,
  scheduleDailyReminders,
  cancelAllReminders,
  type ReminderTime,
} from './notifications';
import {
  loadDiaryMascot,
  DIARY_MASCOT_NAMES,
  getDiaryMascotReminderMessages,
  type DiaryMascotId,
} from './data/mascotStorage';
import PressableScale from './PressableScale';
import {ProgressModal, GoalsInfoModal, TrendingUpIcon} from './DiaryInsightsModals';
import {AvatarPickerModal} from './AvatarPickerModal';
import {AvatarTemplateImage, isAvatarTemplateId, type AvatarTemplateId} from './AvatarTemplates';
import {spacing} from './theme';
import {makeStyles} from './ProfileScreen.styles';

const NAME_KEY = '@MacroFoco:profileName';
const PHOTO_KEY = '@MacroFoco:profilePhoto';
const AVATAR_TEMPLATE_KEY = '@MacroFoco:profileAvatarTemplate';
const NOTIFICATIONS_ENABLED_KEY = '@MacroFoco:notificationsEnabled';

const REMINDER_TIMES: ReminderTime[] = [
  {hour: 12, minute: 0},
  {hour: 19, minute: 0},
];

// --- Ícones de linha ---------------------------------------------------------
function ChevronRightIcon({color}: {color: string}) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}
function InfoIcon({color}: {color: string}) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Line x1="12" y1="11" x2="12" y2="16" />
      <Line x1="12" y1="8" x2="12" y2="8" />
    </Svg>
  );
}
function TargetIcon({color}: {color: string}) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Circle cx="12" cy="12" r="5" />
      <Circle cx="12" cy="12" r="1" />
    </Svg>
  );
}
function BellIcon({color}: {color: string}) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 8a6 6 0 0 1 12 0c0 4.2 1.2 6 2 7H4c.8-1 2-2.8 2-7Z" />
      <Path d="M10 20a2 2 0 0 0 4 0" />
    </Svg>
  );
}
type MenuRowProps = {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onPress: () => void;
};
function MenuRow({icon, label, hint, onPress}: MenuRowProps) {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <PressableScale style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuIconWrap}>{icon}</View>
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel}>{label}</Text>
        {hint && <Text style={styles.menuHint}>{hint}</Text>}
      </View>
      <ChevronRightIcon color={colors.textFaint} />
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const {dailyGoal, macroGoals, weightKg, waterGoalMl} = useCalorie();
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [avatarTemplate, setAvatarTemplate] = useState<AvatarTemplateId | null>(null);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [mascotId, setMascotId] = useState<DiaryMascotId>('foquinho');
  const [progressVisible, setProgressVisible] = useState(false);
  const [goalsInfoVisible, setGoalsInfoVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const [savedName, savedPhoto, savedTemplate, savedEnabled] = await Promise.all([
        AsyncStorage.getItem(NAME_KEY),
        AsyncStorage.getItem(PHOTO_KEY),
        AsyncStorage.getItem(AVATAR_TEMPLATE_KEY),
        AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
      ]);
      if (savedName) setName(savedName);
      if (savedPhoto) setPhotoUri(savedPhoto);
      if (savedTemplate && isAvatarTemplateId(savedTemplate)) setAvatarTemplate(savedTemplate);
      if (savedEnabled) setNotificationsEnabled(savedEnabled === '1');
    })();
  }, []);

  // Recarrega o mascote toda vez que a tela ganha foco (ele é escolhido no
  // Diário, em outra aba) e, se os lembretes já estiverem ligados, reagenda
  // com as falas do mascote atual — sem isso o texto ficaria desatualizado
  // até o usuário desligar/ligar o switch de novo.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const current = await loadDiaryMascot();
        if (cancelled) return;
        setMascotId(current);
        const enabled = (await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY)) === '1';
        if (enabled) {
          await scheduleDailyReminders(REMINDER_TIMES, getDiaryMascotReminderMessages(current));
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // "Suas informações" abre primeiro "Sobre você" já preenchido e só depois
  // segue para "Suas metas". Contas antigas sem resposta salva usam um padrão
  // razoável (incluindo o peso conhecido, quando houver).
  const handleEditGoals = async () => {
    const stack = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    const savedAboutYou = await loadAboutYou();
    const aboutYou: AboutYouData = savedAboutYou ?? {
      heightCm: 170,
      weightKg: weightKg && weightKg > 0 ? weightKg : 70,
      age: 30,
      gender: 'male',
      activityKey: ACTIVITY_LEVELS[0].key,
      objectiveKey: OBJECTIVES[1].key,
    };
    stack?.navigate('AboutYou', {initial: aboutYou, origin: 'profile'});
  };

  // Uma foto de verdade (câmera/galeria) e um template são mutuamente
  // exclusivos -- escolher um limpa o outro, senão o avatar renderizado
  // ficaria ambíguo (photoUri e avatarTemplate preenchidos ao mesmo tempo).
  const applyPhoto = (uri: string) => {
    setPhotoUri(uri);
    setAvatarTemplate(null);
    AsyncStorage.setItem(PHOTO_KEY, uri);
    AsyncStorage.removeItem(AVATAR_TEMPLATE_KEY);
  };

  const applyTemplate = (id: AvatarTemplateId) => {
    setAvatarTemplate(id);
    setPhotoUri(null);
    AsyncStorage.setItem(AVATAR_TEMPLATE_KEY, id);
    AsyncStorage.removeItem(PHOTO_KEY);
    setAvatarPickerVisible(false);
  };

  const handleTakePhoto = () => {
    setAvatarPickerVisible(false);
    launchCamera({mediaType: 'photo', quality: 0.7, saveToPhotos: true}, response => {
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      if (uri) applyPhoto(uri);
    });
  };

  const handlePickFromGallery = () => {
    setAvatarPickerVisible(false);
    launchImageLibrary({mediaType: 'photo', quality: 0.7}, response => {
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      if (uri) applyPhoto(uri);
    });
  };

  const handleNameEndEditing = () => {
    AsyncStorage.setItem(NAME_KEY, name.trim());
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleDailyReminders(REMINDER_TIMES, getDiaryMascotReminderMessages(mascotId));
    } else {
      await cancelAllReminders();
    }
    setNotificationsEnabled(value);
    AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, value ? '1' : '0');
  };

  const initials = name.trim().charAt(0).toUpperCase() || '👤';

  return (
    <ScrollView
      style={[styles.container, {paddingTop: spacing.lg + insets.top}]}
      contentContainerStyle={styles.content}>
      {/* --- Cabeçalho: avatar + nome --- */}
      <View style={styles.avatarSection}>
        <PressableScale style={styles.avatarWrapper} onPress={() => setAvatarPickerVisible(true)}>
          {photoUri ? (
            <Image source={{uri: photoUri}} style={styles.avatarImage} />
          ) : avatarTemplate ? (
            <AvatarTemplateImage id={avatarTemplate} size={styles.avatarWrapper.width} />
          ) : (
            <Text style={styles.avatarPlaceholderText}>{initials}</Text>
          )}
        </PressableScale>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          onEndEditing={handleNameEndEditing}
          placeholder="Seu nome"
          placeholderTextColor={colors.textFaint}
        />
        <Text style={styles.avatarEditHint}>Toque na foto para alterar</Text>
      </View>

      {/* --- Strip de stats: dados de identidade num relance --- */}
      <View style={styles.statStrip}>
        <View style={styles.statCell}>
          <Text style={[styles.statValue, {color: colors.primary}]}>{dailyGoal ?? '—'}</Text>
          <Text style={styles.statLabel}>kcal / dia</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{weightKg ? `${weightKg}` : '—'}</Text>
          <Text style={styles.statLabel}>peso (kg)</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={[styles.statValue, {color: colors.water}]}>{waterGoalMl}</Text>
          <Text style={styles.statLabel}>água (ml)</Text>
        </View>
      </View>

      {/* Macros da meta atual */}
      {macroGoals && (
        <View style={styles.macroRow}>
          <View style={styles.macroChip}>
            <View style={[styles.macroDot, {backgroundColor: colors.protein}]} />
            <Text style={styles.macroChipText}>Proteína {macroGoals.protein}g</Text>
          </View>
          <View style={styles.macroChip}>
            <View style={[styles.macroDot, {backgroundColor: colors.carbs}]} />
            <Text style={styles.macroChipText}>Carbo {macroGoals.carbs}g</Text>
          </View>
          <View style={styles.macroChip}>
            <View style={[styles.macroDot, {backgroundColor: colors.fat}]} />
            <Text style={styles.macroChipText}>Gordura {macroGoals.fat}g</Text>
          </View>
        </View>
      )}

      {/* --- Progresso em destaque --- */}
      <PressableScale style={styles.progressCard} onPress={() => setProgressVisible(true)}>
        <View style={styles.progressIconWrap}>
          <TrendingUpIcon size={22} color={colors.onPrimary} />
        </View>
        <View style={styles.progressTextWrap}>
          <Text style={styles.progressTitle}>Progresso</Text>
          <Text style={styles.progressHint}>Seu desempenho vs metas nos últimos 7 dias</Text>
        </View>
        <ChevronRightIcon color={colors.onPrimary} />
      </PressableScale>

      {/* --- Menu de ações --- */}
      <View style={styles.menuCard}>
        <MenuRow
          icon={<TargetIcon color={colors.primary} />}
          label="Suas informações"
          hint="Altura, peso, idade, atividade e objetivo"
          onPress={handleEditGoals}
        />
        <View style={styles.menuSeparator} />
        <MenuRow
          icon={<InfoIcon color={colors.primary} />}
          label="Como as metas são calculadas"
          hint="Fórmulas e estudos por trás dos números"
          onPress={() => setGoalsInfoVisible(true)}
        />
      </View>

      {/* --- Lembretes: mesmo padrão visual do menu de ações acima (ícone
          circular + título/hint) para ficar consistente com o resto da tela.
          Sem campo de texto livre — a mensagem é gerada automaticamente a
          partir do mascote escolhido no Diário, então o card fica compacto. --- */}
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchHeaderLeft}>
            <View style={styles.menuIconWrap}>
              <BellIcon color={colors.primary} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.switchLabel}>Lembretes diários</Text>
              <Text style={styles.menuHint}>
                Às 12h e 19h, com recados do {DIARY_MASCOT_NAMES[mascotId]}
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{true: colors.primary}}
          />
        </View>
      </View>

      <ProgressModal visible={progressVisible} onClose={() => setProgressVisible(false)} />
      <GoalsInfoModal visible={goalsInfoVisible} onClose={() => setGoalsInfoVisible(false)} />
      <AvatarPickerModal
        visible={avatarPickerVisible}
        onClose={() => setAvatarPickerVisible(false)}
        onTakePhoto={handleTakePhoto}
        onPickFromGallery={handlePickFromGallery}
        onSelectTemplate={applyTemplate}
      />
    </ScrollView>
  );
}
