import api from './api';

export const useParts = async (payload) => (await api.post('/parts-usage', payload)).data;

export const listPartsUsage = async ({ page = 1, limit = 20 } = {}) => {
	return (await api.get('/parts-usage', { params: { page, limit } })).data;
};
