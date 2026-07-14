# AI_CONTEXT.md — MacroFoco

Documento vivo de contexto para quem (humano ou IA) for mexer neste
código depois. O código-fonte referencia este arquivo em comentários
(`ver AI_CONTEXT.md`) sempre que uma decisão de arquitetura não é óbvia
só de ler a função. Mantenha as seções abaixo atualizadas conforme o
projeto evolui — um comentário no código que aponta pra uma seção que
não existe mais é pior que nenhum comentário.

## O que é o MacroFoco

App de contagem de calorias/macronutrientes em React Native (Android,
não testado em iOS). Fluxo central: o usuário define uma meta calórica
(calculada ou manual), registra o que come ao longo do dia — por
catálogo, código de barras ou receita — e acompanha o progresso num
anel de macros no Diário.

## Stack

- **React Native 0.86** + **New Architecture** (Bridgeless) habilitada
  (`android/gradle.properties: newArchEnabled=true`) — isso importa
  porque `Alert.alert()` tem uma pegadinha nessa arquitetura, ver
  "Problemas históricos" abaixo.
- **React 19**, **TypeScript 5.8**.
- **React Navigation** (`native-stack` para o fluxo raiz/onboarding,
  `bottom-tabs` para as 3 abas principais).
- **Reanimated 4** + **react-native-worklets** — usado no seletor de
  período (`MealPeriodSelector`) e no `PressableScale` (micro-animação
  de toque padrão do app). RN 0.86 + New Arch exige a v4 do Reanimated,
  que por sua vez exige o pacote `react-native-worklets` separado (não
  vem mais embutido no Reanimated). O Jest também precisa do resolver
  dele (`react-native-worklets/jest/resolver.js`) e dos mocks oficiais
  de Reanimated/Notifee/AsyncStorage/VisionCamera — tudo já configurado
  em `jest.config.js` + `jest.setup.js`.
- **AsyncStorage** para toda a persistência local (não tem backend).
- **react-native-vision-camera** + **-barcode-scanner** para o scanner
  de código de barras (Open Food Facts).
- **Notifee** para notificações locais dos itens agendados.

## Mapa de arquivos (`src/`)

**Telas de onboarding** (stack raiz, ver seção Navegação):
`WelcomeScreen`, `AboutYouScreen`, `GoalChoiceScreen`, `TdeeScreen`,
`MacrosScreen`.

**Abas principais** (`MainTabs.tsx`): `DiaryScreen` (Diário),
`OrganizationScreen` (Alimentos — inclui `FoodActionsSection` e
`RecipesSection` como sub-abas), `ProfileScreen` (Perfil).

**Empilhada por cima das abas**: `ScannerScreen` (código de barras /
manual / alimentos criados — antiga 4ª aba, ver histórico).

**Componentes de Diário/Agendamento**: `ScheduledAgendaSection`
(lista "Alimentação Programada" dentro do Diário), `DiaryCalendarModal`,
`DiaryInsightsModals` (modais "Progresso" e "Como as metas são
calculadas"), `QuickScheduleModal` + `TimeSlotPicker` (atalho "Agendar
nesse dia"), `ThemeToggle` (sol/lua animado, no canto do header do
Diário), `DiaryMascot` (despacha o pet selecionado: `MutantDropMascot`,
`SproutMascot` ou `PanelitoMascot`; todos evoluem com os alimentos/macros e
reagem ao tema), `FoquinhoStatesModal` (seletor dos três pets + cinco estados
e critérios de cada um), `ConfirmModal`
(confirmação genérica no visual do app, usada
em ações destrutivas em vez do `Alert.alert` nativo).

**Ícones/identidade visual** (ver seção "Ícones" abaixo):
`FoodIcon.tsx` (categoria → MaterialCommunityIcons, pro catálogo de
alimentos/receitas), `TabIcons.tsx` (ícones da barra de abas),
`LogoMark.tsx`/`LogoWordmark.tsx` (marca do app em SVG, sem PNG).

**Foto de perfil**: `AvatarPickerModal.tsx` (câmera/galeria/template),
`AvatarTemplates.tsx` (10 avatares originais em SVG — ver seção
"Foto de perfil" abaixo sobre por que não são imagens baixadas de
sites de pfp).

