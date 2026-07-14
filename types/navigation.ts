import type {AboutYouData} from '../src/tdeeMath';

export type RootStackParamList = {
  Welcome: undefined;
  // "Sobre você": coleta altura/peso/idade/sexo/atividade/objetivo — sempre o
  // primeiro passo, pra o peso ficar disponível em qualquer um dos dois
  // caminhos seguintes (cálculo automático ou seleção manual de macros).
  // initial pré-preenche o formulário. origin diferencia a edição iniciada
  // no Perfil (que segue adiante sem oferecer outro retorno pra cá) da edição
  // iniciada pelo link da própria GoalChoice.
  AboutYou: {initial?: AboutYouData; origin?: 'profile' | 'goals'} | undefined;
  // Escolha entre calcular metas automaticamente ou informar manualmente,
  // já com os dados de "Sobre você" em mãos.
  GoalChoice: {aboutYou: AboutYouData; showUpdateAboutYou?: boolean};
  Macros: {weightKg: number};
  Tdee: {aboutYou: AboutYouData};
  MainTabs: undefined;
  // Antiga aba Scanner — agora abre por cima das abas, a partir do botão
  // "Novo alimento" na tela de Alimentos (Organização).
  Scanner: undefined;
};

export type MainTabsParamList = {
  Diario: undefined;
  Organizacao: undefined;
  Perfil: undefined;
};
