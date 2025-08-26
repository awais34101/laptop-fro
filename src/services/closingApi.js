import api from './api';

export const getClosingSummary = async (date, storeType) => {
  const res = await api.get(`/closing/${date}/${storeType}`);
  return res.data;
};
