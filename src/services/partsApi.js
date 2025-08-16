import api from './api';

export const listPartRequests = async ({ status, page=1, limit=20 } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', page);
  params.set('limit', limit);
  const r = await api.get(`/parts?${params.toString()}`);
  return r.data;
};

export const createPartRequest = async ({ item, quantity, note }) => {
  const r = await api.post('/parts', { item, quantity, note });
  return r.data;
};

export const updatePartRequestStatus = async (id, status) => {
  const r = await api.put(`/parts/${id}/status`, { status });
  return r.data;
};

export const deletePartRequest = async (id) => {
  const r = await api.delete(`/parts/${id}`);
  return r.data;
};

export const getItemPriceHistory = async (itemId) => {
  const r = await api.get(`/parts/history/${itemId}`);
  return r.data;
};
