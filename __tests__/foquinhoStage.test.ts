import {getFoquinhoStage} from '../src/MutantDropMascot';

describe('getFoquinhoStage', () => {
  it('mantém a forma adormecida sem alimentos', () => {
    expect(getFoquinhoStage(0, 0)).toBe(0);
  });

  it('avança pelos limites de alimentos', () => {
    expect(getFoquinhoStage(1, 0.1)).toBe(1);
    expect(getFoquinhoStage(2, 0.1)).toBe(2);
    expect(getFoquinhoStage(4, 0.1)).toBe(3);
    expect(getFoquinhoStage(5, 0.1)).toBe(4);
  });

  it('avança pelos limites de progresso calórico', () => {
    expect(getFoquinhoStage(1, 0.35)).toBe(2);
    expect(getFoquinhoStage(1, 0.65)).toBe(3);
    expect(getFoquinhoStage(1, 0.9)).toBe(4);
  });
});
