import React, { useEffect, useState } from 'react';
import { Autocomplete } from '@mui/material';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, Backdrop, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function ReturnsStore2() {
  const [returns, setReturns] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [rows, setRows] = useState([{ item: '', quantity: '', price: '' }]);
  const [customer, setCustomer] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const PAGE_SIZE = 1;
  const fetchReturns = async (p = page) => {
    setLoading(true);
    try {
      const r = await api.get(`/returns-store2?page=${p}&limit=${PAGE_SIZE}`);
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
      await api.post('/returns-store2', payload);
      setSuccess('Return added successfully');
      fetchReturns(1);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding return');
    } finally {
      setSaving(false);
    }
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setViewDialog(true);
  };
  const handleCloseView = () => {
    setViewDialog(false);
    setSelectedInvoice(null);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this return invoice?')) return;
    setLoading(true);
    try {
      await api.delete(`/returns-store2/${id}`);
      fetchReturns(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>Returns Store2</Typography>
      <Button variant="contained" color="primary" onClick={handleOpen}>Add Return</Button>
      <Box display="flex" alignItems="center" gap={2} mt={2}>
        <Button onClick={() => { if (page > 1) { setPage(page - 1); fetchReturns(page - 1); } }} disabled={page === 1} variant="outlined">Prev</Button>
        <Typography>Page {page} / {totalPages}</Typography>
        <Button onClick={() => { if (page < totalPages) { setPage(page + 1); fetchReturns(page + 1); } }} disabled={page === totalPages} variant="outlined">Next</Button>
      </Box>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Invoice #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Actions</TableCell>
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
                <TableCell>
                  <Button size="small" onClick={() => handleView(ret)}><VisibilityIcon /></Button>
                  <Button size="small" color="error" onClick={() => handleDelete(ret._id)}><DeleteIcon /></Button>
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
      <Dialog open={viewDialog} onClose={handleCloseView} maxWidth="sm" fullWidth>
        <DialogTitle>Return Invoice Details</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              <Typography><b>Customer:</b> {selectedInvoice.customer}</Typography>
              <Typography><b>Invoice #:</b> {selectedInvoice.invoice_number}</Typography>
              <Typography><b>Date:</b> {new Date(selectedInvoice.date).toLocaleString()}</Typography>
              <Typography><b>Items:</b></Typography>
              <ul>
                {(selectedInvoice.items || []).map((i, idx) => (
                  <li key={idx}>
                    {items.find(it => it._id === (i.item?._id || i.item))?.name || i.item?.name || i.item} x{i.quantity} @ {i.price}
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>
      <Backdrop open={loading || saving} sx={{ zIndex: 9999 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
