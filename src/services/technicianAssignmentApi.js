import api from './api';

// Fetch all technicians
export const fetchTechnicians = () =>
  api.get('/technicians').then(r => r.data);

// Fetch all technician assignments
export const fetchTechnicianAssignments = () =>
  api.get('/technician-assignments').then(r => r.data);

// Assign items to a technician
export const assignItemsToTechnician = (technicianId, itemIds) =>
  api.post('/technician-assignments', { technicianId, itemIds }).then(r => r.data);

// Unassign items from a technician
export const unassignItemsFromTechnician = (technicianId, itemIds) =>
  api.delete('/technician-assignments/unassign', { data: { technicianId, itemIds } }).then(r => r.data);

// Update comment for an item
export const updateItemComment = (technicianId, itemId, comment) =>
  api.put('/technician-assignments/comment', { technicianId, itemId, comment }).then(r => r.data);
