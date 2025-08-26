import React, { useEffect, useState } from 'react';
import { Autocomplete } from '@mui/material';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, Backdrop, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function ReturnsStore() {
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
      const r = await api.get(`/returns-store?page=${p}&limit=${PAGE_SIZE}`);
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
      await api.post('/returns-store', payload);
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
      await api.delete(`/returns-store/${id}`);
      fetchReturns(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting invoice');
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate total value for a return
  const getTotalValue = (ret) => (ret.items || []).reduce((sum, i) => sum + (Number(i.quantity) * Number(i.price)), 0);
  const getItemName = (id) => items.find(i => i._id === id)?.name || '';

  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Returns Store
      </Typography>
      <Button variant="contained" color="primary" onClick={handleOpen} sx={{ fontWeight: 700, px: 3, borderRadius: 2, mb: 2 }}>Add Return</Button>
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 520, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <Button variant="outlined" disabled={page <= 1} onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchReturns(p); }}>Prev</Button>
          <Typography variant="body2">Page {page} / {totalPages}</Typography>
          <Button variant="outlined" disabled={page >= totalPages} onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchReturns(p); }}>Next</Button>
        </Box>
        <Table sx={{ minWidth: 900, '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9fafd' }, '& tbody tr:hover': { backgroundColor: '#e3eafc' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>Customer</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Invoice #</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Date</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Item</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Quantity</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Price</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Total</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {returns.map(ret => (
              <React.Fragment key={ret._id}>
                {(ret.items && ret.items.length > 0) ? ret.items.map((item, idx) => (
                  <TableRow key={ret._id + '-' + idx} sx={{ transition: 'background 0.2s' }}>
                    {idx === 0 && (
                      <React.Fragment>
                        <TableCell rowSpan={ret.items.length} sx={{ fontWeight: 600 }}>{ret.customer}</TableCell>
                        <TableCell rowSpan={ret.items.length}>{ret.invoice_number}</TableCell>
                        <TableCell rowSpan={ret.items.length}>{new Date(ret.date).toLocaleDateString()}</TableCell>
                      </React.Fragment>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>{item.item?.name || getItemName(item.item?._id || item.item) || item.item}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price?.toFixed(2) || ''}</TableCell>
                    <TableCell>{(item.quantity && item.price) ? (Number(item.quantity) * Number(item.price)).toFixed(2) : ''}</TableCell>
                    {idx === 0 && (
                      <TableCell rowSpan={ret.items.length}>
                        <Button size="small" onClick={() => handleView(ret)}><VisibilityIcon /></Button>
                        <Button size="small" color="error" onClick={() => handleDelete(ret._id)}><DeleteIcon /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8}>No items</TableCell>
                  </TableRow>
                )}
                {/* Invoice total row */}
                <TableRow>
                  <TableCell colSpan={6} align="right" sx={{ background: '#f0f4fa', fontWeight: 700 }}>Invoice Total</TableCell>
                  <TableCell colSpan={2} align="left" sx={{ background: '#f0f4fa', fontWeight: 700 }}>
                    {getTotalValue(ret).toFixed(2)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
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
              <Typography sx={{mt:1}}><b>Total Value:</b> {getTotalValue(selectedInvoice).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</Typography>
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
