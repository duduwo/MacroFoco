import React from 'react';
import {Modal, View, Text, Pressable, ScrollView} from 'react-native';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import PressableScale from './PressableScale';
import {useTheme} from './context/ThemeContext';
import {AVATAR_TEMPLATE_IDS, AvatarTemplateImage, type AvatarTemplateId} from './AvatarTemplates';
import {makeStyles} from './AvatarPickerModal.styles';

function CameraIcon({color}: {color: string}) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <Circle cx="12" cy="12.5" r="3.4" />
    </Svg>
  );
}

function GalleryIcon({color}: {color: string}) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="4" width="16" height="16" rx="2" />
      <Circle cx="9" cy="9.5" r="1.6" />
      <Path d="M5 17.5 9.5 13a1.6 1.6 0 0 1 2.2 0L15 16" />
      <Path d="M13.5 14.5 15.3 12.7a1.6 1.6 0 0 1 2.2 0L19.5 15" />
    </Svg>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onPickFromGallery: () => void;
  onSelectTemplate: (id: AvatarTemplateId) => void;
};

// Picker de foto de perfil: tirar foto, escolher da galeria, ou usar um dos
// templates originais (AvatarTemplates.tsx -- sem depender de imagens
// baixadas de bancos/sites de pfp de terceiros).
export function AvatarPickerModal({
  visible,
  onClose,
  onTakePhoto,
  onPickFromGallery,
  onSelectTemplate,
}: Props) {
  const {colors} = useTheme();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.title}>Foto de perfil</Text>

          <View style={styles.actionRow}>
            <PressableScale style={styles.actionButton} onPress={onTakePhoto}>
              <CameraIcon color={colors.primary} />
              <Text style={styles.actionButtonText}>Tirar foto</Text>
            </PressableScale>
            <PressableScale style={styles.actionButton} onPress={onPickFromGallery}>
              <GalleryIcon color={colors.primary} />
              <Text style={styles.actionButtonText}>Galeria</Text>
            </PressableScale>
          </View>

          <Text style={styles.templatesLabel}>Ou escolha um template</Text>
          <ScrollView style={styles.templatesScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.templatesGrid}>
              {AVATAR_TEMPLATE_IDS.map(id => (
                <PressableScale
                  key={id}
                  style={styles.templateCell}
                  onPress={() => onSelectTemplate(id)}>
                  <AvatarTemplateImage id={id} size={56} />
                </PressableScale>
              ))}
            </View>
          </ScrollView>

          <PressableScale style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancelar</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}
