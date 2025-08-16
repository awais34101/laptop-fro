import api from './api';

export const listDocuments = async ({ q = '', category = '', page = 1, limit = 20, expiringInDays } = {}) => {
  const params = {};
  if (q) params.q = q;
  if (category) params.category = category;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (typeof expiringInDays !== 'undefined') params.expiringInDays = expiringInDays;
  return (await api.get('/documents', { params })).data;
};

export const createDocument = async (payload) => (await api.post('/documents', payload)).data;
export const updateDocument = async (id, payload) => (await api.put(`/documents/${id}`, payload)).data;
export const deleteDocument = async (id) => (await api.delete(`/documents/${id}`)).data;
export const listDocumentCategories = async () => (await api.get('/documents/categories')).data;
