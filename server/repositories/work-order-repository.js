import { db, now } from '../database/db.js';

function parse(row) {
  if (!row) return null;
  return {
    ...row,
    assignment: row.technician_ids ? { technicianIds: JSON.parse(row.technician_ids), instructions: row.instructions } : null,
    execution: row.started_at ? { startedAt: row.started_at, endedAt: row.ended_at, durationHours: row.duration_hours, participantIds: JSON.parse(row.participant_ids || '[]'), result: row.result, report: row.report, submittedAt: row.submitted_at } : null
  };
}
const base = `SELECT w.*, a.technician_ids, a.instructions, e.started_at, e.ended_at,
 e.duration_hours, e.participant_ids, e.result, e.report, e.submitted_at
 FROM work_orders w LEFT JOIN assignments a ON a.work_order_id=w.id
 LEFT JOIN executions e ON e.work_order_id=w.id`;

export const repository = {
  list(filters = {}) {
    const conditions = [], values = [];
    if (filters.search) { conditions.push('(w.code LIKE ? OR w.title LIKE ? OR w.equipment LIKE ? OR w.location LIKE ?)'); values.push(...Array(4).fill(`%${filters.search}%`)); }
    for (const field of ['status', 'priority', 'specialty', 'scheduled_date']) if (filters[field]) { conditions.push(`w.${field} = ?`); values.push(filters[field]); }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    return db.prepare(`${base}${where} ORDER BY w.updated_at DESC`).all(...values).map(parse);
  },
  find(id) { return parse(db.prepare(`${base} WHERE w.id=?`).get(id)); },
  create(data) {
    const timestamp = now();
    const result = db.prepare(`INSERT INTO work_orders (code,title,description,specialty,priority,location,equipment,status,scheduled_date,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(data.code, data.title, data.description, data.specialty, data.priority, data.location, data.equipment, data.status, data.scheduledDate || null, timestamp, timestamp);
    return this.find(result.lastInsertRowid);
  },
  update(id, data) {
    db.prepare(`UPDATE work_orders SET title=?,description=?,specialty=?,priority=?,location=?,equipment=?,scheduled_date=?,updated_at=? WHERE id=?`)
      .run(data.title, data.description, data.specialty, data.priority, data.location, data.equipment, data.scheduledDate || null, now(), id);
    return this.find(id);
  },
  transition(id, from, to, actor, reason) {
    const timestamp = now();
    db.prepare('UPDATE work_orders SET status=?,updated_at=? WHERE id=?').run(to, timestamp, id);
    db.prepare('INSERT INTO history (work_order_id,from_status,to_status,actor,reason,created_at) VALUES (?,?,?,?,?,?)').run(id, from, to, actor, reason || null, timestamp);
  },
  assign(id, technicianIds, instructions) {
    const timestamp = now();
    db.prepare(`INSERT INTO assignments (work_order_id,technician_ids,instructions,created_at) VALUES (?,?,?,?)
      ON CONFLICT(work_order_id) DO UPDATE SET technician_ids=excluded.technician_ids,instructions=excluded.instructions`)
      .run(id, JSON.stringify(technicianIds), instructions || null, timestamp);
  },
  saveExecution(id, execution) {
    const timestamp = now();
    db.prepare(`INSERT INTO executions (work_order_id,started_at,ended_at,duration_hours,participant_ids,result,report,submitted_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(work_order_id) DO UPDATE SET started_at=excluded.started_at,ended_at=excluded.ended_at,duration_hours=excluded.duration_hours,participant_ids=excluded.participant_ids,result=excluded.result,report=excluded.report,submitted_at=excluded.submitted_at,updated_at=excluded.updated_at`)
      .run(id, execution.startedAt, execution.endedAt || null, execution.durationHours || null, JSON.stringify(execution.participantIds || []), execution.result || null, execution.report || null, execution.submittedAt || null, timestamp);
  },
  history(id) { return db.prepare('SELECT * FROM history WHERE work_order_id=? ORDER BY created_at ASC, id ASC').all(id); },
  reset() { db.exec('DELETE FROM history; DELETE FROM executions; DELETE FROM assignments; DELETE FROM work_orders;'); }
};
