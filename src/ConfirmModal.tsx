import React from 'react';
import {Modal, View, Text, Pressable} from 'react-native';
import {useTheme} from './context/ThemeContext';
import PressableScale from './PressableScale';
import {makeStyles} from './ConfirmModal.styles';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tinge o botão de confirmar com a cor de destaque do app -- usar pra
   * ações irreversíveis (remover, etc). Default true. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Confirmação genérica no visual do próprio app (card + backdrop escuros),
// pra substituir o Alert.alert nativo em ações destrutivas -- o Alert do
// sistema é uma caixa branca fora do tema, destoando do resto do MacroFoco.
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Remover',
  cancelLabel = 'Cancelar',
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  const {colors} = useTheme();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <PressableScale style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </PressableScale>
            <PressableScale
              style={[styles.confirmButton, destructive && styles.confirmButtonDestructive]}
              onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </PressableScale>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
