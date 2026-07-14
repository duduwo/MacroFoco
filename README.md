# MacroFoco

App mobile de acompanhamento nutricional feito em React Native — registro de refeições, metas de macros, água, receitas e alimentação programada por período do dia.

## Sobre o projeto

O MacroFoco ajuda a registrar o que você come ao longo do dia e acompanhar o quanto falta pra bater a meta diária de calorias e macronutrientes (proteína, carboidrato e gordura). Além do diário, o app tem um planejador de refeições por período (manhã/almoço/tarde/noite), receitas com cálculo automático de macros por ingrediente, e lembretes diários personalizados de acordo com o mascote escolhido.

Desenvolvido com apoio de IA (Claude Code) como parte do fluxo de trabalho — decisões de arquitetura, UX e revisão de código são próprias.

### Funcionalidades

- Diário com anel de progresso de calorias e macros, e mascote que evolui com o uso
- Planejamento de refeições por período (manhã, almoço, tarde, noite)
- Catálogo de alimentos com base na [TACO](http://www.nepa.unicamp.br/taco/) (Tabela Brasileira de Composição de Alimentos) e comparado aos dados de consumo do IBGE (POF 2017-2018)
- Criação de receitas próprias, com ajuste de porção por ingrediente
- Escaneamento de código de barras e câmera para adicionar alimentos
- Metas calculadas automaticamente (TDEE) a partir de altura, peso, idade, sexo, nível de atividade e objetivo — ou definidas manualmente
- Lembretes diários personalizados por notificação local, com mensagens diferentes conforme o mascote escolhido
- Acompanhamento de consumo de água
- Tema claro/escuro

### Tecnologias

- [React Native](https://reactnative.dev) 0.86 (New Architecture) + TypeScript
- [React Navigation](https://reactnavigation.org) (bottom tabs + native stack)
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/) para as animações da interface
- [Notifee](https://notifee.app) para notificações locais
- [React Native Vision Camera](https://react-native-vision-camera.com) + leitor de código de barras
- AsyncStorage para persistência local
- Jest para testes

## Rodando o projeto

> Antes de começar, siga o guia [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) do React Native.

Instale as dependências:

```sh
npm install
```

Inicie o Metro:

```sh
npm start
```

Em outro terminal, rode no Android ou iOS:

```sh
npm run android
# ou
npm run ios
```

Para iOS, antes da primeira execução (e sempre que atualizar dependências nativas), instale os pods:

```sh
bundle install
bundle exec pod install
```

## Licença

Distribuído sob a licença MIT — veja [LICENSE](LICENSE).
