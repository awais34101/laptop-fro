import api from './api';

export const getTransfers = async (params = {}) => {
  const response = await api.get('/transfers', { params });
  return response.data;
};

export const createTransfer = async (data) => {
  const response = await api.post('/transfers', data);
  return response.data;
};

export const getTransferById = async (id) => {
  const response = await api.get(`/transfers/${id}`);
  return response.data;
};

export const verifyTransfer = async (id, data) => {
  const response = await api.post(`/transfers/${id}/verify`, data);
  return response.data;
};
