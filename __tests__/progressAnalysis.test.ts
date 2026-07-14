import {analyzeProgress, lastNDayKeys} from '../src/progressAnalysis';
import type {FoodsByDate} from '../src/context/CalorieContext';

const GOALS = {protein: 100, carbs: 200, fat: 50};
const DAILY_GOAL = 2000;
// Data fixa pra teste determinístico (qua, 15 de julho de 2026).
const TODAY = new Date(2026, 6, 15);

const food = (calories: number, protein: number, carbs: number, fat: number) => ({
  id: String(Math.random()),
  name: 'x',
  calories,
  protein,
  carbs,
  fat,
  period: 'almoco' as const,
});

describe('lastNDayKeys', () => {
  it('retorna os 7 dias anteriores a hoje, em ordem crescente, sem incluir hoje', () => {
    const keys = lastNDayKeys(7, TODAY);
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-07-08');
    expect(keys[6]).toBe('2026-07-14');
    expect(keys).not.toContain('2026-07-15');
  });
});

describe('analyzeProgress', () => {
  it('sem metas definidas, não gera insights', () => {
    const report = analyzeProgress({}, null, null, 7, TODAY);
    expect(report.insights).toHaveLength(0);
  });

  it('calcula média de aderência só sobre os dias com registro', () => {
    const foodsByDate: FoodsByDate = {
      // 2 dias com registro: 100% e 50% da proteína
      '2026-07-13': [food(2000, 100, 200, 50)],
      '2026-07-14': [food(1000, 50, 100, 25)],
    };
    const report = analyzeProgress(foodsByDate, DAILY_GOAL, GOALS, 7, TODAY);
    expect(report.daysWithData).toBe(2);

    const protein = report.insights.find(i => i.key === 'protein')!;
    expect(protein.avgPct).toBeCloseTo(0.75); // (1.0 + 0.5) / 2
    expect(protein.daysHit).toBe(1); // só o dia de 100% passa de 90%
    expect(protein.daysWithData).toBe(2);
    expect(protein.avgConsumed).toBe(75);
  });

  it('proteína abaixo da meta gera alerta com estudo; acima de 90% elogia', () => {
    const low: FoodsByDate = {
      '2026-07-14': [food(2000, 60, 200, 50)],
      '2026-07-13': [food(2000, 60, 200, 50)],
    };
    const lowReport = analyzeProgress(low, DAILY_GOAL, GOALS, 7, TODAY);
    const lowProtein = lowReport.insights.find(i => i.key === 'protein')!;
    expect(lowProtein.message).toContain('Faltou em média 40%');
    expect(lowProtein.source).toContain('Morton');

    const ok: FoodsByDate = {
      '2026-07-14': [food(2000, 95, 200, 50)],
      '2026-07-13': [food(2000, 100, 200, 50)],
    };
    const okReport = analyzeProgress(ok, DAILY_GOAL, GOALS, 7, TODAY);
    const okProtein = okReport.insights.find(i => i.key === 'protein')!;
    expect(okProtein.message).toContain('consistentemente atingida');
  });

  it('calorias acima da meta citam excedente; na faixa citam aderência', () => {
    const over: FoodsByDate = {
      '2026-07-14': [food(2600, 100, 200, 50)],
      '2026-07-13': [food(2600, 100, 200, 50)],
    };
    const overReport = analyzeProgress(over, DAILY_GOAL, GOALS, 7, TODAY);
    const cal = overReport.insights.find(i => i.key === 'calories')!;
    expect(cal.avgPct).toBeCloseTo(1.3);
    expect(cal.message).toContain('acima da meta');
    expect(cal.source).toContain('Hall');
  });

  it('soma múltiplos alimentos do mesmo dia', () => {
    const foodsByDate: FoodsByDate = {
      '2026-07-14': [food(800, 40, 80, 20), food(1200, 60, 120, 30)],
    };
    const report = analyzeProgress(foodsByDate, DAILY_GOAL, GOALS, 7, TODAY);
    const cal = report.insights.find(i => i.key === 'calories')!;
    expect(cal.avgPct).toBeCloseTo(1.0);
  });

  it('perDayPct mantém a ordem cronológica com zeros nos dias vazios', () => {
    const foodsByDate: FoodsByDate = {
      '2026-07-08': [food(2000, 100, 200, 50)],
    };
    const report = analyzeProgress(foodsByDate, DAILY_GOAL, GOALS, 7, TODAY);
    const cal = report.insights.find(i => i.key === 'calories')!;
    expect(cal.perDayPct[0]).toBeCloseTo(1.0);
    expect(cal.perDayPct.slice(1)).toEqual([0, 0, 0, 0, 0, 0]);
  });
});
