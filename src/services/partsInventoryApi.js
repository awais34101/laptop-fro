import api from './api';

export const listParts = async () => (await api.get('/parts-inventory/parts')).data;
export const createPart = async (payload) => (await api.post('/parts-inventory/parts', payload)).data;
export const updatePart = async (id, payload) => (await api.put(`/parts-inventory/parts/${id}`, payload)).data;
export const deletePart = async (id) => (await api.delete(`/parts-inventory/parts/${id}`)).data;

export const getInventory = async () => (await api.get('/parts-inventory/inventory')).data;
export const transferParts = async (payload) => (await api.post('/parts-inventory/transfers', payload)).data;
export const listPartsTransfers = async (params={}) => {
  const q = new URLSearchParams(params).toString();
  const url = q ? `/parts-inventory/transfers?${q}` : '/parts-inventory/transfers';
  return (await api.get(url)).data;
};
