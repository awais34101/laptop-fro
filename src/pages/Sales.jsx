import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([{ item: '', quantity: '', price: '' }]);
  const [customer, setCustomer] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchSales = () => api.get('/sales').then(r => setSales(r.data));
  const fetchItems = () => api.get('/items').then(r => setItems(r.data));
  const fetchCustomers = () => api.get('/customers').then(r => setCustomers(r.data));

  useEffect(() => { fetchSales(); fetchItems(); fetchCustomers(); }, []);

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
      fetchSales();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  // Helper: get item name by id
  const getItemName = (id) => items.find(i => i._id === id)?.name || '';

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Sales Invoices</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Sale Invoice</Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Invoice #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map(s => (
              <React.Fragment key={s._id}>
                {s.items && s.items.map((item, idx) => (
                  <TableRow key={s._id + '-' + idx}>
                    {idx === 0 && (
                      <>
                        <TableCell rowSpan={s.items.length}>{s.customer?.name || ''}</TableCell>
                        <TableCell rowSpan={s.items.length}>{s.invoice_number || ''}</TableCell>
                        <TableCell rowSpan={s.items.length}>{new Date(s.date).toLocaleDateString()}</TableCell>
                      </>
                    )}
                    <TableCell>{item.item?.name || getItemName(item.item?._id || item.item)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price?.toFixed(2) || ''}</TableCell>
                    <TableCell>{(item.quantity && item.price) ? (Number(item.quantity) * Number(item.price)).toFixed(2) : ''}</TableCell>
                    {idx === 0 && (
                      <TableCell rowSpan={s.items.length}>
                        <IconButton onClick={() => handleOpen(s)}><EditIcon /></IconButton>
                        {/* <IconButton onClick={() => handleDelete(s._id)}><DeleteIcon /></IconButton> */}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {/* Invoice total row */}
                <TableRow>
                  <TableCell colSpan={6} align="right"><b>Invoice Total</b></TableCell>
                  <TableCell colSpan={2} align="left">
                    <b>{s.items && s.items.reduce((sum, i) => sum + (Number(i.quantity) * (i.price || 0)), 0).toFixed(2)}</b>
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
                      <TextField select value={row.item} onChange={e => handleRowChange(idx, 'item', e.target.value)} fullWidth required>
                        {items.map(i => <MenuItem key={i._id} value={i._id}>{i.name}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField type="number" value={row.quantity} onChange={e => handleRowChange(idx, 'quantity', e.target.value)} fullWidth required />
                    </TableCell>
                    <TableCell>
                      <TextField type="number" value={row.price} onChange={e => handleRowChange(idx, 'price', e.target.value)} fullWidth required />
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
          <Button onClick={handleSubmit} variant="contained">Add Invoice</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
