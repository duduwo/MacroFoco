// Análise de progresso dos últimos dias — compara o consumo registrado no
// Diário com as metas e gera insights educativos com base em literatura de
// nutrição esportiva. Módulo puro (sem React) pra ser testável.
import type {FoodsByDate, MacroGoals} from './context/CalorieContext';
import {dateKey, addDays, parseDateKey} from './dateUtils';

export type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat';

export type MacroInsight = {
  key: MacroKey;
  label: string;
  unit: 'kcal' | 'g';
  goal: number;
  avgConsumed: number;
  /** Média do % da meta atingido nos dias com registro (1 = 100%). */
  avgPct: number;
  /** Dias (com registro) em que a meta foi razoavelmente atingida (≥90%). */
  daysHit: number;
  daysWithData: number;
  /** % da meta por dia (ordem cronológica, 0 = sem registro) — sparkline. */
  perDayPct: number[];
  /** Inicial do dia da semana de cada dia analisado, na mesma ordem. */
  dayInitials: string[];
  message: string;
  source: string;
};

export type ProgressReport = {
  daysAnalyzed: number;
  daysWithData: number;
  insights: MacroInsight[];
};

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Últimos N dias ANTERIORES a hoje (hoje fica de fora porque ainda está em
// andamento — contaria como "meta não batida" injustamente).
export function lastNDayKeys(n: number, today: Date): string[] {
  const keys: string[] = [];
  for (let i = n; i >= 1; i--) {
    keys.push(dateKey(addDays(today, -i)));
  }
  return keys;
}

type Totals = {calories: number; protein: number; carbs: number; fat: number};

function totalsForDay(foodsByDate: FoodsByDate, key: string): Totals | null {
  const foods = foodsByDate[key];
  if (!foods || foods.length === 0) return null;
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    {calories: 0, protein: 0, carbs: 0, fat: 0},
  );
}

// Mensagens por faixa de aderência. Referências reais (ver GoalsInfoModal):
// - Proteína: Jäger et al. 2017 (ISSN, 1,4–2,2 g/kg) e Morton et al. 2018
//   (meta-análise BJSM: ganhos de massa magra tendem a saturar ~1,6 g/kg/dia).
// - Calorias: Helms et al. 2014 (déficits agressivos ↑ perda de massa magra);
//   Hall et al. 2011 (excedente sustentado → ganho de peso).
// - Carbo: Burke et al. 2011 (glicogênio e desempenho no treino).
// - Gordura: Whittaker & Wu 2021 (dietas muito baixas em gordura ↓
//   testosterona); ISSN recomenda ~20–35% das calorias (Kerksick et al. 2018).
function buildMessage(key: MacroKey, avgPct: number): {message: string; source: string} {
  const falta = Math.round((1 - avgPct) * 100);
  const excesso = Math.round((avgPct - 1) * 100);

  if (key === 'protein') {
    if (avgPct >= 0.9) {
      return {
        message: 'Meta de proteína consistentemente atingida — bom cenário para síntese e preservação de massa muscular.',
        source: 'Jäger et al., 2017 (ISSN) · Morton et al., 2018 (Br J Sports Med)',
      };
    }
    return {
      message: `Faltou em média ${falta}% da proteína. A síntese de proteína muscular pode não ter sido maximizada nesses dias — a literatura aponta ~1,6–2,2 g/kg/dia como faixa ótima para ganho de massa magra.`,
      source: 'Morton et al., 2018 (Br J Sports Med) · Jäger et al., 2017 (ISSN)',
    };
  }

  if (key === 'calories') {
    if (avgPct >= 0.9 && avgPct <= 1.1) {
      return {
        message: 'Calorias na faixa da meta — aderência consistente é o principal preditor de resultado a longo prazo.',
        source: 'Helms et al., 2014 (J Int Soc Sports Nutr)',
      };
    }
    if (avgPct < 0.9) {
      return {
        message: `Consumo em média ${falta}% abaixo da meta. Déficits muito agressivos aceleram a perda de peso, mas aumentam a perda de massa magra e derrubam a adesão.`,
        source: 'Helms et al., 2014 (J Int Soc Sports Nutr)',
      };
    }
    return {
      message: `Consumo em média ${excesso}% acima da meta. Excedente calórico sustentado tende a virar ganho de peso — vale conferir porções e itens não registrados.`,
      source: 'Hall et al., 2011 (Lancet)',
    };
  }

  if (key === 'carbs') {
    if (avgPct >= 0.8) {
      return {
        message: 'Carboidrato próximo da meta — estoques de glicogênio abastecidos sustentam desempenho e intensidade no treino.',
        source: 'Burke et al., 2011 (J Sports Sci)',
      };
    }
    return {
      message: `Faltou em média ${falta}% do carboidrato. Estoques baixos de glicogênio podem reduzir desempenho e intensidade nos treinos.`,
      source: 'Burke et al., 2011 (J Sports Sci) · Thomas et al., 2016 (ACSM)',
    };
  }

  // fat
  if (avgPct >= 0.7) {
    return {
      message: 'Gordura em nível adequado — importante para produção hormonal e absorção de vitaminas lipossolúveis.',
      source: 'Kerksick et al., 2018 (ISSN)',
    };
  }
  return {
    message: `Faltou em média ${falta}% da gordura. Ingestão muito baixa por períodos prolongados está associada a queda na produção de hormônios como a testosterona.`,
    source: 'Whittaker & Wu, 2021 (J Steroid Biochem Mol Biol) · Kerksick et al., 2018 (ISSN)',
  };
}