**Dados/lógica pura** (`src/data/`, sem React): `foodCatalogStorage`,
`userFoodsStorage`, `userRecipesStorage`, `plannedItemsStorage`,
`planningResolvers` (resolve um `PlannedItem` em macros reais),
`recipes` (catálogo fixo de receitas).

**Lógica pura fora de `data/`**: `foodMath.ts` (scaling de macros,
`dominantMacro`, `QUANTITY_STEPS`), `tdeeMath.ts` (Mifflin-St Jeor +
divisão de macros por peso), `progressAnalysis.ts` (análise dos últimos
N dias vs. metas, com insights baseados em estudos), `dateUtils.ts`.

**Contextos** (`src/context/`): `CalorieContext` (metas, alimentos
consumidos, itens planejados, água — o estado global do app),
`ThemeContext` (modo claro/escuro, ver seção Tema).

**Componentes utilitários**: `PressableScale` (todo botão do app usa
esse em vez de `TouchableOpacity` — dá a micro-animação de encolher no
toque via Reanimated), `MealPeriodSelector` + `MealPeriodIcons`
(seletor de período com ícones de linha, usado em Organização e no
modal de receita), `DayRing`.

`MealPeriodSelector` anima expansão/cor com `withTiming` e progresso sempre
limitado entre 0 e 1. Não voltar a usar mola sem `overshootClamping` em
`flexGrow`/`maxWidth`: valores negativos faziam o período anterior piscar por
um frame durante a troca no Android.

## Navegação

```
Welcome → AboutYou → GoalChoice ──┬─→ Tdee (calcula automático) ─┐
                                   └─→ Macros (informa na mão) ────┴─→ MainTabs
```

- **AboutYou**: coleta altura/peso/idade/sexo/atividade/objetivo —
  *sempre* o primeiro passo, tanto no onboarding quanto em "Suas
  informações" (Perfil — nome atual do antigo "Alterar metas", trocado
  de lugar com "Como as metas são calculadas" no menu). Existe pra
  garantir que o peso fique disponível mesmo se o usuário escolher
  informar os macros manualmente — antes dessa mudança, quem ia direto
  pra "já sei meus macros" nunca tinha o peso salvo, e a meta de água
  (35 ml/kg) ficava sem dado.
  - Aceita `route.params.initial?: AboutYouData` pra pré-preencher o
    formulário e `origin?: 'profile' | 'goals'` pra identificar a origem.
    "Suas informações" no Perfil sempre abre `AboutYou` primeiro com
    `origin: 'profile'`; ao completar, segue para `GoalChoice` com
    `showUpdateAboutYou: false`, evitando oferecer imediatamente outro
    retorno redundante para a mesma tela.
  - Toda resposta é persistida em `aboutYouStorage.ts`
    (`macrofoco:aboutYou`) — é o que permite "Suas informações" reabrir
    já preenchido. Contas de antes dessa persistência existir caem num
    fallback com valores padrão (ver `ProfileScreen.handleEditGoals`).
  - O layout é deliberadamente compacto: altura/peso/idade ficam na mesma
    linha, sexo e objetivo compartilham um card e atividade fica em outro.
    Evitar voltar a empilhar os três campos numéricos em inputs largos — isso
    criava muita rolagem e espaço vazio para pouca informação.
- **GoalChoice**: pergunta só *como* definir a meta (automático vs.
  manual), já com os dados de `AboutYou` em mãos via `route.params`.
  O link "Atualizar suas informações" aparece por padrão no onboarding,
  mas fica oculto quando `showUpdateAboutYou === false` (fluxo iniciado
  por "Suas informações" no Perfil).
- **Tdee**: não pede mais nada — só mostra o resultado calculado
  (`computeTdeeGoals` em `tdeeMath.ts`) e confirma.
- **Macros**: recebe `weightKg` via `route.params` e salva no
  `CalorieContext` ao confirmar, mesmo indo pelo caminho manual.
- **MainTabs**: as 3 abas (`Diario` inicial, `Organizacao`, `Perfil`).
  `Scanner` não é mais uma aba — é empilhada por cima do `MainTabs`,
  aberta pelo botão "+ Novo" em Alimentos.

## Organização / Agendamento

O fluxo de "agendar comida pra um horário específico" tem dois pontos
de entrada, ambos convergindo pro mesmo modelo de dados
(`PlannedItem`, ver Persistência):

