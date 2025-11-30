import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Paper, TextField, Button, Alert, Switch, FormControlLabel, Divider, CircularProgress, Grid, Card, CardContent, Chip, Stack } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StoreIcon from '@mui/icons-material/Store';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SaveIcon from '@mui/icons-material/Save';

export default function Settings() {
  const [settings, setSettings] = useState({ 
    low_stock_threshold_warehouse: '', 
    low_stock_threshold_store: '', 
    low_stock_threshold_store2: '', 
    slow_moving_days: '',
    inactive_customer_days: '',
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
        low_stock_threshold_warehouse: Number(settings.low_stock_threshold_warehouse),
        low_stock_threshold_store: Number(settings.low_stock_threshold_store),
        low_stock_threshold_store2: Number(settings.low_stock_threshold_store2),
        slow_moving_days: Number(settings.slow_moving_days),
        inactive_customer_days: Number(settings.inactive_customer_days),
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
    <Box sx={{ 
      p: 4, 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 900, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          ⚙️ System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Configure alerts, thresholds, and automation rules for your CRM system
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
            fontWeight: 600
          }}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
            fontWeight: 600
          }}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Inventory Settings Card */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(102, 126, 234, 0.1)',
            height: '100%'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}>
                  <InventoryIcon sx={{ fontSize: 32, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Inventory Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Configure stock alerts and thresholds
                  </Typography>
                </Box>
              </Stack>

              {/* Low Stock Thresholds */}
              <Box sx={{ 
                p: 3, 
                borderRadius: 3, 
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                border: '2px solid rgba(102, 126, 234, 0.1)',
                mb: 3
              }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Low Stock Alert Thresholds
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                  Set minimum quantity levels for each location
                </Typography>

                <Stack spacing={2}>
                  <Box sx={{ 
                    p: 2.5, 
                    borderRadius: 2, 
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                      <WarehouseIcon sx={{ color: '#667eea', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Warehouse
                      </Typography>
                      <Chip label="Main Storage" size="small" sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        fontWeight: 700
                      }} />
                    </Stack>
                    <TextField 
                      fullWidth
                      size="small"
                      label="Threshold Quantity" 
                      name="low_stock_threshold_warehouse" 
                      value={settings.low_stock_threshold_warehouse} 
                      onChange={handleChange} 
                      type="number" 
                      required 
                      helperText="Alert when quantity ≤ this number"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontWeight: 600
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ 
                    p: 2.5, 
                    borderRadius: 2, 
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                      <StoreIcon sx={{ color: '#10b981', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Store 1
                      </Typography>
                      <Chip label="Retail" size="small" sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        fontWeight: 700
                      }} />
                    </Stack>
                    <TextField 
                      fullWidth
                      size="small"
                      label="Threshold Quantity" 
                      name="low_stock_threshold_store" 
                      value={settings.low_stock_threshold_store} 
                      onChange={handleChange} 
                      type="number" 
                      required 
                      helperText="Alert when quantity ≤ this number"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontWeight: 600
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ 
                    p: 2.5, 
                    borderRadius: 2, 
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                      <StoreIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Store 2
                      </Typography>
                      <Chip label="Retail" size="small" sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#fff',
                        fontWeight: 700
                      }} />
                    </Stack>
                    <TextField 
                      fullWidth
                      size="small"
                      label="Threshold Quantity" 
                      name="low_stock_threshold_store2" 
                      value={settings.low_stock_threshold_store2} 
                      onChange={handleChange} 
                      type="number" 
                      required 
                      helperText="Alert when quantity ≤ this number"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontWeight: 600
                        }
                      }}
                    />
                  </Box>
                </Stack>
              </Box>

              {/* Slow Moving Settings */}
              <Box sx={{ 
                p: 3, 
                borderRadius: 3, 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)',
                border: '2px solid rgba(239, 68, 68, 0.15)'
              }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Slow Moving Items
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontWeight: 500 }}>
                  Alert for items with no sales activity
                </Typography>
                <TextField 
                  fullWidth
                  label="Slow Moving Days" 
                  name="slow_moving_days" 
                  value={settings.slow_moving_days} 
                  onChange={handleChange} 
                  type="number" 
                  required 
                  helperText="Days to consider items as slow moving"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: '#fff',
                      fontWeight: 600
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Settings Card */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            height: '100%'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}>
                  <PeopleIcon sx={{ fontSize: 32, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Customer Alerts
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Track customer engagement
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ 
                p: 3, 
                borderRadius: 3, 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.15)'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
                  Inactive Customer Alert
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontWeight: 500 }}>
                  Get notified when customers haven't purchased in a while
                </Typography>
                <TextField 
                  fullWidth
                  label="Inactive Customer Days" 
                  name="inactive_customer_days" 
                  value={settings.inactive_customer_days} 
                  onChange={handleChange} 
                  type="number" 
                  required 
                  helperText="Alert if customer hasn't made a purchase in this many days"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: '#fff',
                      fontWeight: 600
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Auto Delete Settings Card */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                }}>
                  <DeleteSweepIcon sx={{ fontSize: 32, color: '#fff' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Auto Delete Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Automatically clean up old records
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enable_auto_delete}
                      onChange={handleChange}
                      name="enable_auto_delete"
                      color="error"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#ef4444',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#ef4444',
                        }
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 700, color: settings.enable_auto_delete ? '#ef4444' : 'text.secondary' }}>
                      {settings.enable_auto_delete ? 'ENABLED' : 'DISABLED'}
                    </Typography>
                  }
                />
              </Stack>

              {settings.enable_auto_delete && (
                <Box sx={{ mt: 3 }}>
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 3,
                      border: '2px solid #f59e0b',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    ⚠️ <strong>Warning:</strong> Auto-deleted records cannot be recovered. Make sure to backup important data!
                  </Alert>

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                    Retention Periods
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: 2.5, 
                        borderRadius: 3, 
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
                        border: '2px solid rgba(99, 102, 241, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Sales Invoices
                        </Typography>
                        <TextField 
                          fullWidth
                          size="small"
                          name="auto_delete_sales_days" 
                          value={settings.auto_delete_sales_days} 
                          onChange={handleChange} 
                          type="number" 
                          required 
                          sx={{ 
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: '#fff',
                              fontWeight: 700,
                              fontSize: '1.1rem'
                            }
                          }}
                          InputProps={{
                            endAdornment: <Typography sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>days</Typography>
                          }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: 2.5, 
                        borderRadius: 3, 
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%)',
                        border: '2px solid rgba(236, 72, 153, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Purchases
                        </Typography>
                        <TextField 
                          fullWidth
                          size="small"
                          name="auto_delete_purchase_days" 
                          value={settings.auto_delete_purchase_days} 
                          onChange={handleChange} 
                          type="number" 
                          required 
                          sx={{ 
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: '#fff',
                              fontWeight: 700,
                              fontSize: '1.1rem'
                            }
                          }}
                          InputProps={{
                            endAdornment: <Typography sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>days</Typography>
                          }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: 2.5, 
                        borderRadius: 3, 
                        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 132, 199, 0.1) 100%)',
                        border: '2px solid rgba(14, 165, 233, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Transfers
                        </Typography>
                        <TextField 
                          fullWidth
                          size="small"
                          name="auto_delete_transfer_days" 
                          value={settings.auto_delete_transfer_days} 
                          onChange={handleChange} 
                          type="number" 
                          required 
                          sx={{ 
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: '#fff',
                              fontWeight: 700,
                              fontSize: '1.1rem'
                            }
                          }}
                          InputProps={{
                            endAdornment: <Typography sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>days</Typography>
                          }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ 
                        p: 2.5, 
                        borderRadius: 3, 
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)',
                        border: '2px solid rgba(34, 197, 94, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Checklists
                        </Typography>
                        <TextField 
                          fullWidth
                          size="small"
                          name="auto_delete_checklist_days" 
                          value={settings.auto_delete_checklist_days} 
                          onChange={handleChange} 
                          type="number" 
                          required 
                          sx={{ 
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: '#fff',
                              fontWeight: 700,
                              fontSize: '1.1rem'
                            }
                          }}
                          InputProps={{
                            endAdornment: <Typography sx={{ fontWeight: 700, color: 'text.secondary', ml: 1 }}>days</Typography>
                          }}
                        />
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Manual Auto Delete Trigger */}
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                    border: '2px solid #f59e0b',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                      🧹 Manual Cleanup
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                      Run auto delete now to clean up old records based on current settings.
                    </Typography>
                    <Button 
                      variant="contained"
                      color="warning"
                      size="large"
                      onClick={handleRunAutoDelete}
                      disabled={deleteLoading || !settings.enable_auto_delete}
                      startIcon={deleteLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <DeleteSweepIcon />}
                      sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 4,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                          boxShadow: '0 6px 16px rgba(245, 158, 11, 0.5)'
                        }
                      }}
                    >
                      {deleteLoading ? 'Running Cleanup...' : 'Run Auto Delete Now'}
                    </Button>
                    
                    {/* Auto Delete Results */}
                    {deleteResult && (
                      <Box sx={{ 
                        mt: 3, 
                        p: 3, 
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        border: '2px solid #10b981'
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#065f46', mb: 2 }}>
                          ✅ Cleanup Results
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={4}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: '#fff' }}>
                              <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981' }}>
                                {deleteResult.deleted.sales}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Sales (Store 1)
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: '#fff' }}>
                              <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981' }}>
                                {deleteResult.deleted.salesStore2}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Sales (Store 2)
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: '#fff' }}>
                              <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981' }}>
                                {deleteResult.deleted.purchases}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Purchases
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: '#fff' }}>
                              <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981' }}>
                                {deleteResult.deleted.transfers}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Transfers
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: '#fff' }}>
                              <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981' }}>
                                {deleteResult.deleted.checklists || 0}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Checklists
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button - Fixed at bottom */}
      <Box sx={{ 
        position: 'sticky',
        bottom: 20,
        mt: 4,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 10
      }}>
        <Button 
          variant="contained" 
          size="large"
          onClick={handleSubmit}
          startIcon={<SaveIcon />}
          sx={{
            fontWeight: 800,
            fontSize: '1.1rem',
            px: 6,
            py: 2,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          💾 Save All Settings
        </Button>
      </Box>
    </Box>
  );
}
