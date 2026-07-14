// Mocks de módulos nativos que não existem no ambiente de teste.
jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

jest.mock('react-native-vision-camera', () => ({
  Camera: () => null,
  useCameraDevice: () => null,
  useCameraPermission: () => ({hasPermission: false, requestPermission: jest.fn()}),
}));

jest.mock('react-native-vision-camera-barcode-scanner', () => ({
  CodeScanner: () => null,
}));
