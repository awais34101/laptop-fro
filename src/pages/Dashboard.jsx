
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { fetchSalesTotalByDate, fetchStore2SalesTotalByDate } from '../services/dashboardSalesApi';
import { listExpenses } from '../services/expensesApi';
import { 
  TextField, Button, Box, Typography, Grid, Paper, Alert, Card, CardContent,
  Avatar, Chip, IconButton, Divider, Stack, LinearProgress, Fade, Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
  ShoppingCart as ShoppingCartIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';


export default function Dashboard() {
  const [slowMoving, setSlowMoving] = useState({ store: [], store2: [] });
  const [lowStock, setLowStock] = useState({ warehouse: [], store: [], store2: [] });
  const [totalSales, setTotalSales] = useState(0);
  const [store2Sales, setStore2Sales] = useState(0);
  const [storeExpenses, setStoreExpenses] = useState(0);
  const [store2Expenses, setStore2Expenses] = useState(0);
  const [salesFrom, setSalesFrom] = useState('');
  const [salesTo, setSalesTo] = useState('');
  const [store2From, setStore2From] = useState('');
  const [store2To, setStore2To] = useState('');
  const [expFrom, setExpFrom] = useState('');
  const [expTo, setExpTo] = useState('');
  // ...existing code...
  const { warehouse, store, store2, items, fetchInventory, loading } = useInventory();

  useEffect(() => {
    // Handle API calls with graceful error handling for permission issues
    api.get('/alerts/slow-moving')
      .then(r => setSlowMoving({ store: r.data.store || [], store2: r.data.store2 || [] }))
      .catch(e => {
        if (e.response?.status === 403) {
          console.log('User does not have permission to view slow moving alerts');
          setSlowMoving({ store: [], store2: [] });
        }
      });
    
    api.get('/alerts/low-stock')
      .then(r => setLowStock(r.data))
      .catch(e => {
        if (e.response?.status === 403) {
          console.log('User does not have permission to view low stock alerts');
          setLowStock({ warehouse: [], store: [], store2: [] });
        }
      });
    
    fetchSalesTotal();
    fetchStore2SalesTotal();
    fetchExpensesTotals();
    
    // Technician stats moved to Technicians page
    // Listen for inventoryChanged event to refresh inventory
    const handler = () => {
      fetchInventory();
      api.get('/alerts/low-stock')
        .then(r => setLowStock(r.data))
        .catch(e => {
          if (e.response?.status === 403) {
            console.log('User does not have permission to view low stock alerts');
          }
        });
    };
    window.addEventListener('inventoryChanged', handler);
    return () => window.removeEventListener('inventoryChanged', handler);
  }, [fetchInventory]);


  const fetchSalesTotal = async (from = '', to = '') => {
    try {
      const total = await fetchSalesTotalByDate(from, to);
      setTotalSales(total);
    } catch (e) {
      if (e.response?.status === 403) {
        console.log('User does not have permission to view sales data');
        setTotalSales(0);
      }
    }
  };

  const fetchStore2SalesTotal = async (from = '', to = '') => {
    try {
      const total = await fetchStore2SalesTotalByDate(from, to);
      setStore2Sales(total);
    } catch (e) {
      if (e.response?.status === 403) {
        console.log('User does not have permission to view sales data');
        setStore2Sales(0);
      }
    }
  };

  const handleSalesFilter = () => {
    fetchSalesTotal(salesFrom, salesTo);
  };

  const handleStore2SalesFilter = () => {
    fetchStore2SalesTotal(store2From, store2To);
  };

  const fetchExpensesTotals = async (from = '', to = '') => {
    try {
      const [s, s2] = await Promise.all([
        listExpenses({ store: 'store', from, to, page: 1, limit: 1000 }).then(r => r.data || []).catch(() => []),
        listExpenses({ store: 'store2', from, to, page: 1, limit: 1000 }).then(r => r.data || []).catch(() => []),
      ]);
      const sum = (arr) => arr.reduce((t, doc) => t + (doc.items||[]).reduce((s,i)=> s + Number(i.amount||0), 0), 0);
      setStoreExpenses(sum(s));
      setStore2Expenses(sum(s2));
    } catch {
      setStoreExpenses(0);
      setStore2Expenses(0);
    }
  };

  const handleExpensesFilter = () => {
    fetchExpensesTotals(expFrom, expTo);
  };

  // ...existing code...

  // Calculate total value of available stock (warehouse + store + store2)
  let totalStockValue = 0, warehouseValue = 0, storeValue = 0, store2Value = 0;
  if (!loading && items.length > 0) {
    totalStockValue = items.reduce((sum, item) => {
      const warehouseQty = warehouse.find(w => w.item?._id === item._id)?.quantity ?? 0;
      const storeQty = store.find(s => s.item?._id === item._id)?.remaining_quantity ?? 0;
      const store2Qty = store2.find(s => s.item?._id === item._id)?.remaining_quantity ?? 0;
      const totalQty = warehouseQty + storeQty + store2Qty;
      const avgPrice = item.average_price || 0;
      const totalValue = totalQty * avgPrice;
      warehouseValue += warehouseQty * avgPrice;
      storeValue += storeQty * avgPrice;
      store2Value += store2Qty * avgPrice;
      return sum + totalValue;
    }, 0);
  }

  return (
    <Box sx={{ minHeight: '100vh', p: 0 }}>
      {/* Hero Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, rgba(102,126,234,0.95) 0%, rgba(118,75,162,0.95) 100%)',
        color: 'white',
        py: 2,
        px: 3,
        mb: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.2)' }}>
                <TrendingUpIcon sx={{ fontSize: 24 }} />
              </Avatar>
              Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
              📊 Business Overview & Analytics
            </Typography>
          </Box>
          <Chip 
            label={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            icon={<CalendarIcon />}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 700,
              fontSize: '0.875rem',
              py: 2.5,
              px: 1
            }}
          />
        </Stack>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        <Grid container spacing={3}>
          {/* Store Sales Card */}
          <Grid item xs={12} md={4}>
            <Fade in timeout={500}>
              <Card 
                elevation={8} 
                sx={{ 
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(33,150,243,0.3)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                        <StoreIcon />
                      </Avatar>
                      Store Sales
                    </Typography>
                    <Chip label="Store 1" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                  </Stack>

                  <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1}>
                        <TextField 
                          type="date" 
                          size="small" 
                          label="From" 
                          InputLabelProps={{ shrink: true, style: { color: 'white' } }}
                          value={salesFrom} 
                          onChange={e => setSalesFrom(e.target.value)} 
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' }
                            }
                          }} 
                        />
                        <TextField 
                          type="date" 
                          size="small" 
                          label="To" 
                          InputLabelProps={{ shrink: true, style: { color: 'white' } }}
                          value={salesTo} 
                          onChange={e => setSalesTo(e.target.value)} 
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' }
                            }
                          }} 
                        />
                      </Stack>
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={handleSalesFilter} 
                        startIcon={<FilterIcon />}
                        sx={{ 
                          bgcolor: '#1565C0',
                          color: 'white',
                          fontWeight: 700,
                          '&:hover': { bgcolor: '#0D47A1' }
                        }}
                      >
                        Filter
                      </Button>
                    </Stack>
                  </Paper>

                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
                      AED {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Chip 
                      icon={<TrendingUpIcon />}
                      label="Total Sales" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Store2 Sales Card */}
          <Grid item xs={12} md={4}>
            <Fade in timeout={700}>
              <Card 
                elevation={8} 
                sx={{ 
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(76,175,80,0.3)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                        <StoreIcon />
                      </Avatar>
                      Store2 Sales
                    </Typography>
                    <Chip label="Store 2" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                  </Stack>

                  <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1}>
                        <TextField 
                          type="date" 
                          size="small" 
                          label="From" 
                          InputLabelProps={{ shrink: true, style: { color: 'white' } }}
                          value={store2From} 
                          onChange={e => setStore2From(e.target.value)} 
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' }
                            }
                          }} 
                        />
                        <TextField 
                          type="date" 
                          size="small" 
                          label="To" 
                          InputLabelProps={{ shrink: true, style: { color: 'white' } }}
                          value={store2To} 
                          onChange={e => setStore2To(e.target.value)} 
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' }
                            }
                          }} 
                        />
                      </Stack>
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={handleStore2SalesFilter} 
                        startIcon={<FilterIcon />}
                        sx={{ 
                          bgcolor: '#2E7D32',
                          color: 'white',
                          fontWeight: 700,
                          '&:hover': { bgcolor: '#1B5E20' }
                        }}
                      >
                        Filter
                      </Button>
                    </Stack>
                  </Paper>

                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
                      AED {store2Sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Chip 
                      icon={<TrendingUpIcon />}
                      label="Total Sales" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Expenses Card */}
          <Grid item xs={12} md={4}>
            <Fade in timeout={900}>
              <Card 
                elevation={8} 
                sx={{ 
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(255,152,0,0.3)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                        <MoneyIcon />
                      </Avatar>
                      Expenses
                    </Typography>
                    <Chip label="Both Stores" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                  </Stack>

                  <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1}>
                        <TextField 
                          type="date" 
                          size="small" 
                          label="From" 
                          InputLabelProps={{ shrink: true, style: { color: 'white' } }}
                          value={expFrom} 
                          onChange={e => setExpFrom(e.target.value)} 
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' }
                            }
                          }} 
                        />
                        <TextField 
                          type="date" 
                          size="small" 
                          label="To" 
                          InputLabelProps={{ shrink: true, style: { color: 'white' } }}
                          value={expTo} 
                          onChange={e => setExpTo(e.target.value)} 
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' }
                            }
                          }} 
                        />
                      </Stack>
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={handleExpensesFilter} 
                        startIcon={<FilterIcon />}
                        sx={{ 
                          bgcolor: '#EF6C00',
                          color: 'white',
                          fontWeight: 700,
                          '&:hover': { bgcolor: '#E65100' }
                        }}
                      >
                        Filter
                      </Button>
                    </Stack>
                  </Paper>

                  <Stack spacing={1.5}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>Store 1</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        AED {storeExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>Store 2</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        AED {store2Expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Paper>
                  </Stack>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Total Stock Value Card */}
          <Grid item xs={12} md={4}>
            <Fade in timeout={1100}>
              <Card 
                elevation={8} 
                sx={{ 
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(156,39,176,0.3)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                        <InventoryIcon />
                      </Avatar>
                      Stock Value
                    </Typography>
                    <Chip label="Total" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                  </Stack>

                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
                      AED {totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Chip 
                      icon={<WarehouseIcon />}
                      label="Combined Value" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                    />
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', mb: 2 }} />

                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>🏬 Warehouse</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        AED {warehouseValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>🏪 Store 1</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        AED {storeValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>🏪 Store 2</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        AED {store2Value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Slow Moving Items - Store */}
          <Grid item xs={12} md={4}>
            <Fade in timeout={1300}>
              <Card 
                elevation={8} 
                sx={{ 
                  borderRadius: 4,
                  height: 380,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                  border: '1px solid',
                  borderColor: '#e0e0e0',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(255,152,0,0.15)',
                    borderColor: '#FB8C00'
                  }
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#F57C00', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: '#FB8C00', width: 40, height: 40, boxShadow: '0 4px 12px rgba(251,140,0,0.3)' }}>
                        <WarningIcon sx={{ fontSize: 22 }} />
                      </Avatar>
                      Slow Moving
                    </Typography>
                    <Chip label="Store 1" size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700, border: '1px solid #FFB74D' }} />
                  </Stack>
                  <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: '280px', pr: 1 }}>
                    {slowMoving.store.length === 0 ? (
                      <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 600 }}>✅ No slow moving items</Alert>
                    ) : (
                      <Stack spacing={1.5}>
                        {slowMoving.store.map(s => (
                          <Paper 
                            key={s._id} 
                            elevation={0} 
                            sx={{ 
                              p: 2, 
                              borderRadius: 2, 
                              border: '1px solid #FFE0B2',
                              bgcolor: '#FFF8E1',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#FFECB3',
                                borderColor: '#FFB74D',
                                transform: 'translateX(4px)'
                              }
                            }}
                          >
                            <Typography variant="body2" fontWeight={700} color="#E65100" sx={{ mb: 0.5 }}>
                              {s.item?.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#F57C00', fontWeight: 600 }}>
                              Qty: {s.remaining_quantity}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

        {/* Slow Moving Items - Store2 */}
        <Grid item xs={12} md={4}>
          <Fade in timeout={1500}>
            <Card 
              elevation={8} 
              sx={{ 
                borderRadius: 4,
                height: 380,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid',
                borderColor: '#e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(255,152,0,0.15)',
                  borderColor: '#FB8C00'
                }
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#F57C00', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: '#FB8C00', width: 40, height: 40, boxShadow: '0 4px 12px rgba(251,140,0,0.3)' }}>
                      <WarningIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    Slow Moving
                  </Typography>
                  <Chip label="Store 2" size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700, border: '1px solid #FFB74D' }} />
                </Stack>
                <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: '280px', pr: 1 }}>
                  {slowMoving.store2.length === 0 ? (
                    <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 600 }}>✅ No slow moving items</Alert>
                  ) : (
                    <Stack spacing={1.5}>
                      {slowMoving.store2.map(s => (
                        <Paper 
                          key={s._id} 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            border: '1px solid #FFE0B2',
                            bgcolor: '#FFF8E1',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#FFECB3',
                              borderColor: '#FFB74D',
                              transform: 'translateX(4px)'
                            }
                          }}
                        >
                          <Typography variant="body2" fontWeight={700} color="#E65100" sx={{ mb: 0.5 }}>
                            {s.item?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#F57C00', fontWeight: 600 }}>
                            Qty: {s.remaining_quantity}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Low Stock - Warehouse */}
        <Grid item xs={12} md={4}>
          <Fade in timeout={1700}>
            <Card 
              elevation={8} 
              sx={{ 
                borderRadius: 4,
                height: 380,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid',
                borderColor: '#e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(244,67,54,0.15)',
                  borderColor: '#EF5350'
                }
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#D32F2F', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: '#F44336', width: 40, height: 40, boxShadow: '0 4px 12px rgba(244,67,54,0.3)' }}>
                      <WarningIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    Low Stock
                  </Typography>
                  <Chip label="Warehouse" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700, border: '1px solid #EF9A9A' }} />
                </Stack>
                <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: '280px', pr: 1 }}>
                  {lowStock.warehouse.length === 0 ? (
                    <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 600 }}>✅ No low stock items</Alert>
                  ) : (
                    <Stack spacing={1.5}>
                      {lowStock.warehouse.map(w => (
                        <Paper 
                          key={w._id} 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            border: '1px solid #FFCDD2',
                            bgcolor: '#FFEBEE',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#FFCDD2',
                              borderColor: '#EF9A9A',
                              transform: 'translateX(4px)'
                            }
                          }}
                        >
                          <Typography variant="body2" fontWeight={700} color="#C62828" sx={{ mb: 0.5 }}>
                            {w.item?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#D32F2F', fontWeight: 600 }}>
                            Qty: {w.quantity}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Low Stock - Store */}
        <Grid item xs={12} md={4}>
          <Fade in timeout={1900}>
            <Card 
              elevation={8} 
              sx={{ 
                borderRadius: 4,
                height: 380,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid',
                borderColor: '#e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(244,67,54,0.15)',
                  borderColor: '#EF5350'
                }
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#D32F2F', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: '#F44336', width: 40, height: 40, boxShadow: '0 4px 12px rgba(244,67,54,0.3)' }}>
                      <WarningIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    Low Stock
                  </Typography>
                  <Chip label="Store 1" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700, border: '1px solid #EF9A9A' }} />
                </Stack>
                <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: '280px', pr: 1 }}>
                  {lowStock.store.length === 0 ? (
                    <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 600 }}>✅ No low stock items</Alert>
                  ) : (
                    <Stack spacing={1.5}>
                      {lowStock.store.map(s => (
                        <Paper 
                          key={s._id} 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            border: '1px solid #FFCDD2',
                            bgcolor: '#FFEBEE',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#FFCDD2',
                              borderColor: '#EF9A9A',
                              transform: 'translateX(4px)'
                            }
                          }}
                        >
                          <Typography variant="body2" fontWeight={700} color="#C62828" sx={{ mb: 0.5 }}>
                            {s.item?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#D32F2F', fontWeight: 600 }}>
                            Qty: {s.remaining_quantity}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Low Stock - Store2 */}
        <Grid item xs={12} md={4}>
          <Fade in timeout={2100}>
            <Card 
              elevation={8} 
              sx={{ 
                borderRadius: 4,
                height: 380,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid',
                borderColor: '#e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(244,67,54,0.15)',
                  borderColor: '#EF5350'
                }
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#D32F2F', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: '#F44336', width: 40, height: 40, boxShadow: '0 4px 12px rgba(244,67,54,0.3)' }}>
                      <WarningIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    Low Stock
                  </Typography>
                  <Chip label="Store 2" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700, border: '1px solid #EF9A9A' }} />
                </Stack>
                <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: '280px', pr: 1 }}>
                  {lowStock.store2.length === 0 ? (
                    <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 600 }}>✅ No low stock items</Alert>
                  ) : (
                    <Stack spacing={1.5}>
                      {lowStock.store2.map(s2 => (
                        <Paper 
                          key={s2._id} 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            border: '1px solid #FFCDD2',
                            bgcolor: '#FFEBEE',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#FFCDD2',
                              borderColor: '#EF9A9A',
                              transform: 'translateX(4px)'
                            }
                          }}
                        >
                          <Typography variant="body2" fontWeight={700} color="#C62828" sx={{ mb: 0.5 }}>
                            {s2.item?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#D32F2F', fontWeight: 600 }}>
                            Qty: {s2.remaining_quantity}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Technician Stats moved to Technicians page */}
      </Grid>
      </Box>
    </Box>
  );
}
