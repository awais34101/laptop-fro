import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roles, financialOnly }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  if (financialOnly && !user.canViewFinancials) return <Navigate to="/" />;
  return children;
}
