import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useInventory } from '../context/InventoryContext';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from '@mui/material';

export default function Items() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', unit: '', category: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { warehouse, store, store2, fetchInventory } = useInventory();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const r = await api.get('/items');
      setItems(Array.isArray(r.data) ? r.data : (r.data?.data || []));
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchItems(); fetchInventory(); }, [fetchInventory]);

  const handleOpen = (item) => {
    if (item) {
      setForm({ name: item.name, unit: item.unit, category: item.category });
      setEditId(item._id);
    } else {
      setForm({ name: '', unit: '', category: '' });
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
        await api.put(`/items/${editId}`, form);
        setSuccess('Item updated');
      } else {
        await api.post('/items', form);
        setSuccess('Item added');
      }
      fetchItems();
      fetchInventory();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      setError('Delete failed');
    }
  };

  // Helper functions to get stock for each item
  const getWarehouseQty = (itemId) => warehouse.find(w => w.item?._id === itemId)?.quantity ?? 0;
  const getStoreQty = (itemId) => store.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;
  const getStore2Qty = (itemId) => store2.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Items Management
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}>Add Item</Button>
        <TextField
          label="Search Items"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 320, background: '#fff', borderRadius: 2 }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 520, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
  <Table sx={{ minWidth: 900, '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9fafd' }, '& tbody tr:hover': { backgroundColor: '#e3eafc' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, whiteSpace: 'nowrap', maxWidth: 300, minWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>Name</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Unit</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Category</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Avg Price</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Store Inventory</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Store2 Inventory</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Warehouse Inventory</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Total Inventory</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Total Value</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Sale Count</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                    <span>Loading items...</span>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center">No items found</TableCell>
              </TableRow>
            )}
            {!loading && filteredItems.map(item => {
              const warehouseQty = getWarehouseQty(item._id);
              const storeQty = getStoreQty(item._id);
              const store2Qty = getStore2Qty(item._id);
              const totalQty = warehouseQty + storeQty + store2Qty;
              const avgPrice = item.average_price || 0;
              const totalValue = totalQty * avgPrice;
              return (
                <TableRow key={item._id} sx={{ transition: 'background 0.2s' }}>
                  <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 300, minWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{item.name}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{avgPrice.toFixed(2)}</TableCell>
                  <TableCell>{storeQty}</TableCell>
                  <TableCell>{store2Qty}</TableCell>
                  <TableCell>{warehouseQty}</TableCell>
                  <TableCell>{totalQty}</TableCell>
                  <TableCell>{totalValue.toFixed(2)}</TableCell>
                  <TableCell>{item.sale_count}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" sx={{ mr: 1, fontWeight: 600, borderRadius: 2 }} onClick={() => handleOpen(item)}>Edit</Button>
                    <Button size="small" variant="contained" color="error" sx={{ fontWeight: 600, borderRadius: 2 }} onClick={() => handleDelete(item._id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {/* Summary Row */}
          <tfoot>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, background: '#f0f4fa', color: 'primary.main' }}>Total</TableCell>
              <TableCell sx={{ background: '#f0f4fa' }} />
              <TableCell sx={{ background: '#f0f4fa' }} />
              <TableCell sx={{ background: '#f0f4fa' }} />
              {/* Store Inventory Total */}
              <TableCell sx={{ fontWeight: 900, background: '#f0f4fa', color: 'primary.main' }}>
                {filteredItems.reduce((sum, item) => sum + getStoreQty(item._id), 0)}
              </TableCell>
              {/* Store2 Inventory Total */}
              <TableCell sx={{ fontWeight: 900, background: '#f0f4fa', color: 'primary.main' }}>
                {filteredItems.reduce((sum, item) => sum + getStore2Qty(item._id), 0)}
              </TableCell>
              {/* Warehouse Inventory Total */}
              <TableCell sx={{ fontWeight: 900, background: '#f0f4fa', color: 'primary.main' }}>
                {filteredItems.reduce((sum, item) => sum + getWarehouseQty(item._id), 0)}
              </TableCell>
              {/* Total Inventory */}
              <TableCell sx={{ fontWeight: 900, background: '#f0f4fa', color: 'primary.main' }}>
                {filteredItems.reduce((sum, item) => {
                  const totalQty = getWarehouseQty(item._id) + getStoreQty(item._id) + getStore2Qty(item._id);
                  return sum + totalQty;
                }, 0)}
              </TableCell>
              {/* Total Value */}
              <TableCell sx={{ fontWeight: 900, background: '#f0f4fa', color: 'primary.main' }}>
                {filteredItems.reduce((sum, item) => {
                  const totalQty = getWarehouseQty(item._id) + getStoreQty(item._id) + getStore2Qty(item._id);
                  const avgPrice = item.average_price || 0;
                  return sum + totalQty * avgPrice;
                }, 0).toFixed(2)}
              </TableCell>
              <TableCell sx={{ background: '#f0f4fa' }} />
              <TableCell sx={{ background: '#f0f4fa' }} />
            </TableRow>
          </tfoot>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField margin="dense" label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Unit" name="unit" value={form.unit} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Category" name="category" value={form.category} onChange={handleChange} fullWidth required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
