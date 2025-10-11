import React, { useEffect, useState } from 'react';
import { Autocomplete } from '@mui/material';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, Backdrop, CircularProgress } from '@mui/material';

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([{ item: '', quantity: '', price: '' }]);
  const [customer, setCustomer] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const PAGE_SIZE = 10;
  const fetchReturns = async (p = page) => {
    setLoading(true);
    try {
      const r = await api.get(`/returns?page=${p}&limit=${PAGE_SIZE}`);
      if (Array.isArray(r.data)) {
        setReturns(r.data);
        setTotalPages(1);
      } else {
        setReturns(r.data.data || []);
        setTotalPages(r.data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  };
  const fetchItems = () => api.get('/items').then(r => setItems(Array.isArray(r.data) ? r.data : []));

  useEffect(() => { fetchReturns(1); fetchItems(); }, []);

  const handleOpen = () => {
    setRows([{ item: '', quantity: '', price: '' }]);
    setCustomer('');
    setInvoiceNumber('');
    setOpen(true);
    setError('');
    setSuccess('');
  };
  const handleClose = () => {
    setOpen(false);
    setRows([{ item: '', quantity: '', price: '' }]);
    setCustomer('');
    setInvoiceNumber('');
    setError('');
    setSuccess('');
  };
  const handleRowChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };
  const handleAddRow = () => setRows([...rows, { item: '', quantity: '', price: '' }]);
  const handleRemoveRow = (idx) => setRows(rows => rows.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        items: rows.map(r => ({ item: r.item, quantity: Number(r.quantity), price: Number(r.price) })),
        customer,
        invoice_number: invoiceNumber,
      };
      await api.post('/returns', payload);
      setSuccess('Return added successfully');
      fetchReturns(1);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding return');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        p: { xs: 2, sm: 3, md: 4 }
      }}
    >
      {/* Header Section */}
      <Box 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          p: 3,
          mb: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            Returns Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage all return invoices
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={handleOpen}
          sx={{
            background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
            fontWeight: 700,
            px: 4,
            py: 1.5,
            borderRadius: 3,
            boxShadow: '0 4px 15px rgba(211, 47, 47, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
              boxShadow: '0 6px 20px rgba(211, 47, 47, 0.4)'
            }
          }}
        >
          + Add Return
        </Button>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>{success}</Alert>
      )}

      {/* Pagination Controls */}
      <Box 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          p: 2,
          mb: 3,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3
        }}
      >
        <Button 
          variant="outlined" 
          disabled={loading || page <= 1} 
          onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchReturns(p); }}
          sx={{
            borderColor: '#d32f2f',
            color: '#d32f2f',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              borderColor: '#b71c1c',
              background: 'rgba(211, 47, 47, 0.05)'
            }
          }}
        >
          Previous
        </Button>
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#d32f2f' }}>
          Page {page} of {totalPages}
        </Typography>
        <Button 
          variant="outlined" 
          disabled={loading || page >= totalPages} 
          onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchReturns(p); }}
          sx={{
            borderColor: '#d32f2f',
            color: '#d32f2f',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              borderColor: '#b71c1c',
              background: 'rgba(211, 47, 47, 0.05)'
            }
          }}
        >
          Next
        </Button>
      </Box>

      {/* Returns Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, ml: 2 }}>
              Loading returns...
            </Typography>
          </Box>
        ) : returns.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No returns found
            </Typography>
          </Box>
        ) : returns.map(ret => (
          <Paper 
            key={ret._id}
            sx={{
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden'
            }}
          >
            {/* Return Header */}
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  👤 Customer: {ret.customer || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  📅 Date: {new Date(ret.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem', fontWeight: 600 }}>
                    Invoice Number
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mt: 0.5 }}>
                    {ret.invoice_number || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Items Table */}
            <TableContainer 
              sx={{ 
                maxHeight: 400,
                '&::-webkit-scrollbar': {
                  width: '10px',
                  height: '10px'
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: 10
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                  borderRadius: 10,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)'
                  }
                }
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(183, 28, 28, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#d32f2f'
                      }}
                    >
                      Item Name
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(183, 28, 28, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#d32f2f'
                      }}
                    >
                      Quantity
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(183, 28, 28, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#d32f2f'
                      }}
                    >
                      Price (AED)
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(183, 28, 28, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#d32f2f'
                      }}
                    >
                      Total (AED)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(ret.items || []).map((i, idx) => (
                    <TableRow 
                      key={idx}
                      sx={{
                        '&:hover': {
                          background: 'linear-gradient(90deg, rgba(211, 47, 47, 0.03) 0%, rgba(183, 28, 28, 0.03) 100%)'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>
                        {items.find(it => it._id === (i.item?._id || i.item))?.name || i.item?.name || i.item}
                      </TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.15) 0%, rgba(183, 28, 28, 0.15) 100%)',
                            fontWeight: 600,
                            color: '#d32f2f'
                          }}
                        >
                          {i.quantity}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#2e7d32' }}>
                        {i.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#d32f2f' }}>
                        {(i.quantity && i.price) ? (Number(i.quantity) * Number(i.price)).toFixed(2) : '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow>
                    <TableCell 
                      colSpan={3} 
                      align="right"
                      sx={{ 
                        background: 'linear-gradient(90deg, rgba(211, 47, 47, 0.15) 0%, rgba(183, 28, 28, 0.2) 100%)',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: '#1a237e',
                        borderTop: '3px solid #d32f2f'
                      }}
                    >
                      Return Total:
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(90deg, rgba(211, 47, 47, 0.2) 0%, rgba(183, 28, 28, 0.15) 100%)',
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        color: '#d32f2f',
                        borderTop: '3px solid #d32f2f'
                      }}
                    >
                      {(ret.items || []).reduce((sum, i) => sum + (Number(i.quantity) * (i.price || 0)), 0).toFixed(2)} AED
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
      </Box>
      
      {/* Add Return Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.5rem',
            py: 2.5
          }}
        >
          📋 Add Return Invoice
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 3,
                border: '1px solid #ef5350'
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3, 
                borderRadius: 3
              }}
            >
              {success}
            </Alert>
          )}
          
          {/* Customer and Invoice Info */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
              p: 2.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(183, 28, 28, 0.05) 100%)',
              border: '1px solid rgba(211, 47, 47, 0.2)'
            }}
          >
            <TextField 
              label="Customer Name" 
              value={customer} 
              onChange={e => setCustomer(e.target.value)} 
              fullWidth 
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#d32f2f'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d32f2f'
                  }
                }
              }}
            />
            <TextField 
              label="Invoice Number" 
              value={invoiceNumber} 
              onChange={e => setInvoiceNumber(e.target.value)} 
              fullWidth 
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#d32f2f'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d32f2f'
                  }
                }
              }}
            />
          </Box>

          {/* Items Section */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: '#d32f2f', 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            📦 Return Items
          </Typography>
          
          {rows.map((row, idx) => (
            <Box 
              key={idx} 
              sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                p: 2.5,
                borderRadius: 3,
                background: '#fff',
                border: '2px solid rgba(211, 47, 47, 0.15)',
                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.08)',
                alignItems: 'flex-start',
                flexWrap: 'wrap'
              }}
            >
              <Autocomplete
                options={items}
                getOptionLabel={option => option.name || ''}
                value={items.find(i => i._id === row.item) || null}
                onChange={(_, val) => handleRowChange(idx, 'item', val?._id || '')}
                renderInput={params => (
                  <TextField 
                    {...params} 
                    label="Select Item" 
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                )}
                sx={{ flex: 2, minWidth: 250 }}
              />
              <TextField 
                label="Quantity" 
                type="number" 
                value={row.quantity} 
                onChange={e => handleRowChange(idx, 'quantity', e.target.value)} 
                required
                sx={{ 
                  flex: 1,
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <TextField 
                label="Price (AED)" 
                type="number" 
                value={row.price} 
                onChange={e => handleRowChange(idx, 'price', e.target.value)} 
                required
                sx={{ 
                  flex: 1,
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(183, 28, 28, 0.1) 100%)',
                  border: '1px solid rgba(211, 47, 47, 0.2)',
                  minWidth: 100
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                  Total: {(row.quantity && row.price) ? (Number(row.quantity) * Number(row.price)).toFixed(2) : '0.00'} AED
                </Typography>
              </Box>
              <Button 
                onClick={() => handleRemoveRow(idx)} 
                disabled={rows.length === 1}
                variant="outlined"
                color="error"
                sx={{ 
                  minWidth: 100,
                  borderRadius: 2,
                  fontWeight: 600,
                  '&:disabled': {
                    opacity: 0.4
                  }
                }}
              >
                🗑️ Remove
              </Button>
            </Box>
          ))}
          
          <Button 
            onClick={handleAddRow} 
            variant="outlined"
            sx={{ 
              mt: 2,
              borderColor: '#d32f2f',
              color: '#d32f2f',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              py: 1,
              '&:hover': {
                borderColor: '#b71c1c',
                background: 'rgba(211, 47, 47, 0.05)'
              }
            }}
          >
            + Add Another Item
          </Button>

          {/* Total Summary */}
          <Box 
            sx={{ 
              mt: 4,
              p: 2.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(183, 28, 28, 0.15) 100%)',
              border: '2px solid rgba(211, 47, 47, 0.3)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a237e', textAlign: 'right' }}>
              Grand Total: {rows.reduce((sum, r) => sum + (Number(r.quantity || 0) * Number(r.price || 0)), 0).toFixed(2)} AED
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: '#f8f9fa' }}>
          <Button 
            onClick={handleClose}
            disabled={saving}
            sx={{
              fontWeight: 600,
              color: '#666',
              px: 3,
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={saving}
            sx={{
              background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
              fontWeight: 700,
              px: 4,
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
                boxShadow: '0 4px 15px rgba(211, 47, 47, 0.4)'
              }
            }}
          >
            {saving ? '⏳ Saving...' : '✅ Save Return'}
          </Button>
        </DialogActions>
      </Dialog>
      <Backdrop open={loading || saving} sx={{ zIndex: 9999 }}>
        <CircularProgress sx={{ color: '#d32f2f' }} />
      </Backdrop>
    </Box>
  );
}