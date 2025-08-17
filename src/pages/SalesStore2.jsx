import React, { useEffect, useState } from 'react';
import { Autocomplete } from '@mui/material';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useInventory } from '../context/InventoryContext';
import { hasPerm } from '../utils/permissions';

export default function SalesStore2() {
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
      const r = await api.get(`/sales-store2?page=${p}&limit=${PAGE_SIZE}`);
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
    } catch {
      setItems([]);
    }
  };
  const fetchCustomers = async () => {
    try {
      const r = await api.get('/customers');
      setCustomers(r.data);
    } catch {
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
        await api.put(`/sales-store2/${editId}`, {
          items: itemsPayload,
          customer,
          invoice_number: invoiceNumber
        });
      } else {
        await api.post('/sales-store2', {
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
      await api.delete(`/sales-store2/${id}`);
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
        Sales Invoices (Store2)
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
            ) : sales.map(sale => sale.items.map((row, idx) => (
              <TableRow key={sale._id + '-' + idx}>
                <TableCell>{sale.customer?.name || '-'}</TableCell>
                <TableCell>{sale.invoice_number}</TableCell>
                <TableCell>{sale.date ? new Date(sale.date).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{row.item?.name || getItemName(row.item?._id || row.item)}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>{row.price}</TableCell>
                <TableCell>{(row.quantity * row.price).toFixed(2)}</TableCell>
                <TableCell>
                  {hasPerm('sales','edit') && (
                    <IconButton onClick={() => handleOpen(sale)}><EditIcon /></IconButton>
                  )}
                  {hasPerm('sales','delete') && (
                    <IconButton onClick={() => handleDelete(sale._id)}><DeleteIcon /></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))) }
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Sale Invoice' : 'Add Sale Invoice'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Autocomplete
              options={customers}
              getOptionLabel={option => option.name || ''}
              value={customers.find(c => c._id === customer) || null}
              onChange={(_, v) => setCustomer(v?._id || '')}
              renderInput={params => <TextField {...params} label="Customer" fullWidth />}
              sx={{ width: 300 }}
            />
            <TextField
              label="Invoice Number"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              sx={{ width: 200 }}
            />
          </Box>
          {rows.map((row, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Autocomplete
                options={items}
                getOptionLabel={option => option.name || ''}
                value={items.find(i => i._id === row.item) || null}
                onChange={(_, v) => handleRowChange(idx, 'item', v?._id || '')}
                renderInput={params => <TextField {...params} label="Item" fullWidth />}
                sx={{ width: 300 }}
              />
              <TextField
                label="Quantity"
                type="number"
                value={row.quantity}
                onChange={e => handleRowChange(idx, 'quantity', e.target.value)}
                sx={{ width: 120 }}
              />
              <TextField
                label="Price"
                type="number"
                value={row.price}
                onChange={e => handleRowChange(idx, 'price', e.target.value)}
                sx={{ width: 120 }}
              />
              <Button onClick={() => handleRemoveRow(idx)} color="error" sx={{ minWidth: 40 }}>Remove</Button>
            </Box>
          ))}
          <Button onClick={handleAddRow} sx={{ mt: 1 }}>Add Item</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {hasPerm('sales','view') && (
            <Button onClick={handleSubmit} variant="contained" color="primary" disabled={saving}>{saving ? 'Saving…' : (editId ? 'Save' : 'Add Invoice')}</Button>
          )}
        </DialogActions>
      </Dialog>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
    </Box>
  );
}
