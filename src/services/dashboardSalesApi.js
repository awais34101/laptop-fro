import api from './api';

// Returns numeric total from backend aggregate
export const fetchSalesTotalByDate = async (from, to) => {
  let url = '/sales/total';
  const params = [];
  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  if (params.length) url += '?' + params.join('&');
  const r = await api.get(url);
  return Number(r.data?.total || 0);
};

export const fetchStore2SalesTotalByDate = async (from, to) => {
  let url = '/sales-store2/total';
  const params = [];
  if (from) params.push(`from=${encodeURIComponent(from)}`);
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  if (params.length) url += '?' + params.join('&');
  const r = await api.get(url);
  return Number(r.data?.total || 0);
};