1. **Adição instantânea** (`FoodActionsSection`/`RecipesSection`, sem
   sessão ativa): toca "+" num alimento/receita → vira um
   `PlannedItem` que já nasce `status: 'done'`
   (`addImmediatePlannedItem`). Ver "Unificação com o Diário" abaixo.
2. **"Agendar nesse dia"** (`QuickScheduleModal` + `TimeSlotPicker`):
   define só a *forma* do dia — até 5 horários + o tipo de cada um
   (alimento/receita/misto). Não escolhe o item aqui dentro. Ao
   confirmar, abre uma sessão ativa (`activeQuickSchedule` no
   `CalorieContext`) e fecha o modal — a escolha de cada item passa a
   acontecer nas próprias abas Alimentos/Receitas de Organização, um
   horário por vez, na ordem em que foram marcados
   (`sessionForToday`/`currentSessionSlot`).

O antigo wizard completo de programação ("ScheduleSection", com
calendário multi-dia, duplicar dia etc.) foi removido — o único ponto
de entrada de agendamento hoje é o atalho acima.

### Rascunho de refeição (`OrganizationScreen`)

Montar uma refeição em Organização é um processo de 2 passos:
1. Alimentos/receitas adicionados via "+" entram num **rascunho local**
   (`draftItems`, estado do componente — nada persistido ainda). O
   card de resumo no topo mostra o total em tempo real.
2. "Salvar refeição" transforma cada item do rascunho num
   `PlannedItem` de verdade (`addPlannedItem`) e limpa o rascunho.

**Cuidado com receitas no rascunho**: um item de receita
(`DraftRecipe`) carrega `ingredientQuantities: number[]` — o
multiplicador de cada ingrediente no momento em que foi adicionado
(ex: 2× banana, ajustado no card expandido da receita). Esse array
**precisa** ir junto no `source` do `PlannedItem`
(`PlannedSource.ingredientQuantities`, opcional) — sem isso, quando o
item é resolvido mais tarde (`resolveSourceBase` →
`recipeBaseMacros`), a receita é recalculada do zero com todo
ingrediente em 1×, silenciosamente descartando qualquer ajuste de
porção que o usuário tinha feito. Esse foi um bug real, corrigido numa
sessão anterior — se voltar a acontecer, o suspeito número um é algum
novo ponto que constrói um `PlannedSource` de receita sem passar
`ingredientQuantities` adiante.

### Editar receita própria e recálculo retroativo

Receitas próprias (`RecipesSection`) agora têm um botão "✎ Editar"
(só nas criadas pelo usuário — `recipe.id.startsWith('user-')`), que
reabre o mesmo modal de criação pré-preenchido. Salvar uma edição
chama `CalorieContext.recalculateRecipeItems(recipeId, catalog,
userFoods, userRecipes)`, que percorre **todas as datas** em
`plannedByDate` e recalcula os itens `done`/`done_modified` que
referenciam aquele `recipeId` (mantendo o `quantityMultiplier`/
`ingredientQuantities` de cada um — só os macros por unidade da
receita mudam), atualizando tanto o `PlannedItem` quanto a entrada
correspondente em `foodsByDate`. Sem isso, editar uma receita nunca
refletia em itens já lançados no Diário (só nos futuros).

Separadamente, o rascunho de refeição (`OrganizationScreen`) também
sincroniza ao vivo com os steppers de quantidade do card expandido da
receita (`RecipesSection.onIngredientQuantityChange` →
`OrganizationScreen.handleIngredientQuantityChange`): se a receita já
está no rascunho e o usuário continua ajustando a porção de um
ingrediente, o item no rascunho atualiza junto, em vez de ficar
congelado no valor de quando o "+" foi tocado.

## Organização / Unificação com o Diário

Não existem duas fontes de dado para "o que eu comi hoje" — só uma:
`foodsByDate` (`ConsumedFood[]`) dentro do `CalorieContext`. Um
`PlannedItem` (agendado ou instantâneo) que é resolvido como
`done`/`done_modified` grava uma entrada em `foodsByDate` e guarda o
`linkedFoodId` de volta no próprio `PlannedItem` — é isso que permite
"Desfazer" remover exatamente aquela entrada, sem afetar o resto do
dia. `macrosConsumed`/`totalConsumed` (o anel do Diário) somam só
`foodsByDate`, nunca os `PlannedItem`s pendentes diretamente — então
nada é contado em dobro entre o Diário e a Alimentação Programada.

