import { describe, expect, it } from 'vitest';
import { STATUS, assertTransition, calculateDuration, validateAssignment, validateJustification, validateWorkOrder } from '../server/domain/work-order.js';

describe('regras de domínio', () => {
  it('aceita uma ordem válida e rejeita campos ausentes', () => {
    expect(() => validateWorkOrder({ title: 'Teste', description: 'Descrição', specialty: 'Mecânica', priority: 'Normal', location: 'Local', equipment: 'Equipamento' })).not.toThrow();
    expect(() => validateWorkOrder({ title: 'Teste' })).toThrow();
  });
  it('permite somente transições previstas', () => {
    expect(() => assertTransition(STATUS.DRAFT, STATUS.PUBLISHED)).not.toThrow();
    expect(() => assertTransition(STATUS.CLOSED, STATUS.IN_PROGRESS)).toThrow(/Não é possível/);
  });
  it('calcula duração e rejeita término anterior', () => {
    expect(calculateDuration('2026-01-01T08:00:00Z', '2026-01-01T10:30:00Z')).toBe(2.5);
    expect(() => calculateDuration('2026-01-01T10:00:00Z', '2026-01-01T09:00:00Z')).toThrow();
  });
  it('exige técnico e justificativa', () => {
    expect(() => validateAssignment([])).toThrow();
    expect(() => validateJustification('')).toThrow();
  });
});
