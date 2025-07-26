import api from './api';

// Fetch all warehouse items
export const fetchWarehouseItems = () =>
  api.get('/warehouse').then(r => r.data);

// Fetch available warehouse items (quantity > 0)
export const fetchAvailableWarehouseItems = () =>
  api.get('/warehouse/available').then(r => r.data);
