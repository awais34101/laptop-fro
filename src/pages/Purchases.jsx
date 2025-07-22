import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useInventory } from '../context/InventoryContext';



export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([{ item: '', quantity: '', price: '' }]);
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [storeStock, setStoreStock] = useState([]);
  const { fetchInventory } = useInventory();

  const fetchPurchases = () => api.get('/purchases').then(r => setPurchases(r.data));
  const fetchItems = () => api.get('/items').then(r => setItems(Array.isArray(r.data) ? r.data : []));
  const fetchWarehouse = () => api.get('/warehouse').then(r => setWarehouseStock(r.data));
  const fetchStore = () => api.get('/store').then(r => setStoreStock(r.data));

  useEffect(() => { fetchPurchases(); fetchItems(); fetchWarehouse(); fetchStore(); }, []);

  const handleOpen = (purchase) => {
    if (purchase) {
      setRows((Array.isArray(purchase.items) ? purchase.items : []).map(i => ({ item: i.item?._id || i.item, quantity: i.quantity, price: i.price })));
      setSupplier(purchase.supplier);
      setInvoiceNumber(purchase.invoice_number);
      setEditId(purchase._id);
    } else {
      setRows([{ item: '', quantity: '', price: '' }]);
      setSupplier('');
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
    setOpen(false);
    try {
      // 1. Ensure all items exist in the items list
      const existingItemIds = items.map(i => i._id);
      for (const row of rows) {
        // If item is not in the items list (by _id), try to add it
        if (!existingItemIds.includes(row.item)) {
          // Try to find by name (in case user typed a name instead of selecting _id)
          const found = items.find(i => i.name === row.item);
          if (!found) {
            // Add new item with default unit/category if missing
            const newItem = await api.post('/items', {
              name: row.item,
              unit: 'pcs', // default unit
              category: 'General', // default category
              average_price: Number(row.price) || 0
            });
            // Update the row's item to the new _id
            row.item = newItem.data._id;
          } else {
            row.item = found._id;
          }
        }
      }
      // Refresh items list after adding new items
      await fetchItems();
      // 2. Prepare payload for purchase
      const itemsPayload = rows.map(r => ({
        item: r.item,
        quantity: Number(r.quantity),
        price: Number(r.price)
      }));
      if (editId) {
        // Implement update purchase
        await api.put(`/purchases/${editId}`,
          {
            items: itemsPayload,
            supplier,
            invoice_number: invoiceNumber
          }
        );
      } else {
        await api.post('/purchases', {
          items: itemsPayload,
          supplier,
          invoice_number: invoiceNumber
        });
      }
      setSuccess('Purchase invoice saved');
      fetchPurchases();
        setTimeout(async () => {
          await fetchInventory();
          window.dispatchEvent(new Event('inventoryChanged'));
        }, 200);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/purchases/${id}`);
      setSuccess('Invoice deleted successfully');
      fetchPurchases();
        setTimeout(async () => {
          await fetchInventory();
          window.dispatchEvent(new Event('inventoryChanged'));
        }, 200);
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  // Helper: get item name by id
  const getItemName = (id) => items.find(i => i._id === id)?.name || '';
  // Helper: get warehouse/store stock for item
  const getWarehouseQty = (id) => warehouseStock.find(w => w.item?._id === id)?.quantity ?? 0;
  const getStoreQty = (id) => storeStock.find(s => s.item?._id === id)?.remaining_quantity ?? 0;

  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Purchases
      </Typography>
      <Button variant="contained" color="primary" onClick={handleOpen} disabled={!items || items.length === 0} sx={{ fontWeight: 700, px: 3, borderRadius: 2, mb: 2 }}>Add Purchase</Button>
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 520, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
        <Table sx={{ minWidth: 900, '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9fafd' }, '& tbody tr:hover': { backgroundColor: '#e3eafc' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>Item</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Quantity</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Price</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Total</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Supplier</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Invoice #</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Date</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(Array.isArray(purchases) ? purchases : []).map(p => (
              <React.Fragment key={p._id}>
                {(Array.isArray(p.items) ? p.items : []).map((item, idx) => (
                  <TableRow key={p._id + '-' + idx} sx={{ transition: 'background 0.2s' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{item.item?.name || getItemName(item.item?._id || item.item)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>{(item.quantity * item.price).toFixed(2)}</TableCell>
                    {idx === 0 && (
                      <>
                        <TableCell rowSpan={p.items?.length || 1}>{p.supplier}</TableCell>
                        <TableCell rowSpan={p.items?.length || 1}>{p.invoice_number}</TableCell>
                        <TableCell rowSpan={p.items?.length || 1}>{new Date(p.date).toLocaleDateString()}</TableCell>
                        <TableCell rowSpan={p.items?.length || 1}>
                          <IconButton onClick={() => handleOpen(p)}><EditIcon /></IconButton>
                          <IconButton onClick={() => handleDelete(p._id)}><DeleteIcon /></IconButton>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {/* Invoice total row */}
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ background: '#f0f4fa', fontWeight: 700 }}>Invoice Total</TableCell>
                  <TableCell colSpan={5} align="left" sx={{ background: '#f0f4fa', fontWeight: 700 }}>
                    {(Array.isArray(p.items) ? p.items : []).reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Purchase Invoice</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label="Supplier" value={supplier} onChange={e => setSupplier(e.target.value)} fullWidth required />
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
                  <TableCell>Warehouse Stock</TableCell>
                  <TableCell>Store Stock</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField select value={row.item} onChange={e => handleRowChange(idx, 'item', e.target.value)} fullWidth required>
                        {(items || []).map(i => <MenuItem key={i._id} value={i._id}>{i.name}</MenuItem>)}
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
                      {row.item ? getWarehouseQty(row.item) : ''}
                    </TableCell>
                    <TableCell>
                      {row.item ? getStoreQty(row.item) : ''}
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => handleRemoveRow(idx)} color="error" disabled={rows.length === 1}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Invoice total row */}
                <TableRow>
                  <TableCell colSpan={3} align="right"><b>Invoice Total</b></TableCell>
                  <TableCell colSpan={4} align="left">
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
