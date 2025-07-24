
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { fetchSalesTotalByDate, fetchStore2SalesTotalByDate } from '../services/dashboardSalesApi';
import { TextField, Button } from '@mui/material';
import { Box, Typography, Grid, Paper, Alert } from '@mui/material';
import { useInventory } from '../context/InventoryContext';


export default function Dashboard() {
  const [slowMoving, setSlowMoving] = useState({ store: [], store2: [] });
  const [lowStock, setLowStock] = useState({ warehouse: [], store: [], store2: [] });
  const [totalSales, setTotalSales] = useState(0);
  const [store2Sales, setStore2Sales] = useState(0);
  const [salesFrom, setSalesFrom] = useState('');
  const [salesTo, setSalesTo] = useState('');
  const [store2From, setStore2From] = useState('');
  const [store2To, setStore2To] = useState('');
  // ...existing code...
  const { warehouse, store, store2, items, fetchInventory, loading } = useInventory();

  useEffect(() => {
    api.get('/alerts/slow-moving').then(r => setSlowMoving({ store: r.data.store || [], store2: r.data.store2 || [] }));
    api.get('/alerts/low-stock').then(r => setLowStock(r.data));
    fetchSalesTotal();
    fetchStore2SalesTotal();
    // Technician stats moved to Technicians page
    // Listen for inventoryChanged event to refresh inventory
    const handler = () => {
      fetchInventory();
      api.get('/alerts/low-stock').then(r => setLowStock(r.data));
    };
    window.addEventListener('inventoryChanged', handler);
    return () => window.removeEventListener('inventoryChanged', handler);
  }, [fetchInventory]);


  const fetchSalesTotal = async (from = '', to = '') => {
    const r = await fetchSalesTotalByDate(from, to);
    const total = r.reduce((sum, sale) => sum + (sale.items ? sale.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.price || 0)), 0) : 0), 0);
    setTotalSales(total);
  };

  const fetchStore2SalesTotal = async (from = '', to = '') => {
    const r = await fetchStore2SalesTotalByDate(from, to);
    const total = r.reduce((sum, sale) => sum + (sale.items ? sale.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.price || 0)), 0) : 0), 0);
    setStore2Sales(total);
  };

  const handleSalesFilter = () => {
    fetchSalesTotal(salesFrom, salesTo);
  };

  const handleStore2SalesFilter = () => {
    fetchStore2SalesTotal(store2From, store2To);
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
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 2, alignSelf: 'flex-start' }}>Store Sales</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField type="date" size="small" label="From" InputLabelProps={{ shrink: true }} value={salesFrom} onChange={e => setSalesFrom(e.target.value)} sx={{ flex: 1, bgcolor: '#fff' }} />
                <TextField type="date" size="small" label="To" InputLabelProps={{ shrink: true }} value={salesTo} onChange={e => setSalesTo(e.target.value)} sx={{ flex: 1, bgcolor: '#fff' }} />
                <Button variant="contained" onClick={handleSalesFilter} sx={{ minWidth: 70, fontWeight: 700 }}>Filter</Button>
              </Box>
            </Box>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 900, mb: 1 }}>{`AED ${totalSales.toFixed(2)}`}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 2, alignSelf: 'flex-start' }}>Store2 Sales</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField type="date" size="small" label="From" InputLabelProps={{ shrink: true }} value={store2From} onChange={e => setStore2From(e.target.value)} sx={{ flex: 1, bgcolor: '#fff' }} />
                <TextField type="date" size="small" label="To" InputLabelProps={{ shrink: true }} value={store2To} onChange={e => setStore2To(e.target.value)} sx={{ flex: 1, bgcolor: '#fff' }} />
                <Button variant="contained" onClick={handleStore2SalesFilter} sx={{ minWidth: 70, fontWeight: 700 }}>Filter</Button>
              </Box>
            </Box>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 900, mb: 1 }}>{`AED ${store2Sales.toFixed(2)}`}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Total Stock Value</Typography>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 900, mb: 1 }}>AED {totalStockValue.toFixed(2)}</Typography>
            <Typography variant="subtitle1" color="secondary" sx={{ fontWeight: 700 }}>
              Warehouse: AED {warehouseValue.toFixed(2)}<br />
              Store: AED {storeValue.toFixed(2)}<br />
              Store2: AED {store2Value.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 280, display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Slow Moving Items (Store)</Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', mt: 1 }}>
              {slowMoving.store.length === 0 ? <Alert severity="success">No slow moving items in Store</Alert> : slowMoving.store.map(s => (
                <Alert severity="warning" key={s._id} sx={{ mb: 1, fontWeight: 900, bgcolor: '#fffbe6', color: '#d97706' }}>
                  {s.item?.name} (Qty: {s.remaining_quantity})
                </Alert>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 280, display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Slow Moving Items (Store2)</Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', mt: 1 }}>
              {slowMoving.store2.length === 0 ? <Alert severity="success">No slow moving items in Store2</Alert> : slowMoving.store2.map(s => (
                <Alert severity="warning" key={s._id} sx={{ mb: 1, fontWeight: 900, bgcolor: '#fffbe6', color: '#d97706' }}>
                  {s.item?.name} (Qty: {s.remaining_quantity})
                </Alert>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 280, display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Low Stock (Warehouse)</Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', mt: 1 }}>
              {lowStock.warehouse.length === 0 ? <Alert severity="success">No low stock in Warehouse</Alert> : lowStock.warehouse.map(w => (
                <Alert severity="error" key={w._id} sx={{ mb: 1 }}>Warehouse: {w.item?.name} (Qty: {w.quantity})</Alert>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 280, display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Low Stock (Store)</Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', mt: 1 }}>
              {lowStock.store.length === 0 ? <Alert severity="success">No low stock in Store</Alert> : lowStock.store.map(s => (
                <Alert severity="error" key={s._id} sx={{ mb: 1 }}>Store: {s.item?.name} (Qty: {s.remaining_quantity})</Alert>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 280, display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Low Stock (Store2)</Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', mt: 1 }}>
              {lowStock.store2.length === 0 ? <Alert severity="success">No low stock in Store2</Alert> : lowStock.store2.map(s2 => (
                <Alert severity="error" key={s2._id} sx={{ mb: 1 }}>Store2: {s2.item?.name} (Qty: {s2.remaining_quantity})</Alert>
              ))}
            </Box>
          </Paper>
        </Grid>
        {/* Technician Stats moved to Technicians page */}
      </Grid>
    </Box>
  );
}
