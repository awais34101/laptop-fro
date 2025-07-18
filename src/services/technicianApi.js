import api from './api';

export const fetchTechnicians = () => api.get('/technicians').then(r => r.data);
