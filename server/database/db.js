import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const dbPath = process.env.MAINTFLOW_DB || join(here, 'maintflow.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });
export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS work_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
    description TEXT NOT NULL, specialty TEXT NOT NULL, priority TEXT NOT NULL,
    location TEXT NOT NULL, equipment TEXT NOT NULL, status TEXT NOT NULL,
    scheduled_date TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, work_order_id INTEGER NOT NULL UNIQUE,
    technician_ids TEXT NOT NULL, instructions TEXT, created_at TEXT NOT NULL,
    FOREIGN KEY(work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, work_order_id INTEGER NOT NULL UNIQUE,
    started_at TEXT, ended_at TEXT, duration_hours REAL, participant_ids TEXT,
    result TEXT, report TEXT, submitted_at TEXT, updated_at TEXT,
    FOREIGN KEY(work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, work_order_id INTEGER NOT NULL,
    from_status TEXT, to_status TEXT NOT NULL, actor TEXT NOT NULL,
    reason TEXT, created_at TEXT NOT NULL,
    FOREIGN KEY(work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
  );
`);

export function now() { return new Date().toISOString(); }
