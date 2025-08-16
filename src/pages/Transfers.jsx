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
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from: 'warehouse', to: 'store', items: [{ item: '', quantity: '' }], technician: '', workType: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { fetchInventory } = useInventory();

  const PAGE_SIZE = 1;
  const fetchTransfers = async (p = page) => {
    setLoading(true);
    try {
      const r = await api.get(`/transfers?page=${p}&limit=${PAGE_SIZE}`);
      if (Array.isArray(r.data)) {
        // backward compatibility
        const sorted = [...r.data].sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransfers(sorted.slice(0, 1));
        setTotalPages(sorted.length ? sorted.length : 1);
      } else {
        setTransfers(r.data.data || []);
        setTotalPages(r.data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  };
  const fetchItems = () => api.get('/items').then(r => setItems(r.data));

  const fetchTechnicians = () =>
    api.get('/technicians').then(r => setTechnicians(r.data)).catch(() => setTechnicians([]));

  useEffect(() => { fetchTransfers(1); fetchItems(); fetchTechnicians(); }, []);

  const handleOpen = () => {
    setForm({ from: 'warehouse', to: 'store', items: [{ item: '', quantity: '' }], technician: '', workType: '' });
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
      // Refresh list and inventory, then close dialog
      fetchTransfers();
      setTimeout(async () => {
        await fetchInventory(); // Refresh inventory everywhere
        window.dispatchEvent(new Event('inventoryChanged'));
      }, 200);
      // Reset form and close
      setForm({ from: 'warehouse', to: 'store', items: [{ item: '', quantity: '' }], technician: '', workType: '' });
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

  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Transfers
      </Typography>
      <Button variant="contained" color="primary" onClick={handleOpen} sx={{ fontWeight: 700, px: 3, borderRadius: 2, mb: 2 }}>Transfer Stock</Button>
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 520, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <Button variant="outlined" disabled={loading || page <= 1} onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchTransfers(p); }}>Prev</Button>
          <Typography variant="body2">Page {page} / {totalPages}</Typography>
          <Button variant="outlined" disabled={loading || page >= totalPages} onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchTransfers(p); }}>Next</Button>
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
                  <Button size="small" color="primary" onClick={() => handleEdit(t)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(t._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
  <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Stock</DialogTitle>
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
          {/* Technician stats removed from transfer dialog as requested */}
          {form.items.map((it, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Autocomplete
                options={items}
                getOptionLabel={option => option.name || ''}
                value={items.find(i => i._id === it.item) || null}
                onChange={(_, newValue) => handleItemChange(idx, 'item', newValue ? newValue._id : '')}
                renderInput={params => (
                  <TextField {...params} margin="dense" label="Item" fullWidth required />
                )}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                sx={{ flex: 1 }}
              />
              <TextField margin="dense" label="Quantity" value={it.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} type="number" fullWidth required sx={{ flex: 1 }} />
              <Button onClick={() => handleRemoveItem(idx)} color="error" sx={{ minWidth: 40, alignSelf: 'center' }}>Remove</Button>
            </Box>
          ))}
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
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>{submitting ? 'Transferring...' : 'Transfer'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