## Persistência

Tudo via `AsyncStorage`, sem backend. Chaves relevantes ficam perto de
onde são usadas (`STORAGE_KEY`/`STORAGE_KEYS` em cada módulo de
`src/data/` e nos contextos). Pontos de atenção pra compatibilidade
com dados já salvos:

- **`MealPeriod` `'avulso'`**: deixou de ser uma opção selecionável ao
  adicionar um alimento (`SELECTABLE_PERIODS` filtra ela fora), mas
  continua existindo no tipo — é o fallback de exibição pra alimentos
  salvos *antes* dessa mudança existir. Não remover do tipo `MealPeriod`
  sem migrar os dados salvos primeiro.
- **`Recipe.mealTypes`**: campo opcional (receita em mais de um
  horário). Receitas salvas antes desse campo existir só têm
  `mealType` (singular) — leia sempre via `recipeMealTypes(recipe)`,
  nunca `recipe.mealType` direto, pra cobrir os dois formatos.
- **`PlannedSource.ingredientQuantities`**: opcional, ver seção acima.
  Ausente = tudo em 1×.
- **`weightKg` no `CalorieContext`**: pode ser `null` pra quem
  configurou o app antes do fluxo `AboutYou` existir. `waterGoalMl`
  tem fallback em cascata pra esse caso (ver `computeWaterGoalMl` em
  `CalorieContext.tsx`: 35 ml/kg → 1 ml/kcal da meta calórica → 2000 ml
  fixo).
- **Catálogo TACO v8**: `Queijo minas` foi especificado como `Queijo minas
  frescal`, `Alface` como `Alface americana`, e `Maionese tradicional com
  ovos` foi adicionada; valores vêm da TACO 4ª edição (porções escaladas
  quando necessário). `FOOD_NAME_ALIASES` + `findCatalogFoodByName` preservam
  receitas e `PlannedSource.foodName` antigos. Pão de hambúrguer, hambúrguer
  de frango e batata palha não foram incluídos porque não possuem entrada
  exata nessa edição da TACO.

## Ícones (emoji → vetorial)

O catálogo de alimentos/receitas usava emoji puro (`Food.emoji`/
`Recipe.emoji: string`, renderizado num `<Text>`), o que quebrava como
"tofu box" em aparelhos/fontes sem o glifo mais recente do Unicode
(ex: `🫘`, `🫐`). A correção não foi só trocar por emojis mais antigos
— foi trocar o mecanismo inteiro:

- **`react-native-vector-icons`** instalado, só a família
  **MaterialCommunityIcons** (um único arquivo de fonte — evitar as
  famílias multi-estilo tipo FontAwesome6, que exigem vários `.ttf`
  por peso e são mais frágeis de linkar). Fonte copiada em
  `assets/fonts/MaterialCommunityIcons.ttf`, linkada via
  `react-native.config.js` (`assets: ['./assets/fonts']`) +
  `npx react-native-asset` (roda em qualquer SO, mexe direto no
  `android/app/src/main/assets` e no `project.pbxproj`/`Info.plist` do
  iOS — não precisa Xcode pra isso, só `pod install` depois, numa Mac,
  pra buildar de fato).
- **`FoodIcon.tsx`**: `FOOD_ICON_CATEGORIES` mapeia uma *categoria*
  (ex: `'redMeat'`, `'legume'`) pro nome exato do glifo
  MaterialCommunityIcons — cada nome foi **verificado contra o
  glyphmap da fonte antes de usar** (`node_modules/react-native-vector-
  icons/glyphmaps/MaterialCommunityIcons.json`), pra não reintroduzir
  o mesmo bug de ícone quebrado com um nome errado. `Food.emoji`/
  `Recipe.emoji` do catálogo (`FOOD_SEED`/`RECIPES`) guardam essas
  categorias; alimentos/receitas **criados pelo usuário** continuam
  livres pra usar qualquer emoji literal — `FoodIcon` decide sozinho
  qual dos dois é (`isFoodIconCategory`) e cai pro `<Text>` de emoji
  se não reconhecer.
  - **Cobertura é por categoria, não por prato**: a biblioteca não tem
    ícone específico pra banana/tomate/feijão/etc — vários alimentos
    bem diferentes caem na mesma categoria/ícone (ex: todo legume usa
    o ícone de amendoim), diferenciados só pela cor do macro
    predominante. Isso é uma limitação real e aceita da biblioteca
    gratuita, não um bug pendente.
