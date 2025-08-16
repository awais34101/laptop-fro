import api from './api';

export const listPartsPurchases = async (params={}) => {
  const q = new URLSearchParams(params).toString();
  const url = q ? `/parts-purchases?${q}` : '/parts-purchases';
  return (await api.get(url)).data;
};

export const createPartsPurchase = async (payload) => (await api.post('/parts-purchases', payload)).data;
export const deletePartsPurchase = async (id) => (await api.delete(`/parts-purchases/${id}`)).data;
