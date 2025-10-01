import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useInventory } from '../context/InventoryContext';
import { hasPerm } from '../utils/permissions';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';

export default function Items() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
      
      // Refresh items to auto-update category list
      await fetchItems();
      fetchInventory();
      
      // Clear category filter if the new/edited item doesn't match current filter
      if (categoryFilter && form.category !== categoryFilter) {
        setCategoryFilter('');
      }
      
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
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  // Helper functions to get stock for each item
  const getWarehouseQty = (itemId) => warehouse.find(w => w.item?._id === itemId)?.quantity ?? 0;
  const getStoreQty = (itemId) => store.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;
  const getStore2Qty = (itemId) => store2.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;
  // Get unique categories for filter dropdown - Auto-updates when new categories are added
  const uniqueCategories = React.useMemo(() => {
    return [...new Set(items.map(item => item.category?.trim()).filter(Boolean))].sort();
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         item.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 1 }}>
        Items Management
      </Typography>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ 
          background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)', 
          px: 3, 
          py: 1.5, 
          borderRadius: 3, 
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
            📊 Showing <Box component="span" sx={{ color: '#1976d2', fontWeight: 700 }}>{filteredItems.length}</Box> of <Box component="span" sx={{ color: '#64748b' }}>{items.length}</Box> items
          </Typography>
        </Box>
        {categoryFilter && (
          <Chip 
            label={`📂 ${categoryFilter.toLowerCase()}`}
            onDelete={() => setCategoryFilter('')}
            sx={{
              background: 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
              color: '#1e40af',
              fontWeight: 600,
              borderRadius: 3,
              px: 1,
              '& .MuiChip-deleteIcon': {
                color: '#3b82f6',
                '&:hover': {
                  color: '#1e40af'
                }
              }
            }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {hasPerm('items','edit') && (
          <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}>Add Item</Button>
        )}
        <TextField
          label="Search Items"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 320, background: '#fff', borderRadius: 2 }}
        />
        <FormControl size="small" sx={{ minWidth: 250, background: 'linear-gradient(145deg, #ffffff, #f8fafc)', borderRadius: 3, boxShadow: '0 2px 12px rgba(25,118,210,0.08)', border: '1px solid #e2e8f0' }}>
          <InputLabel sx={{ color: '#64748b', fontWeight: 600, '&.Mui-focused': { color: '#1976d2' } }}>Filter by Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Filter by Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ 
              borderRadius: 3, 
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiSelect-select': { fontWeight: 500 },
              '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid #1976d2' }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0',
                  mt: 1,
                  maxHeight: 400,
                  '& .MuiMenuItem-root': {
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    minHeight: 48,
                    '&:hover': {
                      background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)',
                      transform: 'translateX(4px)',
                      transition: 'all 0.2s ease'
                    },
                    '&.Mui-selected': {
                      background: 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
                      color: '#1e40af',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(145deg, #dbeafe, #bfdbfe)'
                      }
                    }
                  }
                }
              }
            }}
          >
            <MenuItem value="" sx={{ borderBottom: '1px solid #e2e8f0', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 2, 
                  background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  🗂️
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>All Categories</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Show all {items.length} items</Typography>
                </Box>
              </Box>
            </MenuItem>
            {uniqueCategories.map((category) => {
              const categoryCount = items.filter(item => item.category === category).length;
              // Smart icon detection - automatically assigns icons for new categories
              const getCategoryIcon = (categoryName) => {
                const name = categoryName.toUpperCase();
                
                // Exact matches first
                const exactMatches = {
                  'IPADS': '📱', 'IPAD': '📱', 'TABLET': '📱',
                  'LAPTOP': '💻', 'LAPT': '💻', 'NOTEBOOK': '💻',
                  'MAC': '�️', 'MACBOOK': '�💻', 'IMAC': '🖥️',
                  'SURF': '💻', 'SURFACE': '�',
                  'BOOK': '📚', 'CHROMEBOOK': '💻',
                  'CABLE': '🔌', 'CBL': '🔌', 'WIRE': '�',
                  'CHRG': '⚡', 'CHARGING': '⚡', 'CHARGER': '⚡',
                  'ADAPTER': '🔌', 'ADP': '🔌', 'AD': '�',
                  'MOUSE': '🖱️', 'MICE': '�️',
                  'KEYBOARD': '⌨️', 'KB': '⌨️',
                  'MONITOR': '🖥️', 'SCREEN': '🖥️', 'DISPLAY': '🖥️',
                  'REPAIR': '🔧', 'REPAIRING': '🔧', 'SERVICE': '🔧',
                  'PARTS': '⚙️', 'COMPONENT': '🔩', 'SPARE': '⚙️'
                };
                
                if (exactMatches[name]) return exactMatches[name];
                
                // Pattern matching for new categories
                if (name.includes('PHONE') || name.includes('MOBILE')) return '�';
                if (name.includes('COMPUTER') || name.includes('PC')) return '�';
                if (name.includes('POWER') || name.includes('BATTERY')) return '�';
                if (name.includes('AUDIO') || name.includes('SOUND') || name.includes('SPEAKER')) return '�';
                if (name.includes('VIDEO') || name.includes('CAMERA')) return '📹';
                if (name.includes('STORAGE') || name.includes('DRIVE') || name.includes('HDD') || name.includes('SSD')) return '💾';
                if (name.includes('MEMORY') || name.includes('RAM')) return '🧠';
                if (name.includes('NETWORK') || name.includes('WIFI') || name.includes('ETHERNET')) return '🌐';
                if (name.includes('PRINTER') || name.includes('PRINT')) return '�️';
                if (name.includes('ACCESSORY') || name.includes('ACCESSORIES')) return '🎯';
                if (name.includes('TOOL') || name.includes('EQUIPMENT')) return '🔧';
                if (name.includes('SOFTWARE') || name.includes('LICENSE')) return '💿';
                if (name.includes('CASE') || name.includes('COVER') || name.includes('SLEEVE')) return '💼';
                
                // Default for unknown categories
                return '�';
              };
              
              const categoryIcon = getCategoryIcon(category);
              
              return (
                <MenuItem key={category} value={category}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 2, 
                      background: `linear-gradient(145deg, ${categoryFilter === category ? '#dbeafe' : '#f1f5f9'}, ${categoryFilter === category ? '#bfdbfe' : '#e2e8f0'})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>
                      {categoryIcon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>
                        {category.toLowerCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {categoryCount} {categoryCount === 1 ? 'item' : 'items'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={categoryCount}
                      size="small"
                      sx={{ 
                        background: categoryFilter === category ? '#1e40af' : '#64748b',
                        color: 'white',
                        fontWeight: 600,
                        minWidth: 28,
                        height: 24,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        {categoryFilter && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCategoryFilter('')}
            sx={{ 
              borderRadius: 3, 
              fontWeight: 600,
              textTransform: 'none',
              px: 2,
              py: 1,
              background: 'linear-gradient(145deg, #fef2f2, #fee2e2)',
              borderColor: '#fca5a5',
              color: '#dc2626',
              '&:hover': {
                background: 'linear-gradient(145deg, #fee2e2, #fecaca)',
                borderColor: '#f87171',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            ✕ Clear Filter
          </Button>
        )}
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
                    {hasPerm('items','edit') && (
                      <Button size="small" variant="outlined" sx={{ mr: 1, fontWeight: 600, borderRadius: 2 }} onClick={() => handleOpen(item)}>Edit</Button>
                    )}
                    {hasPerm('items','delete') && (
                      <Button size="small" variant="contained" color="error" sx={{ fontWeight: 600, borderRadius: 2 }} onClick={() => handleDelete(item._id)}>Delete</Button>
                    )}
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
          {hasPerm('items','edit') && (
            <Button onClick={handleSubmit} variant="contained">{editId ? 'Update' : 'Add'}</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