- **`TabIcons.tsx`**: os 3 ícones da barra de abas (antes 📔/🍲/👤)
  viraram SVG de linha no mesmo estilo de `MealPeriodIcons.tsx`.
- **`LogoMark.tsx`/`LogoWordmark.tsx`**: o PNG da marca
  (`assets/images/logo_cabecinha.png`/`logo.png`) tinha um quadrado
  creme carimbado como fundo, que destoava do modo escuro. Recriados
  em SVG (círculos com `strokeDasharray`, mesmo truque do anel de
  calorias do Diário) com fundo transparente — só o texto do
  `LogoWordmark` (usado na `WelcomeScreen`) reage ao tema
  (`colors.text`/`colors.primary`); as cores do anel/círculo em si são
  fixas (identidade da marca). `logo.png`/`logo_cabecinha.png` ainda
  existem em `assets/images/` mas não são mais referenciados por
  nenhuma tela.
- `CATALOG_VERSION` em `foodCatalogStorage.ts` foi incrementado nessas
  mudanças (pra substituir o catálogo salvo no aparelho) — sempre
  incrementar de novo se `FOOD_SEED` mudar.

## Foto de perfil

`ProfileScreen` abre `AvatarPickerModal` (câmera / galeria / template)
em vez de ir direto pra galeria. Os "templates" são **originais**,
gerados em SVG (`AvatarTemplates.tsx` — um ícone de comida do mesmo
catálogo do `FoodIcon` sobre um círculo colorido), **não** imagens
baixadas de sites/boards de "pfp" (Pinterest, discordpfp.gg etc.) — foi
pedido explicitamente numa sessão anterior e recusado: esse tipo de
site republica arte de terceiros sem licença verificada, mesmo quando
rotulado como "sem copyright" ou o app não for publicado. Se pedirem
pra usar imagens de um site assim de novo, a resposta é a mesma; a
alternativa é ou gerar mais avatares originais (ícone + cor) ou o
usuário fornecer arquivos de um banco com licença livre de verdade.
Foto (`photoUri`) e template (`avatarTemplate`) são mutuamente
exclusivos — escolher um limpa o outro (`AsyncStorage`:
`@MacroFoco:profilePhoto` / `@MacroFoco:profileAvatarTemplate`).

## Tema (claro/escuro)

O app tem dark mode de verdade, não só uma paleta alternativa
guardada e não usada. Arquitetura:

- `src/theme.ts` exporta `getThemeColors(mode)` — não existe mais um
  `colors` estático exportado. Cada arquivo `*.styles.ts` virou
  `export const makeStyles = (colors: ThemeColors) => StyleSheet.create({...})`
  em vez de um objeto fixo — `StyleSheet.create` não é reativo, então
  precisa ser chamado de novo toda vez que o tema muda.
