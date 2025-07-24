import api from './api';

export const fetchSalesTotalByDate = async (from, to) => {
  let url = '/sales';
  const params = [];
  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  if (params.length) url += '?' + params.join('&');
  const r = await api.get(url);
  return r.data;
};

export const fetchStore2SalesTotalByDate = async (from, to) => {
  let url = '/sales-store2';
  const params = [];
  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  if (params.length) url += '?' + params.join('&');
  const r = await api.get(url);
  return r.data;
};
