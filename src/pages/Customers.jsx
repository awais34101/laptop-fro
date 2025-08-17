import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { hasPerm } from '../utils/permissions';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchCustomers = () => api.get('/customers').then(r => setCustomers(r.data));

  useEffect(() => { fetchCustomers(); }, []);

  const handleOpen = (customer) => {
    if (customer) {
      setForm({ name: customer.name, phone: customer.phone, email: customer.email });
      setEditId(customer._id);
    } else {
      setForm({ name: '', phone: '', email: '' });
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/customers/${editId}`, form);
        setSuccess('Customer updated');
      } else {
        await api.post('/customers', form);
        setSuccess('Customer added');
      }
      fetchCustomers();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      setError('Delete failed');
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Customer Management</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Customer</Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map(c => (
              <TableRow key={c._id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {hasPerm('customers','edit') && (
                    <Button size="small" onClick={() => handleOpen(c)}>Edit</Button>
                  )}
                  {hasPerm('customers','delete') && (
                    <Button size="small" color="error" onClick={() => handleDelete(c._id)}>Delete</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField margin="dense" label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Email" name="email" value={form.email} onChange={handleChange} fullWidth required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
