import api from './api';

export const fetchTechnicianStats = (from, to) => {
  let url = '/technician-stats';
  if (from || to) {
    const params = [];
    if (from) params.push(`from=${encodeURIComponent(from)}`);
    if (to) params.push(`to=${encodeURIComponent(to)}`);
    url += '?' + params.join('&');
  }
  return api.get(url).then(r => r.data);
};
