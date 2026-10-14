async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'Não foi possível concluir a solicitação.');
  return body.data;
}
export const api = {
  list: query => request(`/work-orders${query ? `?${new URLSearchParams(query)}` : ''}`),
  get: id => request(`/work-orders/${id}`),
  create: data => request('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  action: (id, name, data = {}) => request(`/work-orders/${id}/${name}`, { method: 'POST', body: JSON.stringify(data) }),
  history: id => request(`/work-orders/${id}/history`),
  reset: () => request('/demo/reset', { method: 'POST', body: '{}' }),
  exportUrl: '/api/export/work-orders.csv'
};
