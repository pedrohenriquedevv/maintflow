import { Router } from 'express';
import { controller } from '../controllers/work-order-controller.js';
import { service } from '../services/work-order-service.js';
import { seedDemo } from '../database/seed.js';

export const api = Router();
api.get('/health', (req, res) => res.json({ status: 'ok', service: 'MaintFlow API' }));
api.get('/work-orders', controller.list);
api.get('/work-orders/:id', controller.get);
api.post('/work-orders', controller.create);
api.put('/work-orders/:id', controller.update);
for (const [path, method] of [['publish', 'publish'], ['assign', 'assign'], ['start', 'start'], ['executions', 'execution'], ['review', 'review'], ['return', 'returnForReview'], ['close', 'close'], ['cancel', 'cancel']]) api.post(`/work-orders/:id/${path}`, controller.action(method));
api.get('/work-orders/:id/history', controller.history);
api.post('/demo/reset', (req, res) => { service.reset(); seedDemo(); res.json({ data: { reset: true } }); });
api.get('/export/work-orders.csv', (req, res) => {
  const rows = service.list();
  const safe = value => {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const columns = ['Código', 'Título', 'Status', 'Prioridade', 'Especialidade', 'Localização', 'Equipamento'];
  const csv = '\uFEFF' + columns.map(safe).join(';') + '\n' + rows.map(o => [o.code, o.title, o.status, o.priority, o.specialty, o.location, o.equipment].map(safe).join(';')).join('\n');
  res.type('text/csv').set('Content-Disposition', 'attachment; filename="maintflow-work-orders.csv"').send(csv);
});
