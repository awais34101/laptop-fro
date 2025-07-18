
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

  const fetchTransfers = () => api.get('/transfers').then(r => setTransfers(r.data));
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
      await fetchInventory(); // Refresh inventory everywhere
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Transfer Stock to Store</Typography>
      <Button variant="contained" color="primary" onClick={handleOpen}>Transfer Stock</Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Technician</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map(t => (
              <TableRow key={t._id}>
                <TableCell>{t.item?.name}</TableCell>
                <TableCell>{t.quantity}</TableCell>
                <TableCell>{t.technician?.name || ''}</TableCell>
                <TableCell>{t.workType || ''}</TableCell>
                <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Transfer Stock</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField select margin="dense" label="Item" name="item" value={form.item} onChange={handleChange} fullWidth required>
            {items.map(i => <MenuItem key={i._id} value={i._id}>{i.name}</MenuItem>)}
          </TextField>
          <TextField margin="dense" label="Quantity" name="quantity" value={form.quantity} onChange={handleChange} type="number" fullWidth required />
          <TextField select margin="dense" label="Technician" name="technician" value={form.technician} onChange={handleChange} fullWidth required>
            <MenuItem value="">Select Technician</MenuItem>
            {technicians.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
          </TextField>
          <TextField select margin="dense" label="Type" name="workType" value={form.workType} onChange={handleChange} fullWidth required>
            <MenuItem value="">Select Type</MenuItem>
            <MenuItem value="repair">Repair</MenuItem>
            <MenuItem value="test">Test</MenuItem>
          </TextField>
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
