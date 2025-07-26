// This file has been removed as the technician login/system is no longer supported.

// The following functions have been removed:
// - fetchMyAssignedItems
// - fetchMyStats
import api from './api';

export const fetchMyAssignedItems = () => api.get('/technician-self/assigned-items').then(r => r.data);
export const fetchMyStats = (from, to) => {
  let url = '/technician-self/stats';
  if (from || to) {
    const params = [];
    if (from) params.push(`from=${encodeURIComponent(from)}`);
    if (to) params.push(`to=${encodeURIComponent(to)}`);
    url += '?' + params.join('&');
  }
  return api.get(url).then(r => r.data);
};
