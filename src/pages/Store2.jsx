import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, TextField, CircularProgress, Alert, Grid, Card, CardContent, Chip, InputAdornment,
  IconButton, Tooltip, LinearProgress, alpha, TableSortLabel, Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Store as StoreIcon,
  Storefront as StorefrontIcon,
  TrendingDown as SlowMovingIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as InStockIcon,
  Inventory as InventoryIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

export default function Store2() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [slowMoving, setSlowMoving] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out, slow

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const [inv, alerts] = await Promise.all([
        api.get('/store2'),
        api.get('/alerts/slow-moving')
      ]);
      setInventory(Array.isArray(inv.data) ? inv.data : (inv.data?.data || []));
      setSlowMoving(alerts.data.store2 || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load store2 inventory');
    } finally {
      setLoading(false);
    }
  };

  // Get slow moving item ids for highlighting
  const slowIds = new Set(slowMoving.map(s => s.item?._id));

  // Calculate statistics
  const stats = {
    totalItems: inventory.length,
    inStock: inventory.filter(s => s.remaining_quantity > 20).length,
    lowStock: inventory.filter(s => s.remaining_quantity > 0 && s.remaining_quantity <= 20).length,
    outOfStock: inventory.filter(s => s.remaining_quantity === 0).length,
    slowMoving: slowMoving.length,
    totalQuantity: inventory.reduce((sum, s) => sum + s.remaining_quantity, 0)
  };

  // Get stock status
  const getStockStatus = (quantity, itemId) => {
    if (slowIds.has(itemId)) return { label: 'Slow Moving', color: 'warning', icon: <SlowMovingIcon /> };
    if (quantity === 0) return { label: 'Out of Stock', color: 'error', icon: <WarningIcon /> };
    if (quantity <= 20) return { label: 'Low Stock', color: 'warning', icon: <WarningIcon /> };
    return { label: 'In Stock', color: 'success', icon: <InStockIcon /> };
  };

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter(s => {
      const matchesSearch = s.item?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = 
        stockFilter === 'all' ? true :
        stockFilter === 'low' ? (s.remaining_quantity > 0 && s.remaining_quantity <= 20) :
        stockFilter === 'out' ? s.remaining_quantity === 0 :
        stockFilter === 'slow' ? slowIds.has(s.item?._id) : true;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Always show slow moving items first
      const aIsSlow = slowIds.has(a.item?._id);
      const bIsSlow = slowIds.has(b.item?._id);
      if (aIsSlow && !bIsSlow) return -1;
      if (!aIsSlow && bIsSlow) return 1;

      // Then sort by selected column
      let aVal, bVal;
      if (orderBy === 'name') {
        aVal = a.item?.name || '';
        bVal = b.item?.name || '';
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else if (orderBy === 'quantity') {
        aVal = a.remaining_quantity;
        bVal = b.remaining_quantity;
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
              boxShadow: '0 4px 12px rgba(6, 190, 182, 0.3)'
            }}>
              <StorefrontIcon sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748', letterSpacing: 0.5 }}>
                Store 2 Inventory
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                Real-time stock management and alerts
              </Typography>
            </Box>
          </Box>
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
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(6, 190, 182, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InventoryIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Items</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.totalItems}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {stats.totalQuantity.toLocaleString()} units
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
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
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(250, 139, 255, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Low Stock</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.lowStock}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Needs attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
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
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(255, 154, 86, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SlowMovingIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Slow Moving</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.slowMoving}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Action required
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
            <Box sx={{ display: 'flex', gap: 1 }}>
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
                icon={<WarningIcon />}
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
              <Badge badgeContent={stats.slowMoving} color="warning">
                <Chip 
                  label="Slow Moving"
                  icon={<SlowMovingIcon />}
                  onClick={() => setStockFilter('slow')}
                  color={stockFilter === 'slow' ? 'warning' : 'default'}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              </Badge>
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
                      background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
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
                      background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
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
                      Remaining Quantity
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
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
                      background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
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
                {!loading && filteredInventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <StoreIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No items found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {search ? 'Try adjusting your search' : 'Inventory is empty'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredInventory.map((s) => {
                  const status = getStockStatus(s.remaining_quantity, s.item?._id);
                  const maxQuantity = Math.max(...inventory.map(item => item.remaining_quantity), 100);
                  const stockPercentage = (s.remaining_quantity / maxQuantity) * 100;
                  const isSlow = slowIds.has(s.item?._id);
                  
                  return (
                    <TableRow 
                      key={s._id} 
                      sx={{ 
                        backgroundColor: isSlow ? alpha('#ff9800', 0.08) : 'inherit',
                        '&:nth-of-type(odd)': { 
                          backgroundColor: isSlow ? alpha('#ff9800', 0.12) : alpha('#06beb6', 0.02) 
                        },
                        '&:hover': { 
                          backgroundColor: isSlow ? alpha('#ff9800', 0.15) : alpha('#06beb6', 0.08),
                          transform: 'scale(1.001)',
                          transition: 'all 0.2s'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: isSlow ? 700 : 600, fontSize: '0.95rem' }}>
                        {isSlow && (
                          <Chip 
                            icon={<SpeedIcon />}
                            label="SLOW" 
                            size="small" 
                            color="warning" 
                            sx={{ mr: 1, fontWeight: 700 }} 
                          />
                        )}
                        {s.item?.name || 'Unknown Item'}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {s.remaining_quantity.toLocaleString()}
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
                                backgroundColor: alpha(
                                  isSlow ? '#ff9800' : 
                                  status.color === 'error' ? '#d32f2f' : 
                                  status.color === 'warning' ? '#ed6c02' : '#2e7d32', 0.1
                                ),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 
                                    isSlow ? '#ff9800' : 
                                    status.color === 'error' ? '#d32f2f' : 
                                    status.color === 'warning' ? '#ed6c02' : '#2e7d32',
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
        {!loading && filteredInventory.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Showing {filteredInventory.length} of {inventory.length} items
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
