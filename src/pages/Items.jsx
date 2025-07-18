import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useInventory } from '../context/InventoryContext';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';

export default function Items() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', unit: '', category: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const { warehouse, store, fetchInventory } = useInventory();

  const fetchItems = () => api.get('/items').then(r => setItems(r.data));
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
  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Items Management</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Item</Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 300, minWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>Name</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Avg Price</TableCell>
              <TableCell>Store Inventory</TableCell>
              <TableCell>Warehouse Inventory</TableCell>
              <TableCell>Total Inventory</TableCell>
              <TableCell>Total Value</TableCell>
              <TableCell>Sale Count</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(item => {
              const warehouseQty = getWarehouseQty(item._id);
              const storeQty = getStoreQty(item._id);
              const totalQty = warehouseQty + storeQty;
              const avgPrice = item.average_price || 0;
              const totalValue = totalQty * avgPrice;
              return (
                <TableRow key={item._id}>
                  <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 300, minWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{avgPrice.toFixed(2)}</TableCell>
                  <TableCell>{storeQty}</TableCell>
                  <TableCell>{warehouseQty}</TableCell>
                  <TableCell>{totalQty}</TableCell>
                  <TableCell>{totalValue.toFixed(2)}</TableCell>
                  <TableCell>{item.last_sale_date ? new Date(item.last_sale_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{item.sale_count}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleOpen(item)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(item._id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
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
