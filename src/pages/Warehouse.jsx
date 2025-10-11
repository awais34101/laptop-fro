import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, TextField, CircularProgress, Alert, Grid, Card, CardContent, Chip, InputAdornment,
  IconButton, Tooltip, LinearProgress, alpha, TableSortLabel, Button, Menu, MenuItem,
  FormControl, InputLabel, Select, Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  Inventory2 as InventoryIcon,
  TrendingDown as LowStockIcon,
  CheckCircle as InStockIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

export default function Warehouse() {
  const [stock, setStock] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [filterMenu, setFilterMenu] = useState(null);
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out, in-stock
  const [selectedItem, setSelectedItem] = useState(''); // for specific item filter

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/warehouse');
      setStock(Array.isArray(r.data) ? r.data : (r.data?.data || []));
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load warehouse inventory');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalItems: stock.length,
    inStock: stock.filter(s => s.quantity > 50).length,
    lowStock: stock.filter(s => s.quantity > 0 && s.quantity <= 50).length,
    outOfStock: stock.filter(s => s.quantity === 0).length,
    totalQuantity: stock.reduce((sum, s) => sum + s.quantity, 0)
  };

  // Get stock status
  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'error', icon: <WarningIcon /> };
    if (quantity <= 50) return { label: 'Low Stock', color: 'warning', icon: <LowStockIcon /> };
    return { label: 'In Stock', color: 'success', icon: <InStockIcon /> };
  };

  // Filter and sort stock
  const filteredStock = stock
    .filter(s => {
      const matchesSearch = s.item?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = 
        stockFilter === 'all' ? true :
        stockFilter === 'low' ? (s.quantity > 0 && s.quantity <= 50) :
        stockFilter === 'out' ? s.quantity === 0 :
        stockFilter === 'in-stock' ? s.quantity > 50 : true;
      const matchesSelectedItem = selectedItem ? s.item?.name === selectedItem : true;
      return matchesSearch && matchesFilter && matchesSelectedItem;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (orderBy === 'name') {
        aVal = a.item?.name || '';
        bVal = b.item?.name || '';
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else if (orderBy === 'quantity') {
        aVal = a.quantity;
        bVal = b.quantity;
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleExportCSV = () => {
    const headers = ['Item Name', 'Quantity', 'Status'];
    const rows = filteredStock.map(s => [
      s.item?.name || '',
      s.quantity,
      getStockStatus(s.quantity).label
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Get unique item names for dropdown
  const uniqueItems = [...new Set(stock.map(s => s.item?.name).filter(Boolean))].sort();

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              <InventoryIcon sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748', letterSpacing: 0.5 }}>
                Warehouse Stock
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                Real-time inventory management
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Inventory">
              <IconButton 
                onClick={loadInventory}
                disabled={loading}
                sx={{ 
                  background: '#fff', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': { background: '#f7fafc', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to CSV">
              <IconButton 
                onClick={handleExportCSV}
                sx={{ 
                  background: '#fff', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': { background: '#f7fafc', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
            }}>
              <CardContent>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Total Items</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.totalItems}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {stats.totalQuantity.toLocaleString()} total units
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(56, 239, 125, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InStockIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>In Stock</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.inStock}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {stats.totalItems > 0 ? Math.round((stats.inStock / stats.totalItems) * 100) : 0}% of items
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(245, 87, 108, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LowStockIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Low Stock</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.lowStock}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Needs attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(250, 112, 154, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Out of Stock</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.outOfStock}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Requires restocking
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            <TextField
              placeholder="Search inventory by item name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              sx={{ 
                flexGrow: 1, 
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
            <Autocomplete
              options={uniqueItems}
              value={selectedItem}
              onChange={(event, newValue) => setSelectedItem(newValue || '')}
              size="small"
              sx={{ minWidth: 250 }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Filter by Item" 
                  placeholder="Select specific item..."
                />
              )}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1, fontWeight: 600 }}>
              Status:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label="All" 
                onClick={() => setStockFilter('all')}
                color={stockFilter === 'all' ? 'primary' : 'default'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
              <Chip 
                label={`In Stock (${stats.inStock})`}
                icon={<InStockIcon />}
                onClick={() => setStockFilter('in-stock')}
                color={stockFilter === 'in-stock' ? 'success' : 'default'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
              <Chip 
                label={`Low (${stats.lowStock})`}
                icon={<LowStockIcon />}
                onClick={() => setStockFilter('low')}
                color={stockFilter === 'low' ? 'warning' : 'default'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
              <Chip 
                label={`Out (${stats.outOfStock})`}
                icon={<WarningIcon />}
                onClick={() => setStockFilter('out')}
                color={stockFilter === 'out' ? 'error' : 'default'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Loading Bar */}
        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* Inventory Table */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleSort('name')}
                      sx={{ 
                        color: '#fff !important',
                        '&.MuiTableSortLabel-root': { color: '#fff' },
                        '&.Mui-active': { color: '#fff' },
                        '& .MuiTableSortLabel-icon': { color: '#fff !important' }
                      }}
                    >
                      Item Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    <TableSortLabel
                      active={orderBy === 'quantity'}
                      direction={orderBy === 'quantity' ? order : 'asc'}
                      onClick={() => handleSort('quantity')}
                      sx={{ 
                        color: '#fff !important',
                        '&.MuiTableSortLabel-root': { color: '#fff' },
                        '&.Mui-active': { color: '#fff' },
                        '& .MuiTableSortLabel-icon': { color: '#fff !important' }
                      }}
                    >
                      Quantity
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    Stock Level
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && filteredStock.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <InventoryIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No items found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {search ? 'Try adjusting your search' : 'Inventory is empty'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredStock.map((s, index) => {
                  const status = getStockStatus(s.quantity);
                  const maxQuantity = Math.max(...stock.map(item => item.quantity), 100);
                  const stockPercentage = (s.quantity / maxQuantity) * 100;
                  
                  return (
                    <TableRow 
                      key={s._id} 
                      sx={{ 
                        '&:nth-of-type(odd)': { backgroundColor: alpha('#667eea', 0.02) },
                        '&:hover': { 
                          backgroundColor: alpha('#667eea', 0.08),
                          transform: 'scale(1.001)',
                          transition: 'all 0.2s'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {s.item?.name || 'Unknown Item'}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {s.quantity.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(stockPercentage, 100)}
                              sx={{ 
                                height: 8, 
                                borderRadius: 1,
                                backgroundColor: alpha(status.color === 'error' ? '#d32f2f' : status.color === 'warning' ? '#ed6c02' : '#2e7d32', 0.1),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: status.color === 'error' ? '#d32f2f' : status.color === 'warning' ? '#ed6c02' : '#2e7d32',
                                  borderRadius: 1
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
                            {Math.round(stockPercentage)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          icon={status.icon}
                          label={status.label}
                          color={status.color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Results Summary */}
        {!loading && filteredStock.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Showing {filteredStock.length} of {stock.length} items
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
