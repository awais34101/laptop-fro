import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Paper, TextField, Button, Alert, Switch, FormControlLabel, Divider, CircularProgress } from '@mui/material';

export default function Settings() {
  const [settings, setSettings] = useState({ 
    low_stock_days: '', 
    slow_moving_days: '',
    auto_delete_sales_days: '',
    auto_delete_purchase_days: '',
    auto_delete_transfer_days: '',
    auto_delete_checklist_days: '',
    enable_auto_delete: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data));
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setSettings({ 
      ...settings, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async () => {
    try {
      await api.put('/settings', {
        low_stock_days: Number(settings.low_stock_days),
        slow_moving_days: Number(settings.slow_moving_days),
        auto_delete_sales_days: Number(settings.auto_delete_sales_days),
        auto_delete_purchase_days: Number(settings.auto_delete_purchase_days),
        auto_delete_transfer_days: Number(settings.auto_delete_transfer_days),
        auto_delete_checklist_days: Number(settings.auto_delete_checklist_days),
        enable_auto_delete: settings.enable_auto_delete
      });
      setSuccess('Settings updated successfully');
      setError('');
    } catch (err) {
      setError('Failed to update settings');
      setSuccess('');
    }
  };

  const handleRunAutoDelete = async () => {
    if (!settings.enable_auto_delete) {
      setError('Auto delete is not enabled');
      return;
    }
    
    if (!window.confirm('Are you sure you want to run auto delete? This will permanently delete old records and cannot be undone.')) {
      return;
    }
    
    setDeleteLoading(true);
    setDeleteResult(null);
    try {
      const response = await api.post('/settings/auto-delete');
      setDeleteResult(response.data);
      setSuccess('Auto delete completed successfully');
      setError('');
    } catch (err) {
      setError('Auto delete failed: ' + (err.response?.data?.error || err.message));
      setDeleteResult(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      
      <Paper sx={{ p: 3, maxWidth: 600, mb: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {/* Inventory Settings */}
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
          Inventory Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField 
            margin="dense" 
            label="Low Stock Days" 
            name="low_stock_days" 
            value={settings.low_stock_days} 
            onChange={handleChange} 
            type="number" 
            fullWidth 
            required 
            helperText="Days to consider items as low stock"
          />
          <TextField 
            margin="dense" 
            label="Slow Moving Days" 
            name="slow_moving_days" 
            value={settings.slow_moving_days} 
            onChange={handleChange} 
            type="number" 
            fullWidth 
            required 
            helperText="Days to consider items as slow moving"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Auto Delete Settings */}
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
          Auto Delete Settings
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.enable_auto_delete}
              onChange={handleChange}
              name="enable_auto_delete"
              color="primary"
            />
          }
          label="Enable Automatic Deletion of Old Records"
          sx={{ mb: 2 }}
        />

        {settings.enable_auto_delete && (
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 2, 
            flexDirection: 'column',
            p: 2,
            bgcolor: '#f8f9fa',
            borderRadius: 2,
            border: '1px solid #e9ecef'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Configure how many days to keep records before automatic deletion:
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField 
                margin="dense" 
                label="Sales Invoices (Days)" 
                name="auto_delete_sales_days" 
                value={settings.auto_delete_sales_days} 
                onChange={handleChange} 
                type="number" 
                required 
                sx={{ flex: 1, minWidth: 180 }}
                helperText="Auto delete sales after X days"
              />
              <TextField 
                margin="dense" 
                label="Purchase Invoices (Days)" 
                name="auto_delete_purchase_days" 
                value={settings.auto_delete_purchase_days} 
                onChange={handleChange} 
                type="number" 
                required 
                sx={{ flex: 1, minWidth: 180 }}
                helperText="Auto delete purchases after X days"
              />
              <TextField 
                margin="dense" 
                label="Transfer History (Days)" 
                name="auto_delete_transfer_days" 
                value={settings.auto_delete_transfer_days} 
                onChange={handleChange} 
                type="number" 
                required 
                sx={{ flex: 1, minWidth: 180 }}
                helperText="Auto delete transfers after X days"
              />
              <TextField 
                margin="dense" 
                label="Checklist Reports (Days)" 
                name="auto_delete_checklist_days" 
                value={settings.auto_delete_checklist_days} 
                onChange={handleChange} 
                type="number" 
                required 
                sx={{ flex: 1, minWidth: 180 }}
                helperText="Auto delete checklist reports after X days"
              />
            </Box>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                ⚠️ <strong>Warning:</strong> Auto-deleted records cannot be recovered. 
                Make sure to backup important data before enabling this feature.
              </Typography>
            </Alert>

            {/* Manual Auto Delete Trigger */}
            <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc02' }}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Manual Cleanup
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Run auto delete now to clean up old records based on current settings.
              </Typography>
              <Button 
                variant="outlined" 
                color="warning" 
                onClick={handleRunAutoDelete}
                disabled={deleteLoading || !settings.enable_auto_delete}
                startIcon={deleteLoading ? <CircularProgress size={16} /> : null}
              >
                {deleteLoading ? 'Running...' : 'Run Auto Delete Now'}
              </Button>
              
              {/* Auto Delete Results */}
              {deleteResult && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                    Cleanup Results:
                  </Typography>
                  <Typography variant="body2">
                    • Sales Invoices (Store): {deleteResult.deleted.sales} deleted
                  </Typography>
                  <Typography variant="body2">
                    • Sales Invoices (Store2): {deleteResult.deleted.salesStore2} deleted
                  </Typography>
                  <Typography variant="body2">
                    • Purchase Invoices: {deleteResult.deleted.purchases} deleted
                  </Typography>
                  <Typography variant="body2">
                    • Transfer Records: {deleteResult.deleted.transfers} deleted
                  </Typography>
                  <Typography variant="body2">
                    • Checklist Reports: {deleteResult.deleted.checklists || 0} deleted
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmit}>
          Save Settings
        </Button>
      </Paper>
    </Box>
  );
}