- `ThemeContext` (`src/context/ThemeContext.tsx`) expõe
  `useTheme() → {colors, mode, toggleTheme}`. Detecta o esquema do
  sistema por padrão; a escolha manual (toggle no Perfil, "Modo
  escuro") persiste em `AsyncStorage` e passa a valer sobre o sistema.
- **Todo componente que usa estilo precisa**:
  ```ts
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  ```
  Isso vale inclusive pra subcomponentes definidos no mesmo arquivo
  (ex: `AgendaRow` dentro de `ScheduledAgendaSection.tsx`) — cada um
  chama `useTheme()` e recalcula seu próprio `styles`, não dá pra
  confiar num `styles` de escopo de módulo.
- Cores fixas independentes de tema (não usar `colors.*` nesses
  casos): toasts (sempre um chip escuro com texto claro, floating,
  legível nos dois temas por design) e a tela do scanner de câmera
  (viewfinder preto full-screen, com overlays translúcidos — não faz
  sentido "clarear" uma tela de câmera).
- Se `makeStyles(colors)` explodir com `Cannot read property '...' of
  undefined`, quase sempre é bundle do Metro desatualizado (Fast
  Refresh não digere bem a introdução de um Context novo em cima de
  muitos arquivos reestruturados) — reiniciar com
  `npx react-native start --reset-cache` antes de investigar mais.

## Problemas históricos

- **`Alert.alert()` de confirmação**: no Bridgeless (New Architecture),
  chamar `Alert.alert()` direto durante certos ciclos de render não
  dispara corretamente — o padrão do app é sempre envolver em
  `setTimeout(() => Alert.alert(...), 0)`. Ver `confirmAlert()` em
  `ScannerScreen.tsx` como referência.
- **Jest não roda "de fábrica"** nesse setup — precisa do resolver do
  `react-native-worklets` e dos mocks de Reanimated/Notifee/
  AsyncStorage/VisionCamera (ver `jest.config.js` + `jest.setup.js`).
  Se `npm test` começar a falhar com erro de módulo nativo, o suspeito
  é sempre um pacote novo com módulo nativo que precisa de mock
  equivalente.
- **`removePlannedItem` não limpava o Diário**: apagar um `PlannedItem`
  já resolvido (`done`) só tirava ele de `plannedByDate` — a entrada
  vinculada em `foodsByDate` (`linkedFoodId`) ficava "órfã", contando
  pra sempre nas calorias/macros do dia mesmo com o item sumido da
  lista. Corrigido: `removePlannedItem` agora chama
  `removeFoodFromDate` também, se houver `linkedFoodId`. Vale como
  lembrete geral: qualquer função nova que remova um `PlannedItem`
  direto (sem passar por `unresolvePlannedItem`/`removePlannedItem`)
  precisa desse mesmo cuidado.
- **Copiar "Salvar dia" pra uma data passada travava em "pendente" pra
  sempre**: `ScheduledAgendaSection.handleSaveDayConfirm` criava todo
  item copiado como `status: 'pending'` (`addPlannedItem`), mesmo
  quando a data de destino já tinha passado — um pendente de um dia
  que já acabou nunca dispara notificação nem tem uma tela de "hoje"
  pra marcar "Feito", então ficava pendente pra sempre. Isso também
  causava divergência entre o anel do calendário (que soma pendente +
  consumido) e o Progresso (que só conta `foodsByDate`), fazendo a
  análise achar "menos de 2 dias registrados" mesmo com o calendário
  cheio. Corrigido na fonte: copiar pra uma data `< todayKey()` resolve
  o item direto como `done` (`addImmediatePlannedItem`), não mais
  pendente.
  - **Cuidado, não reintroduzir**: uma primeira tentativa de correção
    adicionou uma varredura automática (`useEffect`) que resolvia
    sozinha qualquer pendente-do-passado já existente, toda vez que a
    tela do Diário focava. Isso quebrou "Desfazer": desfazer um item
    (que volta pro status `pending`) numa data passada fazia a
    varredura resolvê-lo como `done` de novo no instante seguinte,
    porque ela não distingue "nunca foi resolvido" de "acabou de ser
    desfeito de propósito". Essa varredura foi **removida** — a
    correção certa é só na origem (`handleSaveDayConfirm`), não uma
    heurística recorrente rodando por cima de qualquer pendente antigo.

## Decisões de design recorrentes

- **Botões**: sempre `PressableScale` (não `TouchableOpacity`) — dá a
  micro-animação padrão do app (encolhe/escurece levemente no toque).
- **Cores de macro em listas**: proteína/carbo/gordura sempre aparecem
  como bolinha colorida + valor na mesma cor (`colors.protein/carbs/fat`),
  nunca como texto corrido numa cor só — ficou estabelecido depois de
  reclamação explícita de "muito monocromático" no modal de itens da
  refeição; o mesmo padrão foi replicado depois no card do Diário
  (`ScheduledAgendaSection`).
- **Modais grandes** (Progresso, Como as metas são calculadas, Nova
  receita): bottom sheet (desliza de baixo, alça no topo), não card
  centralizado — e o `ScrollView` interno precisa de `flexShrink: 1`
  pra respeitar o `maxHeight` do sheet e rolar de verdade (sem isso o
  conteúdo é cortado sem aviso). Ver `DiaryInsightsModals.tsx` como
  referência do padrão.
- **Ícones**: SVG de linha simples (ver `MealPeriodIcons.tsx`), nunca
  emoji nos elementos de UI recorrentes (emoji ainda aparece em dados
  do usuário, tipo o emoji de um alimento do catálogo). Pro catálogo/
  receitas prontas, ver seção "Ícones" acima (`FoodIcon.tsx`).
- **Confirmação de ação destrutiva**: `ConfirmModal.tsx` (visual do
  app), nunca `Alert.alert()` nativo — além da pegadinha do Bridgeless
  (ver "Problemas históricos"), o Alert do sistema é uma caixa branca
  fora do tema que destoa visualmente do resto do app (reclamação
  explícita de "esse popup feio"). `RecipesSection.handleDeleteRecipe`
  ainda usa `Alert.alert` — não foi migrado ainda, mas se mexer nele de
  novo, prefira trocar pro `ConfirmModal`.
- **Cards empilhados**: espaçamento pequeno e igual entre containers
  irmãos (`spacing.sm` entre os cards do Diário — anel/macros/água),
  em vez de cada um ter sua própria margem diferente. Dentro de um
  mesmo card com seções logicamente distintas (ex: dados básicos vs.
  macros no formulário de alimento manual), usar um divisor fino
  (`sectionDivider`) em vez de quebrar em cards separados.
- **Mascotes do Diário**: três ilustrações SVG originais — Foquinho
  (`MutantDropMascot.tsx`), Mudinha (`SproutMascot.tsx`) e Panelito
  (`PanelitoMascot.tsx`) — posicionadas à direita do anel por meio do
  dispatcher `DiaryMascot.tsx`. A escolha é feita no topo de
  `FoquinhoStatesModal` e persiste em `macrofoco:diaryMascot` por meio de
  `data/mascotStorage.ts`. A etapa corporal
  usa somente `consumedFoods`/`totalConsumed` do dia selecionado (a mesma
  fonte oficial do anel), os três pontos crescem com o progresso de cada
  macro e cada nova inclusão dispara um pequeno salto. No tema claro a
  expressão é desperta e aparece um sol; no escuro a expressão fica calma
  e aparecem lua/estrelas. Não transformar excesso de meta em punição,
  doença, tristeza ou ganho de peso do mascote.
  Tocar no pet abre `FoquinhoStatesModal`, que permite trocar entre os três,
  reaproveita cada SVG em miniatura, destaca o estado atual e explica os
  critérios específicos. A função
  `getFoquinhoStage` é compartilhada entre o mascote e o Diário; qualquer
  mudança nos limites deve partir dela e ser refletida nos textos do modal.
  A mesma seleção personaliza discretamente o Diário com uma faixa fina
  abaixo do cabeçalho (`DIARY_MASCOT_ACCENTS`): azul para Foquinho, verde para
  Mudinha e terracota para Panelito, cada uma com variante clara/escura.
  Ao iniciar uma rolagem manual no Diário, `screenMotionSignal` muda e o pet
  executa um chacoalho curto (rotação + deslocamento lateral). O sinal ocorre
  apenas no começo do gesto para não manter animação contínua nem causar
  rerenders durante todo o scroll.
- **Imagens/ícones de terceiros**: não baixar de sites/bancos sem
  licença verificada, mesmo com autorização explícita do usuário e
  mesmo pra projeto não-publicado (ver seção "Foto de perfil"). Gerar
  original (SVG) ou pedir pro usuário fornecer arquivo com licença
  clara.

## Build Android

- **Nome do APK**: `android/app/build.gradle` tem um bloco
  `applicationVariants.all` que renomeia a saída pra
  `MacroFoco-<variant>.apk` (ex: `MacroFoco-release.apk`), em vez do
  `app-release.apk`/`app-debug.apk` padrão do Gradle.
- **CLI do React Native (`@react-native-community/cli` 20.x)**: a flag
  pra escolher variante em `run-android` é `--mode` (ex:
  `--mode=release`), **não** `--variant` (isso era de versões antigas
  do CLI e dá erro "unknown option" nessa versão).
- Build direto pelo Gradle (sem instalar em aparelho): de dentro de
  `android/`, `.\gradlew.bat assembleRelease` no Windows (`./gradlew`
  é sintaxe Unix/Git Bash — no PowerShell precisa do `.bat`).
