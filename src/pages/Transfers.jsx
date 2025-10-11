import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import TechnicianStatsBox from '../components/TechnicianStatsBox';
import { useInventory } from '../context/InventoryContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import api from '../services/api';
import { getPurchaseSheets } from '../services/sheetsApi';
import { createSheetTransfer } from '../services/sheetsApi';
import { hasPerm } from '../utils/permissions';

export default function Transfers() {
  const handleDelete = async (id) => {
    try {
      await api.delete(`/transfers/${id}`);
      setSuccess('Transfer deleted');
      fetchTransfers();
      setTimeout(async () => {
        await fetchInventory();
        window.dispatchEvent(new Event('inventoryChanged'));
      }, 200);
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting transfer');
    }
  };
  const [transfers, setTransfers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentDate, setCurrentDate] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from: 'warehouse', to: 'store', items: [{ item: '', quantity: '' }], technician: '', workType: '' });
  const [sheetOptions, setSheetOptions] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    technician: '',
    from: '',
    to: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const { warehouse, store, store2, items: inventoryItems, fetchInventory } = useInventory();

  // Helper functions to get inventory quantities
  const getWarehouseQty = (itemId) => warehouse.find(w => w.item?._id === itemId)?.quantity ?? 0;
  const getStoreQty = (itemId) => store.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;
  const getStore2Qty = (itemId) => store2.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;

  // Get quantity for specific location
  const getLocationQty = (location, itemId) => {
    switch(location) {
      case 'warehouse': return getWarehouseQty(itemId);
      case 'store': return getStoreQty(itemId);
      case 'store2': return getStore2Qty(itemId);
      default: return 0;
    }
  };

  const PAGE_SIZE = 20;
  const fetchTransfers = async (p = page, currentFilters = filters) => {
    setLoading(true);
    try {
      // Build query params with filters - use groupByDate mode
      const params = new URLSearchParams({
        page: p,
        groupByDate: 'true' // Enable date grouping
      });
      
      if (currentFilters.technician) params.append('technician', currentFilters.technician);
      if (currentFilters.from) params.append('from', currentFilters.from);
      if (currentFilters.to) params.append('to', currentFilters.to);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
      
      const r = await api.get(`/transfers?${params.toString()}`);
      
      if (r.data) {
        setTransfers(r.data.data || []);
        setTotalPages(r.data.totalPages || 1);
        setCurrentDate(r.data.currentDate || null);
        setHasNext(r.data.hasNext || false);
        setHasPrev(r.data.hasPrev || false);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message);
      setTransfers([]);
      setCurrentDate(null);
    } finally {
      setLoading(false);
    }
  };
  const fetchItems = async () => {
    try {
      const r = await api.get('/items');
      setItems(r.data);
    } catch (err) {
      // If the user lacks permission to view items, don't block the page
      setItems([]);
    }
  };

  const fetchTechnicians = () =>
    api.get('/technicians').then(r => setTechnicians(r.data)).catch(() => setTechnicians([]));

  useEffect(() => { 
    fetchTransfers(1); 
    fetchItems(); 
    fetchTechnicians(); 
    fetchInventory(); // Load inventory data on component mount
  }, []);

  const handleOpen = () => {
    setForm({ from: 'warehouse', to: 'store', items: [{ item: '', quantity: '' }], technician: '', workType: '' });
    setSelectedSheetId('');
    setSheetOptions([]);
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleItemChange = (idx, field, value) => {
    const newItems = form.items.map((it, i) => i === idx ? { ...it, [field]: value } : it);
    setForm(f => ({ ...f, items: newItems }));
  };
  const handleAddItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { item: '', quantity: '' }] }));
  };

  const handleRemoveItem = idx => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      // If a sheet is selected, use the sheet-specific transfer flow
      if (selectedSheetId) {
        if (form.to === 'warehouse') {
          throw new Error('For sheet transfers, destination cannot be Warehouse');
        }
        const payload = {
          destination: form.to,
          items: form.items
            .filter(it => Number(it.quantity) > 0)
            .map(it => ({ item: it.item, quantity: Number(it.quantity) })),
          workType: form.workType || undefined, // Include workType for sheet transfers
        };
        await createSheetTransfer(selectedSheetId, payload);
        setSuccess('Sheet transfer completed');
      } else {
        const payload = {
          from: form.from,
          to: form.to,
          items: form.items.map(it => ({ item: it.item, quantity: Number(it.quantity) })),
          technician: form.technician,
          workType: form.workType,
        };
        if (form._id) {
          await api.put(`/transfers/${form._id}`, payload);
          setSuccess('Transfer updated');
        } else {
          await api.post('/transfers', payload);
          setSuccess('Transfer completed');
        }
      }
      // Refresh list and inventory, then close dialog
      fetchTransfers();
      setTimeout(async () => {
        await fetchInventory(); // Refresh inventory everywhere
        window.dispatchEvent(new Event('inventoryChanged'));
      }, 200);
      // Reset form and close
      setForm({ from: 'warehouse', to: 'store', items: [{ item: '', quantity: '' }], technician: '', workType: '' });
      setSelectedSheetId('');
      setSheetOptions([]);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = t => {
    setForm({
      from: t.from,
      to: t.to,
      items: t.items.map(it => ({ item: it.item?._id || it.item, quantity: it.quantity })),
      technician: t.technician?._id || t.technician || '',
      workType: t.workType || '',
      _id: t._id,
    });
    setError('');
    setSuccess('');
    setOpen(true);
  };

  // Load sheets when technician changes
  useEffect(() => {
    const loadSheets = async () => {
      if (!form.technician) {
        setSheetOptions([]);
        setSelectedSheetId('');
        return;
      }
      try {
        const { data } = await getPurchaseSheets({ technician: form.technician, limit: 100, page: 1 });
        setSheetOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        setSheetOptions([]);
      }
    };
    loadSheets();
  }, [form.technician]);

  // When selecting a sheet, auto-fill items from the sheet with remaining quantities
  const handleSelectSheet = (value) => {
    setSelectedSheetId(value);
    const sheet = sheetOptions.find(s => s._id === value);
    if (!sheet) {
      return;
    }
    const rows = (sheet.items || []).map(it => {
      const pr = (sheet.progress || []).find(p => (p.item?._id || p.item) === (it.item?._id || it.item));
      const purchased = it.quantity || 0;
      const transferred = pr?.transferred || 0;
      const remaining = Math.max(0, purchased - transferred);
      return { item: it.item?._id || it.item, quantity: remaining };
    }).filter(r => r.quantity > 0);
    setForm(f => ({ ...f, from: 'warehouse', to: f.to === 'warehouse' ? 'store' : f.to, items: rows.length ? rows : [{ item: '', quantity: '' }] }));
  };

  // Filter handlers
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchTransfers(1, filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      technician: '',
      from: '',
      to: '',
      startDate: '',
      endDate: ''
    };
    setFilters(clearedFilters);
    setPage(1);
    fetchTransfers(1, clearedFilters);
  };

  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Transfers
      </Typography>
      {hasPerm('transfers', 'view') && (
        <Button variant="contained" color="primary" onClick={handleOpen} sx={{ fontWeight: 700, px: 3, borderRadius: 2, mb: 2 }}>Transfer Stock</Button>
      )}
      
      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(25,118,210,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: showFilters ? 2 : 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Filters
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => setShowFilters(!showFilters)}
            sx={{ fontWeight: 600 }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>
        
        {showFilters && (
          <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                select
                label="Technician"
                value={filters.technician}
                onChange={(e) => handleFilterChange('technician', e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">All Technicians</MenuItem>
                {technicians.map(t => (
                  <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                ))}
              </TextField>
              
              <TextField
                select
                label="From Location"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">All Locations</MenuItem>
                <MenuItem value="warehouse">Warehouse</MenuItem>
                <MenuItem value="store">Store</MenuItem>
                <MenuItem value="store2">Store2</MenuItem>
              </TextField>
              
              <TextField
                select
                label="To Location"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">All Locations</MenuItem>
                <MenuItem value="warehouse">Warehouse</MenuItem>
                <MenuItem value="store">Store</MenuItem>
                <MenuItem value="store2">Store2</MenuItem>
              </TextField>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                type="date"
                label="Start Date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                type="date"
                label="End Date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleApplyFilters}
                sx={{ fontWeight: 600 }}
              >
                Apply Filters
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                sx={{ fontWeight: 600 }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 520, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
        {error && (
          <Alert severity="error" sx={{ m:2 }}>{error}</Alert>
        )}
        
        {/* Date Navigation */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 2, 
          p: 2,
          borderBottom: '2px solid #e0e0e0',
          bgcolor: '#f9fafb'
        }}>
          <Button 
            variant="contained" 
            disabled={loading || !hasPrev} 
            onClick={() => { 
              const p = Math.max(1, page - 1); 
              setPage(p); 
              fetchTransfers(p); 
            }}
            sx={{ fontWeight: 600, minWidth: 120 }}
          >
            ← Previous Date
          </Button>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {currentDate ? new Date(currentDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'No Date'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Day {page} of {totalPages} • {transfers.length} transfer{transfers.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            disabled={loading || !hasNext} 
            onClick={() => { 
              const p = Math.min(totalPages, page + 1); 
              setPage(p); 
              fetchTransfers(p); 
            }}
            sx={{ fontWeight: 600, minWidth: 120 }}
          >
            Next Date →
          </Button>
        </Box>

        <Table sx={{ minWidth: 900, '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9fafd' }, '& tbody tr:hover': { backgroundColor: '#e3eafc' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>Items</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Total Qty</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>From</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>To</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Technician</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Type</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Date</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading...</TableCell>
              </TableRow>
            ) : transfers.map(t => (
              <TableRow key={t._id}>
                <TableCell sx={{ fontWeight: 600 }}>
                  {Array.isArray(t.items) && t.items.length > 0
                    ? t.items.map((it, idx) => (
                        <div key={idx}>{it.item?.name || it.item?.model || it.item?.toString?.()} ({it.quantity})</div>
                      ))
                    : t.item && t.quantity
                      ? <div>{t.item?.name || t.item?.model || t.item?.toString?.()} ({t.quantity})</div>
                      : <div>-</div>
                  }
                </TableCell>
                <TableCell>
                  {Array.isArray(t.items) && t.items.length > 0
                    ? t.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
                    : t.quantity || '-'}
                </TableCell>
                <TableCell>{t.from}</TableCell>
                <TableCell>{t.to}</TableCell>
                <TableCell>{t.technician?.name || ''}</TableCell>
                <TableCell>{t.workType || ''}</TableCell>
                <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  {hasPerm('transfers', 'edit') && (
                    <Button size="small" color="primary" onClick={() => handleEdit(t)}>Edit</Button>
                  )}
                  {hasPerm('transfers', 'delete') && (
                    <Button size="small" color="error" onClick={() => handleDelete(t._id)}>Delete</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Summary Row */}
            {!loading && transfers.length > 0 && (
              <TableRow sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold', borderTop: '2px solid #1976d2' }}>
                <TableCell sx={{ fontWeight: 900, fontSize: '1rem', color: 'primary.main' }}>
                  TOTAL FOR THIS DAY
                </TableCell>
                <TableCell sx={{ fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>
                  {transfers.reduce((sum, t) => {
                    if (Array.isArray(t.items)) {
                      return sum + t.items.reduce((itemSum, it) => itemSum + (Number(it.quantity) || 0), 0);
                    }
                    return sum + (Number(t.quantity) || 0);
                  }, 0)}
                </TableCell>
                <TableCell colSpan={6} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  {transfers.length} transfer invoice{transfers.length !== 1 ? 's' : ''} on this date
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
  <Dialog 
    open={open} 
    onClose={handleClose} 
    maxWidth="lg" 
    fullWidth
    sx={{
      '& .MuiDialog-paper': {
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }
    }}
  >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
          color: 'white', 
          fontWeight: 700,
          fontSize: '1.2rem',
          textAlign: 'center'
        }}>
          Transfer Stock
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField select margin="dense" label="From" name="from" value={form.from} onChange={handleChange} fullWidth required sx={{ flex: 1 }}>
              <MenuItem value="warehouse">Warehouse</MenuItem>
              <MenuItem value="store">Store</MenuItem>
              <MenuItem value="store2">Store2</MenuItem>
            </TextField>
            <TextField select margin="dense" label="To" name="to" value={form.to} onChange={handleChange} fullWidth required sx={{ flex: 1 }}>
              <MenuItem value="warehouse">Warehouse</MenuItem>
              <MenuItem value="store">Store</MenuItem>
              <MenuItem value="store2">Store2</MenuItem>
            </TextField>
          </Box>
          {/* Sheet selection appears when technician chosen */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              margin="dense"
              label="Sheet (optional, linked to technician)"
              value={selectedSheetId}
              onChange={(e) => handleSelectSheet(e.target.value)}
              fullWidth
              disabled={!form.technician}
              helperText={form.technician ? 'Selecting a sheet will track this transfer against that sheet and pre-fill remaining quantities.' : 'Select a technician to show assigned sheets'}
            >
              <MenuItem value="">No Sheet (regular transfer)</MenuItem>
              {sheetOptions.map(s => (
                <MenuItem key={s._id} value={s._id}>
                  {s.invoice_number} • {new Date(s.date).toLocaleDateString()} {s.assignment?.status ? `• ${s.assignment.status}` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          {/* Technician stats removed from transfer dialog as requested */}
          {form.items.map((it, idx) => {
            const selectedItem = items.find(i => i._id === it.item);
            const fromQty = form.from ? getLocationQty(form.from, it.item) : 0;
            const toQty = form.to ? getLocationQty(form.to, it.item) : 0;
            
            return (
            <Box key={idx} sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 2, 
              flexWrap: 'wrap',
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              bgcolor: '#fafafa'
            }}>
              <Box sx={{ display: 'flex', gap: 2, width: '100%', flexWrap: 'wrap' }}>
                <Autocomplete
                  options={items}
                  getOptionLabel={option => option.name || ''}
                  value={items.find(i => i._id === it.item) || null}
                  onChange={(_, newValue) => handleItemChange(idx, 'item', newValue ? newValue._id : '')}
                  renderInput={params => (
                    <TextField {...params} margin="dense" label="Item" fullWidth required />
                  )}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                  sx={{ flex: 2 }}
                />
                <TextField 
                  margin="dense" 
                  label="Quantity" 
                  value={it.quantity} 
                  onChange={e => handleItemChange(idx, 'quantity', e.target.value)} 
                  type="number" 
                  fullWidth 
                  required 
                  sx={{ flex: 1 }} 
                />
                <Button 
                  onClick={() => handleRemoveItem(idx)} 
                  color="error" 
                  sx={{ minWidth: 40, alignSelf: 'center' }}
                >
                  Remove
                </Button>
              </Box>
              
              {/* Inventory Display */}
              {selectedItem && (form.from || form.to) && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: 3, 
                  width: '100%', 
                  mt: 1,
                  p: 1.5,
                  bgcolor: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8'
                }}>
                  {form.from && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1,
                      color: '#1976d2'
                    }}>
                      <Typography variant="body2" fontWeight="600">
                        From {form.from.charAt(0).toUpperCase() + form.from.slice(1)}:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        bgcolor: '#e3f2fd',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {fromQty} available
                      </Typography>
                    </Box>
                  )}
                  
                  {form.to && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1,
                      color: '#388e3c'
                    }}>
                      <Typography variant="body2" fontWeight="600">
                        To {form.to.charAt(0).toUpperCase() + form.to.slice(1)}:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        bgcolor: '#e8f5e8',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {toQty} current
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
            );
          })}
          <Button onClick={handleAddItem} sx={{ mb: 2 }}>Add Another Item</Button>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField select margin="dense" label="Technician" name="technician" value={form.technician} onChange={handleChange} fullWidth sx={{ flex: 1 }}>
              <MenuItem value="">Select Technician</MenuItem>
              {technicians.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
            </TextField>
            <TextField select margin="dense" label="Type" name="workType" value={form.workType} onChange={handleChange} fullWidth sx={{ flex: 1 }}>
              <MenuItem value="">Select Type</MenuItem>
              <MenuItem value="repair">Repair</MenuItem>
              <MenuItem value="test">Test</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          {(
            // Allow creating transfers with 'view'; require 'edit' to update existing ones
            (!form._id && hasPerm('transfers','view')) || (form._id && hasPerm('transfers','edit'))
          ) && (
            <Button onClick={handleSubmit} variant="contained" disabled={submitting}>{submitting ? 'Transferring...' : 'Transfer'}</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
