import React, {useMemo} from 'react';
import {View, Text, Modal, Pressable, ScrollView, StyleSheet} from 'react-native';
import Svg, {Polyline} from 'react-native-svg';
import {useCalorie} from './context/CalorieContext';
import {useTheme} from './context/ThemeContext';
import {spacing, radius, type ThemeColors} from './theme';
import {analyzeProgress, type MacroInsight} from './progressAnalysis';

function getMacroColor(colors: ThemeColors): Record<MacroInsight['key'], string> {
  return {
    calories: colors.primary,
    protein: colors.protein,
    carbs: colors.carbs,
    fat: colors.fat,
  };
}

export function TrendingUpIcon({size = 16, color}: {size?: number; color: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="3 17 9 11 13 15 21 7" />
      <Polyline points="15 7 21 7 21 13" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet compartilhado pelos dois modais: desliza de baixo, alça de
// arrastar no topo e ScrollView com flexShrink — sem isso o ScrollView não
// percebe o limite de altura do card e o conteúdo fica cortado sem rolar.
// ---------------------------------------------------------------------------
function SheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const {colors} = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop como camada absoluta ATRÁS do sheet (e sheet como View
          comum): sheet dentro de Pressable disputa o gesto de arrastar com o
          ScrollView no Android e o scroll trava. */}
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{title}</Text>
          <Text style={s.sheetSubtitle}>{subtitle}</Text>

          <ScrollView
            style={s.sheetScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            {children}
          </ScrollView>

          <Pressable style={s.closeButton} onPress={onClose}>
            <Text style={s.closeButtonText}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sparkline: 7 barrinhas (uma por dia) — trilha fixa + preenchimento
// proporcional à % da meta batida naquele dia (teto de 120%, pra um dia
// bem acima da meta não estourar o desenho). Dia sem registro fica com a
// trilha vazia, então dá pra ver de cara quais dias faltou registrar.
// ---------------------------------------------------------------------------
const SPARK_TRACK_HEIGHT = 40;
const SPARK_PCT_CEILING = 1.2;

function Sparkline({insight}: {insight: MacroInsight}) {
  const {colors} = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const color = getMacroColor(colors)[insight.key];
  return (
    <View style={s.sparkRow}>
      {insight.perDayPct.map((pct, i) => {
        const hasData = pct > 0;
        const fillRatio = hasData ? Math.min(pct, SPARK_PCT_CEILING) / SPARK_PCT_CEILING : 0;
        const fillHeight = hasData ? Math.max(3, fillRatio * SPARK_TRACK_HEIGHT) : 0;
        const hit = pct >= 0.9;
        return (
          <View key={i} style={s.sparkCol}>
            <View style={[s.sparkTrack, {height: SPARK_TRACK_HEIGHT}]}>
              {hasData && (
                <View
                  style={[
                    s.sparkFill,
                    {height: fillHeight, backgroundColor: hit ? color : colors.borderStrong},
                  ]}
                />
              )}
            </View>
            <Text style={s.sparkDay}>{insight.dayInitials[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function InsightCard({insight}: {insight: MacroInsight}) {
  const {colors} = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const color = getMacroColor(colors)[insight.key];
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardTitleRow}>
          <View style={[s.macroDot, {backgroundColor: color}]} />
          <Text style={s.cardTitle}>{insight.label}</Text>
        </View>
        <Text style={[s.cardPct, {color}]}>{Math.round(insight.avgPct * 100)}% da meta</Text>
      </View>

      <Text style={s.cardMeta}>
        Média {insight.avgConsumed} de {insight.goal} {insight.unit} · bateu em {insight.daysHit} de{' '}
        {insight.daysWithData} {insight.daysWithData === 1 ? 'dia registrado' : 'dias registrados'}
      </Text>

      <Sparkline insight={insight} />

      <Text style={s.cardMessage}>{insight.message}</Text>
      <Text style={s.cardSource}>📚 {insight.source}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Modal "Progresso" — análise dos últimos 7 dias.
// ---------------------------------------------------------------------------
export function ProgressModal({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const {foodsByDate, dailyGoal, macroGoals} = useCalorie();
  const {colors} = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const report = useMemo(
    () => analyzeProgress(foodsByDate, dailyGoal, macroGoals),
    [foodsByDate, dailyGoal, macroGoals],
  );

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Progresso"
      subtitle="Últimos 7 dias — hoje fica de fora, ainda está em andamento">
      {report.insights.length === 0 ? (
        <Text style={s.emptyText}>
          Defina suas metas de calorias e macros para ver a análise de progresso.
        </Text>
      ) : report.daysWithData < 2 ? (
        <Text style={s.emptyText}>
          Registre suas refeições por pelo menos 2 dias para ver a análise — os insights comparam o
          que você consumiu com as metas de cada dia.
        </Text>
      ) : (
        <>
          {report.insights.map(insight => (
            <InsightCard key={insight.key} insight={insight} />
          ))}
          <Text style={s.disclaimer}>
            Conteúdo educativo baseado em estudos de nutrição esportiva — não substitui a avaliação
            de um profissional da saúde.
          </Text>
        </>
      )}
    </SheetModal>
  );
}

// ---------------------------------------------------------------------------
// Modal "(i)" — de onde vêm os números das metas, com fórmulas e referências.
// ---------------------------------------------------------------------------
type StepAccent = {bg: string; fg: string};

function InfoStep({
  n,
  accent,
  title,
  body,
  formula,
  source,
}: {
  n: number;
  accent: StepAccent;
  title: string;
  body: string;
  formula?: string;
  source: string;
}) {
  const {colors} = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.card}>
      <View style={s.infoStepHeader}>
        <View style={[s.infoStepBadge, {backgroundColor: accent.bg}]}>
          <Text style={[s.infoStepBadgeText, {color: accent.fg}]}>{n}</Text>
        </View>
        <Text style={s.infoStepTitle}>{title}</Text>
      </View>
      <Text style={s.cardMessage}>{body}</Text>
      {formula && (
        <View style={s.formulaBox}>
          <Text style={s.formulaText}>{formula}</Text>
        </View>
      )}
      <Text style={s.cardSource}>📚 {source}</Text>
    </View>
  );
}

export function GoalsInfoModal({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const {dailyGoal, macroGoals, weightKg} = useCalorie();
  const {colors} = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const neutral: StepAccent = {bg: colors.backgroundAlt2, fg: colors.textMuted};
  const primary: StepAccent = {bg: colors.proteinTint, fg: colors.primary};

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Como suas metas são calculadas"
      subtitle={weightKg ? `Calculadas para o seu peso de ${weightKg} kg` : 'Fórmulas e estudos por trás dos números'}>
      {/* Resumo das metas atuais em chips coloridos */}
      {dailyGoal !== null && (
        <View style={s.statChipRow}>
          <View style={[s.statChip, {backgroundColor: colors.proteinTint}]}>
            <Text style={[s.statChipValue, {color: colors.primary}]}>{dailyGoal}</Text>
            <Text style={s.statChipLabel}>kcal</Text>
          </View>
          {macroGoals && (
            <>
              <View style={[s.statChip, {backgroundColor: colors.proteinTint}]}>
                <Text style={[s.statChipValue, {color: colors.protein}]}>{macroGoals.protein}g</Text>
                <Text style={s.statChipLabel}>proteína</Text>
              </View>
              <View style={[s.statChip, {backgroundColor: colors.carbsTint}]}>
                <Text style={[s.statChipValue, {color: colors.carbs}]}>{macroGoals.carbs}g</Text>
                <Text style={s.statChipLabel}>carbo</Text>
              </View>
              <View style={[s.statChip, {backgroundColor: colors.fatTint}]}>
                <Text style={[s.statChipValue, {color: colors.fat}]}>{macroGoals.fat}g</Text>
                <Text style={s.statChipLabel}>gordura</Text>
              </View>
            </>
          )}
        </View>
      )}

      <InfoStep
        n={1}
        accent={neutral}
        title="Gasto basal (TMB)"
        body="Quanto seu corpo gasta em repouso. Usamos a equação com melhor precisão validada em adultos saudáveis:"
        formula={'TMB = 10×peso + 6,25×altura − 5×idade\n(+5 homens · −161 mulheres)'}
        source="Mifflin & St Jeor et al., 1990 (Am J Clin Nutr)"
      />
      <InfoStep
        n={2}
        accent={neutral}
        title="Nível de atividade"
        body="A TMB é multiplicada por um fator de 1,2 (sedentário) a 1,9 (muito ativo) para estimar o gasto diário total (TDEE)."
        source="Fatores de atividade clássicos (FAO/OMS)"
      />
      <InfoStep
        n={3}
        accent={primary}
        title="Objetivo"
        body="Emagrecer subtrai 500 kcal/dia e ganhar massa soma 500 kcal/dia — ritmo aproximado de ±0,5 kg por semana, considerado sustentável."
        source="Hall et al., 2011 (Lancet)"
      />
      <InfoStep
        n={4}
        accent={{bg: colors.proteinTint, fg: colors.protein}}
        title="Proteína"
        body="1,8–2,2 g por kg de peso/dia (mais alta em déficit, para preservar massa magra). Ganhos de massa magra tendem a saturar a partir de ~1,6 g/kg."
        source="Jäger et al., 2017 (ISSN) · Morton et al., 2018 (Br J Sports Med)"
      />
      <InfoStep
        n={5}
        accent={{bg: colors.fatTint, fg: colors.fat}}
        title="Gordura"
        body="~1 g por kg de peso/dia — piso para não prejudicar a produção hormonal e a absorção de vitaminas lipossolúveis (A, D, E, K)."
        source="Kerksick et al., 2018 (ISSN) · Whittaker & Wu, 2021"
      />
      <InfoStep
        n={6}
        accent={{bg: colors.carbsTint, fg: colors.carbs}}
        title="Carboidrato"
        body="Preenche as calorias restantes (4 kcal/g, fatores de Atwater) — é o principal combustível para treinos de intensidade."
        source="Burke et al., 2011 (J Sports Sci)"
      />
      <InfoStep
        n={7}
        accent={{bg: colors.waterTint, fg: colors.water}}
        title="Água"
        body="35 ml por kg de peso/dia — heurística clínica amplamente usada, na linha das ingestões adequadas de referência (2,0–2,5 L/dia)."
        source="EFSA, 2010 (Dietary Reference Values for Water)"
      />
      <Text style={s.disclaimer}>
        Estimativas populacionais — a resposta individual varia. Ajuste com acompanhamento
        profissional.
      </Text>
    </SheetModal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(43,38,33,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  // flexShrink é o que faz o ScrollView respeitar o maxHeight do sheet e
  // realmente rolar em vez de cortar o conteúdo.
  sheetScroll: {
    flexShrink: 1,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  statChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
  },
  statChipValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  statChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardPct: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 2,
  },
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sparkCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sparkTrack: {
    width: '100%',
    maxWidth: 26,
    borderRadius: 4,
    backgroundColor: colors.divider,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  sparkFill: {
    width: '100%',
    borderRadius: 4,
  },
  sparkDay: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textFaint,
    marginTop: 2,
  },
  cardMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  cardSource: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textFaint,
    marginTop: 6,
  },
  infoStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  infoStepBadge: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoStepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  formulaBox: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.input,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  formulaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  closeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt2,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
