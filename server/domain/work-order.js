export const STATUS = Object.freeze({
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicada',
  ASSIGNED: 'Delegada',
  IN_PROGRESS: 'Em execução',
  AWAITING_REVIEW: 'Aguardando conferência',
  RETURNED: 'Devolvida para revisão',
  AWAITING_CLOSE: 'Aguardando encerramento',
  CLOSED: 'Encerrada',
  CANCELLED: 'Cancelada'
});

export const TRANSITIONS = Object.freeze({
  [STATUS.DRAFT]: [STATUS.PUBLISHED, STATUS.CANCELLED],
  [STATUS.PUBLISHED]: [STATUS.ASSIGNED, STATUS.CANCELLED],
  [STATUS.ASSIGNED]: [STATUS.IN_PROGRESS, STATUS.CANCELLED],
  [STATUS.IN_PROGRESS]: [STATUS.AWAITING_REVIEW],
  [STATUS.AWAITING_REVIEW]: [STATUS.RETURNED, STATUS.AWAITING_CLOSE],
  [STATUS.RETURNED]: [STATUS.IN_PROGRESS, STATUS.AWAITING_REVIEW],
  [STATUS.AWAITING_CLOSE]: [STATUS.CLOSED, STATUS.RETURNED],
  [STATUS.CLOSED]: [],
  [STATUS.CANCELLED]: []
});

export class DomainError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export function validateWorkOrder(input) {
  const required = ['title', 'description', 'specialty', 'priority', 'location', 'equipment'];
  for (const field of required) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      throw new DomainError(`O campo ${field} é obrigatório.`);
    }
  }
}

export function assertTransition(current, next) {
  if (!TRANSITIONS[current]?.includes(next)) {
    throw new DomainError(`Não é possível mudar de "${current}" para "${next}".`, 'INVALID_TRANSITION');
  }
}

export function calculateDuration(startedAt, endedAt) {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new DomainError('O término deve ser posterior ao início.');
  }
  return Number(((end - start) / 3600000).toFixed(2));
}

export function validateAssignment(technicianIds) {
  if (!Array.isArray(technicianIds) || technicianIds.length === 0) {
    throw new DomainError('Informe ao menos um técnico para a delegação.');
  }
}

export function validateJustification(justification) {
  if (typeof justification !== 'string' || !justification.trim()) {
    throw new DomainError('A justificativa é obrigatória.');
  }
}
