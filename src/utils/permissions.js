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
  // Align with backend: allow staff to perform 'view' on common sections even if perms object is empty
  if (u.role === 'staff' && action === 'view') {
    const allow = new Set(['partsInventory','documents','expenses','transfers','purchases','purchaseSheets','technicians','warehouse']);
    if (allow.has(section)) return true;
  }
  return !!u.permissions?.[section]?.[action];
}
