import api from './api';

export const getPurchaseSheets = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const url = q ? `/purchases/sheets?${q}` : '/purchases/sheets';
  return (await api.get(url)).data;
};

export const getTechnicians = async () => {
  return (await api.get('/technicians')).data;
};

export const assignSheet = async (purchaseId, assignment) => {
  return (await api.post(`/purchases/${purchaseId}/assign`, assignment)).data;
};

export const updateSheetStatus = async (assignmentId, statusUpdate) => {
  return (await api.put(`/purchases/assignments/${assignmentId}/status`, statusUpdate)).data;
};

export const createSheetTransfer = async (purchaseId, payload) => {
  return (await api.post(`/purchases/${purchaseId}/transfers`, payload)).data;
};

export const getSheetProgress = async (purchaseId) => {
  return (await api.get(`/purchases/${purchaseId}/progress`)).data;
};