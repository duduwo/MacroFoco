module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // O plugin de worklets precisa ser o ÚLTIMO da lista. No Reanimated 4 ele
  // vem do pacote react-native-worklets (não mais de react-native-reanimated).
  plugins: ['react-native-worklets/plugin'],
};
