import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roles, financialOnly, permission }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = user.permissions || {};

  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  if (financialOnly && !user.canViewFinancials) return <Navigate to="/" />;
  if (permission) {
    const { section, action } = permission;
    if (!permissions[section]?.[action]) return <Navigate to="/" />;
  }
  return children;
}
