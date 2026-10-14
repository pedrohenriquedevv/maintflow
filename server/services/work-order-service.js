import { repository } from '../repositories/work-order-repository.js';
import { STATUS, DomainError, assertTransition, calculateDuration, validateAssignment, validateJustification, validateWorkOrder } from '../domain/work-order.js';

const actor = data => data.actor || 'Usuário de demonstração';
function requiredOrder(order) { if (!order) throw new DomainError('Ordem não encontrada.', 'NOT_FOUND'); return order; }
function transition(id, next, data, reason) {
  const order = requiredOrder(repository.find(id));
  assertTransition(order.status, next);
  repository.transition(id, order.status, next, actor(data), reason);
  return repository.find(id);
}
export const service = {
  list(filters) { return repository.list(filters); },
  get(id) { return requiredOrder(repository.find(id)); },
  create(data) {
    validateWorkOrder(data);
    if (typeof data.code !== 'string' || !data.code.trim()) throw new DomainError('O código é obrigatório.');
    return repository.create({ ...data, status: STATUS.DRAFT });
  },
  update(id, data) {
    const order = requiredOrder(repository.find(id));
    if (order.status !== STATUS.DRAFT) throw new DomainError('Somente ordens em rascunho podem ser editadas.', 'INVALID_TRANSITION');
    validateWorkOrder(data);
    return repository.update(id, data);
  },
  publish(id, data) { return transition(id, STATUS.PUBLISHED, data); },
  assign(id, data) {
    const order = requiredOrder(repository.find(id));
    assertTransition(order.status, STATUS.ASSIGNED);
    validateAssignment(data.technicianIds);
    repository.assign(id, data.technicianIds, data.instructions);
    repository.transition(id, order.status, STATUS.ASSIGNED, actor(data));
    return repository.find(id);
  },
  start(id, data) { return transition(id, STATUS.IN_PROGRESS, data); },
  execution(id, data) {
    const order = requiredOrder(repository.find(id));
    if (![STATUS.IN_PROGRESS, STATUS.RETURNED].includes(order.status)) throw new DomainError('A ordem precisa estar em execução ou devolvida para receber um registro.', 'INVALID_TRANSITION');
    if (!Array.isArray(data.participantIds) || data.participantIds.length === 0) throw new DomainError('Informe ao menos um participante.');
    const durationHours = calculateDuration(data.startedAt, data.endedAt);
    repository.saveExecution(id, { ...data, durationHours });
    repository.transition(id, order.status, STATUS.AWAITING_REVIEW, actor(data));
    return repository.find(id);
  },
  review(id, data) { return transition(id, STATUS.AWAITING_CLOSE, data); },
  returnForReview(id, data) {
    validateJustification(data.justification);
    const order = requiredOrder(repository.find(id));
    assertTransition(order.status, STATUS.AWAITING_REVIEW);
    repository.transition(id, order.status, STATUS.RETURNED, actor(data), data.justification);
    return repository.find(id);
  },
  close(id, data) { return transition(id, STATUS.CLOSED, data); },
  cancel(id, data) {
    validateJustification(data.justification);
    const order = requiredOrder(repository.find(id));
    assertTransition(order.status, STATUS.CANCELLED);
    repository.transition(id, order.status, STATUS.CANCELLED, actor(data), data.justification);
    return repository.find(id);
  },
  history(id) { requiredOrder(repository.find(id)); return repository.history(id); },
  reset() { repository.reset(); }
};
