import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import api from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/users/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      // Redirect to first allowed page based on permissions
      const perms = res.data.user.permissions || {};
      if (perms.dashboard?.view) {
        window.location.href = '/';
      } else if (perms.items?.view) {
        window.location.href = '/items';
      } else if (perms.purchases?.view) {
        window.location.href = '/purchases';
      } else if (perms.warehouse?.view) {
        window.location.href = '/warehouse';
      } else if (perms.store?.view) {
        window.location.href = '/store';
      } else if (perms.store2?.view) {
        window.location.href = '/store2';
      } else if (perms.sales?.view) {
        window.location.href = '/sales';
      } else if (perms.customers?.view) {
        window.location.href = '/customers';
      } else if (perms.technicians?.view) {
        window.location.href = '/technicians';
      } else if (perms.settings?.view) {
        window.location.href = '/settings';
      } else {
        window.location.href = '/login';
      }
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
      <Paper sx={{ p: 4, minWidth: 320 }}>
        <Typography variant="h5" mb={2}>Login</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Email or Username" value={email} onChange={e => setEmail(e.target.value)} fullWidth margin="normal" required />
        <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth margin="normal" required />
        <Button onClick={handleSubmit} variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 2 }}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </Paper>
    </Box>
  );
}
