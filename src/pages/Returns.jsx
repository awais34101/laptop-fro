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
    <Box p={2}>
      <Typography variant="h5" gutterBottom>Returns</Typography>
      <Button variant="contained" color="primary" onClick={handleOpen}>Add Return</Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Invoice #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Items</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {returns.map(ret => (
              <TableRow key={ret._id}>
                <TableCell>{ret.customer}</TableCell>
                <TableCell>{ret.invoice_number}</TableCell>
                <TableCell>{new Date(ret.date).toLocaleString()}</TableCell>
                <TableCell>
                  {(ret.items || []).map((i, idx) => (
                    <div key={idx}>
                      {items.find(it => it._id === (i.item?._id || i.item))?.name || i.item?.name || i.item} x{i.quantity} @ {i.price}
                    </div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Return</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField label="Customer" value={customer} onChange={e => setCustomer(e.target.value)} fullWidth margin="normal" required />
          <TextField label="Invoice Number" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} fullWidth margin="normal" required />
          {rows.map((row, idx) => (
            <Box key={idx} display="flex" gap={1} alignItems="center" mt={2}>
              <Autocomplete
                options={items}
                getOptionLabel={option => option.name || ''}
                value={items.find(i => i._id === row.item) || null}
                onChange={(_, val) => handleRowChange(idx, 'item', val?._id || '')}
                renderInput={params => <TextField {...params} label="Item" required />}
                sx={{ flex: 2 }}
              />
              <TextField label="Qty" type="number" value={row.quantity} onChange={e => handleRowChange(idx, 'quantity', e.target.value)} sx={{ flex: 1 }} required />
              <TextField label="Price" type="number" value={row.price} onChange={e => handleRowChange(idx, 'price', e.target.value)} sx={{ flex: 1 }} required />
              <Button onClick={() => handleRemoveRow(idx)} disabled={rows.length === 1}>Remove</Button>
            </Box>
          ))}
          <Button onClick={handleAddRow} sx={{ mt: 2 }}>Add Item</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={saving}>Save</Button>
        </DialogActions>
      </Dialog>
      <Backdrop open={loading || saving} sx={{ zIndex: 9999 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
