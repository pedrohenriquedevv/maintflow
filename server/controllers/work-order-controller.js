import { service } from '../services/work-order-service.js';
export const controller = {
  list(req, res) { res.json({ data: service.list(req.query) }); },
  get(req, res) { res.json({ data: service.get(req.params.id) }); },
  create(req, res) { res.status(201).json({ data: service.create(req.body) }); },
  update(req, res) { res.json({ data: service.update(req.params.id, req.body) }); },
  action(name) { return (req, res) => res.json({ data: service[name](req.params.id, req.body) }); },
  history(req, res) { res.json({ data: service.history(req.params.id) }); }
};