export function analyzeProgress(
  foodsByDate: FoodsByDate,
  dailyGoal: number | null,
  macroGoals: MacroGoals | null,
  days: number = 7,
  today: Date = new Date(),
): ProgressReport {
  const keys = lastNDayKeys(days, today);
  const dayInitials = keys.map(k => WEEKDAY_INITIALS[parseDateKey(k).getDay()]);
  const dayTotals = keys.map(k => totalsForDay(foodsByDate, k));
  const withData = dayTotals.filter((t): t is Totals => t !== null);

  const defs: {key: MacroKey; label: string; unit: 'kcal' | 'g'; goal: number}[] = [
    {key: 'calories', label: 'Calorias', unit: 'kcal', goal: dailyGoal ?? 0},
    {key: 'protein', label: 'Proteína', unit: 'g', goal: macroGoals?.protein ?? 0},
    {key: 'carbs', label: 'Carboidrato', unit: 'g', goal: macroGoals?.carbs ?? 0},
    {key: 'fat', label: 'Gordura', unit: 'g', goal: macroGoals?.fat ?? 0},
  ];

  const insights: MacroInsight[] = defs
    .filter(d => d.goal > 0)
    .map(d => {
      const perDayPct = dayTotals.map(t => (t ? t[d.key] / d.goal : 0));
      const pctsWithData = dayTotals
        .filter((t): t is Totals => t !== null)
        .map(t => t[d.key] / d.goal);
      const avgPct =
        pctsWithData.length > 0
          ? pctsWithData.reduce((s, p) => s + p, 0) / pctsWithData.length
          : 0;
      const avgConsumed =
        withData.length > 0
          ? withData.reduce((s, t) => s + t[d.key], 0) / withData.length
          : 0;
      const {message, source} = buildMessage(d.key, avgPct);
      return {
        key: d.key,
        label: d.label,
        unit: d.unit,
        goal: d.goal,
        avgConsumed: Math.round(avgConsumed),
        avgPct,
        daysHit: pctsWithData.filter(p => p >= 0.9).length,
        daysWithData: pctsWithData.length,
        perDayPct,
        dayInitials,
        message,
        source,
      };
    });

  return {daysAnalyzed: days, daysWithData: withData.length, insights};
}
