import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';

export default function Settings() {
  const [settings, setSettings] = useState({ low_stock_days: '', slow_moving_days: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data));
  }, []);

  const handleChange = e => setSettings({ ...settings, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      await api.put('/settings', {
        low_stock_days: Number(settings.low_stock_days),
        slow_moving_days: Number(settings.slow_moving_days)
      });
      setSuccess('Settings updated');
      setError('');
    } catch (err) {
      setError('Update failed');
      setSuccess('');
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Paper sx={{ p: 2, maxWidth: 400 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField margin="dense" label="Low Stock Days" name="low_stock_days" value={settings.low_stock_days} onChange={handleChange} type="number" fullWidth required />
        <TextField margin="dense" label="Slow Moving Days" name="slow_moving_days" value={settings.slow_moving_days} onChange={handleChange} type="number" fullWidth required />
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmit}>Save</Button>
      </Paper>
    </Box>
  );
}
