import api from './api';

export const listExpenses = async ({ store = 'store', from, to, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (store) params.set('store', store);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  const r = await api.get(`/expenses?${params.toString()}`);
  return r.data;
};

export const createExpense = async ({ store = 'store', items, note, date }) => {
  const params = new URLSearchParams({ store });
  const r = await api.post(`/expenses?${params.toString()}`, { items, note, date });
  return r.data;
};

export const updateExpense = async (id, { store = 'store', items, note, date }) => {
  const params = new URLSearchParams({ store });
  const r = await api.put(`/expenses/${id}?${params.toString()}`, { items, note, date });
  return r.data;
};

export const deleteExpense = async (id, store = 'store') => {
  const params = new URLSearchParams({ store });
  const r = await api.delete(`/expenses/${id}?${params.toString()}`);
  return r.data;
};
