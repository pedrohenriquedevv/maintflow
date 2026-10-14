import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/app.js';
import { db } from '../server/database/db.js';

beforeAll(() => db.exec('DELETE FROM history; DELETE FROM executions; DELETE FROM assignments; DELETE FROM work_orders;'));
afterAll(() => db.close());

describe('API MaintFlow', () => {
  it('responde health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
  it('cria e consulta uma ordem', async () => {
    const payload = { code: 'TEST-001', title: 'Ordem de teste', description: 'Descrição de teste', specialty: 'Mecânica', priority: 'Normal', location: 'Oficina Central', equipment: 'Equipamento sintético' };
    const created = await request(app).post('/api/work-orders').send(payload);
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('Rascunho');
    const found = await request(app).get(`/api/work-orders/${created.body.data.id}`);
    expect(found.status).toBe(200);
    expect(found.body.data.code).toBe('TEST-001');
  });
  it('rejeita delegação sem técnico e exporta CSV', async () => {
    const list = await request(app).get('/api/work-orders');
    const id = list.body.data[0].id;
    await request(app).post(`/api/work-orders/${id}/publish`);
    const invalid = await request(app).post(`/api/work-orders/${id}/assign`).send({ technicianIds: [] });
    expect(invalid.status).toBe(400);
    const csv = await request(app).get('/api/export/work-orders.csv');
    expect(csv.status).toBe(200);
    expect(csv.text).toContain('Código');
  });
});
