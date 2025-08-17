import React, { useEffect, useState } from 'react';
import { Autocomplete } from '@mui/material';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useInventory } from '../context/InventoryContext';
import { hasPerm } from '../utils/permissions';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([{ item: '', quantity: '', price: '' }]);
  const [customer, setCustomer] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { fetchInventory } = useInventory();

  const PAGE_SIZE = 1;
  const fetchSales = async (p = page) => {
    setLoading(true);
    try {
      const r = await api.get(`/sales?page=${p}&limit=${PAGE_SIZE}`);
      if (Array.isArray(r.data)) {
        const sorted = [...r.data].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setSales(sorted.slice(0, 1));
        setTotalPages(sorted.length ? sorted.length : 1);
      } else {
        setSales(r.data.data || []);
        setTotalPages(r.data.totalPages || 1);
      }
    } catch (e) {
      setSales([]);
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchItems = async () => {
    try {
      const r = await api.get('/items');
      setItems(r.data);
    } catch (e) {
      // If no permission to view items, keep empty list
      setItems([]);
    }
  };
  const fetchCustomers = async () => {
    try {
      const r = await api.get('/customers');
      setCustomers(r.data);
    } catch (e) {
      setCustomers([]);
    }
  };

  useEffect(() => { fetchSales(1); fetchItems(); fetchCustomers(); }, []);

  const handleOpen = (sale) => {
    if (sale) {
      setRows(sale.items ? sale.items.map(i => ({ item: i.item?._id || i.item, quantity: i.quantity, price: i.price || '' })) : [{ item: '', quantity: '', price: '' }]);
      setCustomer(sale.customer?._id || sale.customer || '');
      setInvoiceNumber(sale.invoice_number || '');
      setEditId(sale._id);
    } else {
      setRows([{ item: '', quantity: '', price: '' }]);
      setCustomer('');
      setInvoiceNumber('');
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleRowChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };
  const handleAddRow = () => setRows([...rows, { item: '', quantity: '', price: '' }]);
  const handleRemoveRow = idx => setRows(rows => rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const itemsPayload = rows.map(r => ({ item: r.item, quantity: Number(r.quantity), price: Number(r.price) }));
      if (editId) {
        await api.put(`/sales/${editId}`, {
          items: itemsPayload,
          customer,
          invoice_number: invoiceNumber
        });
      } else {
        await api.post('/sales', {
          items: itemsPayload,
          customer,
          invoice_number: invoiceNumber
        });
      }
      setSuccess('Sale invoice saved');
      setOpen(false);
      fetchSales();
      setTimeout(async () => {
        await fetchInventory();
        window.dispatchEvent(new Event('inventoryChanged'));
      }, 200);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  // Helper: get item name by id
  const getItemName = (id) => items.find(i => i._id === id)?.name || '';

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/sales/${id}`);
      setSuccess('Invoice deleted successfully');
      fetchSales();
      setTimeout(async () => {
        await fetchInventory();
        window.dispatchEvent(new Event('inventoryChanged'));
      }, 200);
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Sales Invoices
      </Typography>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}
      {hasPerm('sales','view') && (
        <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ fontWeight: 700, px: 3, borderRadius: 2, mb: 2 }}>Add Sale Invoice</Button>
      )}
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 520, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <Button variant="outlined" disabled={loading || page <= 1} onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchSales(p); }}>Prev</Button>
          <Typography variant="body2">Page {page} / {totalPages}</Typography>
          <Button variant="outlined" disabled={loading || page >= totalPages} onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchSales(p); }}>Next</Button>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading...</TableCell>
              </TableRow>
            ) : sales.map(s => (
              <React.Fragment key={s._id}>
                {s.items && s.items.map((item, idx) => (
                  <TableRow key={s._id + '-' + idx} sx={{ transition: 'background 0.2s' }}>
                    {idx === 0 && (
                      <React.Fragment>
                        <TableCell rowSpan={s.items.length} sx={{ fontWeight: 600 }}>{s.customer?.name || ''}</TableCell>
                        <TableCell rowSpan={s.items.length}>{s.invoice_number || ''}</TableCell>
                        <TableCell rowSpan={s.items.length}>{new Date(s.date).toLocaleDateString()}</TableCell>
                      </React.Fragment>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>{item.item?.name || getItemName(item.item?._id || item.item)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price?.toFixed(2) || ''}</TableCell>
                    <TableCell>{(item.quantity && item.price) ? (Number(item.quantity) * Number(item.price)).toFixed(2) : ''}</TableCell>
                    {idx === 0 && (
                      <TableCell rowSpan={s.items.length}>
                        {hasPerm('sales','edit') && (
                          <IconButton onClick={() => handleOpen(s)}><EditIcon /></IconButton>
                        )}
                        {hasPerm('sales','delete') && (
                          <IconButton onClick={() => handleDelete(s._id)}><DeleteIcon /></IconButton>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {/* Invoice total row */}
                <TableRow>
                  <TableCell colSpan={6} align="right" sx={{ background: '#f0f4fa', fontWeight: 700 }}>Invoice Total</TableCell>
                  <TableCell colSpan={2} align="left" sx={{ background: '#f0f4fa', fontWeight: 700 }}>
                    {s.items && s.items.reduce((sum, i) => sum + (Number(i.quantity) * (i.price || 0)), 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Sale Invoice</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField select label="Customer" value={customer} onChange={e => setCustomer(e.target.value)} fullWidth required>
              {customers.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Invoice Number" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} fullWidth required />
          </Box>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {/* Wider item selector */}
                      <Box sx={{ minWidth: 300, width: 380, maxWidth: '100%' }}>
                        <Autocomplete
                          options={items}
                          getOptionLabel={option => option.name || ''}
                          value={items.find(i => i._id === row.item) || null}
                          onChange={(_, newValue) => handleRowChange(idx, 'item', newValue ? newValue._id : '')}
                          renderInput={params => (
                            <TextField {...params} label="Item" required />
                          )}
                          isOptionEqualToValue={(option, value) => option._id === value._id}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width: 140 }}>
                      <TextField type="number" value={row.quantity} onChange={e => handleRowChange(idx, 'quantity', e.target.value)} required sx={{ width: 120 }} />
                    </TableCell>
                    <TableCell sx={{ width: 160 }}>
                      <TextField type="number" value={row.price} onChange={e => handleRowChange(idx, 'price', e.target.value)} required sx={{ width: 120 }} />
                    </TableCell>
                    <TableCell>
                      {(row.quantity && row.price) ? (Number(row.quantity) * Number(row.price)).toFixed(2) : ''}
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => handleRemoveRow(idx)} color="error" disabled={rows.length === 1}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Invoice total row */}
                <TableRow>
                  <TableCell colSpan={3} align="right"><b>Invoice Total</b></TableCell>
                  <TableCell align="left" colSpan={2}>
                    <b>{rows.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.price) || 0), 0).toFixed(2)}</b>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Button onClick={handleAddRow} color="primary">Add Item</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {hasPerm('sales','view') && (
            <Button onClick={handleSubmit} variant="contained" disabled={saving}>{saving ? 'Saving…' : (editId ? 'Save' : 'Add Invoice')}</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
