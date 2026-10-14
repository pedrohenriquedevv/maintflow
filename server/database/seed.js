import { db, now } from './db.js';
import { STATUS } from '../domain/work-order.js';

const users = ['Alex Martins', 'Bruno Lima', 'Camila Rocha', 'Daniela Alves', 'Eduardo Nunes', 'Fernanda Souza'];
const demoOrders = [
  ['WF-1001', 'Inspeção de bomba centrífuga', 'Verificar vedação, ruído e vibração do conjunto.', 'Mecânica', 'Alta', 'Unidade Norte', 'Bomba centrífuga BC-101', STATUS.PUBLISHED],
  ['WF-1002', 'Teste de motor elétrico', 'Avaliar conexões e condição operacional do motor.', 'Elétrica', 'Normal', 'Oficina Central', 'Motor elétrico ME-204', STATUS.ASSIGNED],
  ['WF-1003', 'Revisão de painel de controle', 'Inspecionar componentes e registrar anomalias.', 'Instrumentação', 'Normal', 'Área de Utilidades', 'Painel de controle PC-310', STATUS.IN_PROGRESS],
  ['WF-1004', 'Inspeção de transportador', 'Conferir proteções, estrutura e pontos de lubrificação.', 'Mecânica', 'Baixa', 'Linha de Produção A', 'Transportador TR-405', STATUS.AWAITING_REVIEW],
  ['WF-1005', 'Manutenção de compressor', 'Executar avaliação preventiva do equipamento.', 'Mecânica', 'Alta', 'Estação de Bombeamento', 'Compressor CP-502', STATUS.DRAFT]
];

export function seedDemo(force = false) {
  if (force) db.exec('DELETE FROM history; DELETE FROM executions; DELETE FROM assignments; DELETE FROM work_orders;');
  if (db.prepare('SELECT COUNT(*) AS count FROM work_orders').get().count > 0) return;
  const insert = db.prepare(`INSERT INTO work_orders
    (code,title,description,specialty,priority,location,equipment,status,scheduled_date,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const insertAssignment = db.prepare('INSERT INTO assignments (work_order_id, technician_ids, instructions, created_at) VALUES (?,?,?,?)');
  const insertExecution = db.prepare('INSERT INTO executions (work_order_id, started_at, ended_at, duration_hours, participant_ids, result, report, submitted_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)');
  const insertHistory = db.prepare('INSERT INTO history (work_order_id, from_status, to_status, actor, reason, created_at) VALUES (?,?,?,?,?,?)');
  const transaction = db.transaction(() => {
    for (const [code, title, description, specialty, priority, location, equipment, status] of demoOrders) {
      const timestamp = now();
      const result = insert.run(code, title, description, specialty, priority, location, equipment, status, '2026-11-15', timestamp, timestamp);
      insertHistory.run(result.lastInsertRowid, null, STATUS.DRAFT, 'Sistema de demonstração', 'Criação do exemplo', timestamp);
      if (status !== STATUS.DRAFT) insertHistory.run(result.lastInsertRowid, STATUS.DRAFT, status, 'Sistema de demonstração', null, timestamp);
      if (status === STATUS.ASSIGNED) insertAssignment.run(result.lastInsertRowid, JSON.stringify([users[1]]), 'Confirmar condições de segurança antes do início.', timestamp);
      if (status === STATUS.IN_PROGRESS || status === STATUS.AWAITING_REVIEW) {
        insertAssignment.run(result.lastInsertRowid, JSON.stringify([users[2]]), 'Registrar evidências e observações relevantes.', timestamp);
        insertExecution.run(result.lastInsertRowid, '2026-11-10T08:00:00.000Z', status === STATUS.AWAITING_REVIEW ? '2026-11-10T10:30:00.000Z' : null, status === STATUS.AWAITING_REVIEW ? 2.5 : null, JSON.stringify([users[2]]), status === STATUS.AWAITING_REVIEW ? 'Concluído' : null, status === STATUS.AWAITING_REVIEW ? 'Inspeção concluída sem anomalias críticas.' : null, status === STATUS.AWAITING_REVIEW ? timestamp : null, timestamp);
      }
    }
  });
  transaction();
}
seedDemo(process.argv.includes('--reset'));
