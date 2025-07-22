
import React, { useState, useEffect } from 'react';
import { fetchTechnicians } from '../services/technicianApi';
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
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import api from '../services/api';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [items, setItems] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ item: '', quantity: '', direction: 'warehouse-to-store', technician: '', workType: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { fetchInventory } = useInventory();

  const fetchTransfers = () =>
    api.get('/transfers').then(r => {
      // Sort by date descending (latest first)
      const sorted = [...r.data].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransfers(sorted);
    });
  const fetchItems = () => api.get('/items').then(r => setItems(r.data));

  useEffect(() => { fetchTransfers(); fetchItems(); fetchTechnicians().then(setTechnicians); }, []);

  const handleOpen = () => {
    setForm({ item: '', quantity: '', direction: 'warehouse-to-store', technician: '', workType: '' });
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      await api.post('/transfers', { ...form, quantity: Number(form.quantity) });
      setSuccess('Transfer completed');
      fetchTransfers();
      setTimeout(async () => {
        await fetchInventory(); // Refresh inventory everywhere
        window.dispatchEvent(new Event('inventoryChanged'));
      }, 200);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Transfers
      </Typography>
      <Button variant="contained" color="primary" onClick={handleOpen} sx={{ fontWeight: 700, px: 3, borderRadius: 2, mb: 2 }}>Transfer Stock</Button>
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 520, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
        <Table sx={{ minWidth: 900, '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9fafd' }, '& tbody tr:hover': { backgroundColor: '#e3eafc' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>Item</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Quantity</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Technician</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Type</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map(t => (
              <TableRow key={t._id}>
                <TableCell sx={{ fontWeight: 600 }}>{t.item?.name}</TableCell>
                <TableCell>{t.quantity}</TableCell>
                <TableCell>{t.technician?.name || ''}</TableCell>
                <TableCell>{t.workType || ''}</TableCell>
                <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
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
            <TextField select margin="dense" label="Item" name="item" value={form.item} onChange={handleChange} fullWidth required sx={{ flex: 1 }}>
              {items.map(i => <MenuItem key={i._id} value={i._id}>{i.name}</MenuItem>)}
            </TextField>
            <TextField margin="dense" label="Quantity" name="quantity" value={form.quantity} onChange={handleChange} type="number" fullWidth required sx={{ flex: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField select margin="dense" label="Technician" name="technician" value={form.technician} onChange={handleChange} fullWidth required sx={{ flex: 1 }}>
              <MenuItem value="">Select Technician</MenuItem>
              {technicians.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
            </TextField>
            <TextField select margin="dense" label="Type" name="workType" value={form.workType} onChange={handleChange} fullWidth required sx={{ flex: 1 }}>
              <MenuItem value="">Select Type</MenuItem>
              <MenuItem value="repair">Repair</MenuItem>
              <MenuItem value="test">Test</MenuItem>
            </TextField>
          </Box>
          {/* Hidden direction field */}
          <input type="hidden" name="direction" value={form.direction} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Transfer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
