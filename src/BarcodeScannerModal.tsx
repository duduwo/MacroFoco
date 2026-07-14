import React, {useEffect, useState} from 'react';
import {Modal, View, Text, ActivityIndicator} from 'react-native';
import PressableScale from './PressableScale';
import {useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import {CodeScanner} from 'react-native-vision-camera-barcode-scanner';
import {styles} from './BarcodeScannerModal.styles';

export type ScannedProduct = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onProductFound: (product: ScannedProduct) => void;
  onProductNotFound: () => void;
};

// Resposta parcial da API do Open Food Facts — só os campos que consumimos.
type OpenFoodFactsResponse = {
  status: number;
  product?: {
    product_name?: string;
    nutriments?: Record<string, number>;
  };
};

async function fetchProductByBarcode(barcode: string): Promise<ScannedProduct | null> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,nutriments`,
  );
  const data = (await response.json()) as OpenFoodFactsResponse;
  if (data.status !== 1) return null;

  const nutriments = data.product?.nutriments ?? {};
  return {
    name: data.product?.product_name || 'Produto sem nome',
    calories: Math.round(nutriments['energy-kcal_100g'] ?? 0),
    protein: Math.round(nutriments.proteins_100g ?? 0),
    carbs: Math.round(nutriments.carbohydrates_100g ?? 0),
    fat: Math.round(nutriments.fat_100g ?? 0),
  };
}

export default function BarcodeScannerModal({
  visible,
  onClose,
  onProductFound,
  onProductNotFound,
}: Props) {
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermission();
    }
    if (visible) {
      setScanned(false);
    }
  }, [visible, hasPermission, requestPermission]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {hasPermission && device ? (
        <CodeScanner
          style={styles.camera}
          isActive={visible}
          barcodeFormats={['ean-13', 'ean-8', 'upc-a', 'upc-e']}
          onBarcodeScanned={barcodes => {
            const barcode = barcodes[0]?.rawValue;
            if (!barcode || scanned) return;
            setScanned(true);
            setLoading(true);
            fetchProductByBarcode(barcode)
              .then(product => (product ? onProductFound(product) : onProductNotFound()))
              .catch(() => onProductNotFound())
              .finally(() => setLoading(false));
          }}
          onError={() => onProductNotFound()}
        />
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>
              {hasPermission
                ? 'Nenhuma câmera disponível neste dispositivo.'
                : 'Precisamos da sua permissão para usar a câmera.'}
            </Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFF9F2" />
            <Text style={styles.loadingText}>Buscando produto...</Text>
          </View>
        )}

        <PressableScale style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cancelar</Text>
        </PressableScale>
      </View>
    </Modal>
  );
}