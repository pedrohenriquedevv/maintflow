export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'INVALID_TRANSITION' || error.code === 'VALIDATION_ERROR' ? 400 : error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 409 : 500;
  res.status(status).json({ error: { code: error.code || 'INTERNAL_ERROR', message: error.message || 'Erro interno do servidor.' } });
}
