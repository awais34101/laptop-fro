import api from './api';

export const clockIn = (notes) => api.post('/time/clock-in', { notes }).then(r => r.data);
export const clockOut = () => api.post('/time/clock-out').then(r => r.data);
export const listTimeEntries = (params) => api.get('/time', { params }).then(r => r.data);
export const updateEntry = (id, data) => api.put(`/time/${id}`, data).then(r => r.data);
export const deleteEntry = (id) => api.delete(`/time/${id}`).then(r => r.data);
