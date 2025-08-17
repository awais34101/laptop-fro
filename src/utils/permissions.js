export function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

export function isAdmin() {
  const u = getUser();
  return u && u.role === 'admin';
}

export function hasPerm(section, action) {
  const u = getUser();
  if (!u) return false;
  if (u.role === 'admin') return true;
  return !!u.permissions?.[section]?.[action];
}
