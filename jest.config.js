module.exports = {
  preset: '@react-native/jest-preset',
  // Resolver do react-native-worklets: troca os arquivos .native (que puxam
  // o módulo nativo) pela implementação JS nos testes — forma oficial de
  // rodar Reanimated 4 no Jest.
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFiles: ['./jest.setup.js'],
  // Pacotes distribuídos em ESM/não transpilados que o Babel precisa
  // processar (o padrão do preset ignora node_modules inteiro).
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-async-storage|@react-navigation|react-native-.*|@notifee)/)',
  ],
};
