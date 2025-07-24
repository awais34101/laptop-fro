import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Alert, Box, Typography, Grid, Paper, TextField, Button } from '@mui/material';
import { fetchTechnicianStats } from '../services/technicianStatsApi';



import { useInventory } from '../context/InventoryContext';


export default function Dashboard() {
  const [slowMoving, setSlowMoving] = useState({ store: [], store2: [] });
  const [lowStock, setLowStock] = useState({ warehouse: [], store: [], store2: [] });
  const [totalSales, setTotalSales] = useState(0);
  const [store2Sales, setStore2Sales] = useState(0);
  const [techStats, setTechStats] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { warehouse, store, store2, items, fetchInventory, loading } = useInventory();

  useEffect(() => {
    api.get('/alerts/slow-moving').then(r => setSlowMoving({ store: r.data.store || [], store2: r.data.store2 || [] }));
    api.get('/alerts/low-stock').then(r => setLowStock(r.data));
    fetchSalesTotal();
    fetchStore2SalesTotal();
    fetchTechnicianStats().then(setTechStats);
    // Listen for inventoryChanged event to refresh inventory
    const handler = () => {
      fetchInventory();
      api.get('/alerts/low-stock').then(r => setLowStock(r.data));
    };
    window.addEventListener('inventoryChanged', handler);
    return () => window.removeEventListener('inventoryChanged', handler);
  }, [fetchInventory]);

  const fetchSalesTotal = async (f = from, t = to) => {
    let params = {};
    if (f) params.from = f;
    if (t) params.to = t;
    const r = await api.get('/sales', { params });
    const total = r.data.reduce((sum, sale) => sum + (sale.items ? sale.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.price || 0)), 0) : 0), 0);
    setTotalSales(total);
  };

  const fetchStore2SalesTotal = async (f = from, t = to) => {
    let params = {};
    if (f) params.from = f;
    if (t) params.to = t;
    const r = await api.get('/sales-store2', { params });
    const total = r.data.reduce((sum, sale) => sum + (sale.items ? sale.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.price || 0)), 0) : 0), 0);
    setStore2Sales(total);
  };

  const handleSalesFilter = () => {
    fetchSalesTotal();
    fetchStore2SalesTotal();
  };

  const handleTechStatsFilter = async () => {
    const stats = await fetchTechnicianStats(from, to);
    setTechStats(stats);
  };

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
          <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Store Sales</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} size="small" sx={{ flex: 1 }} />
              <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} size="small" sx={{ flex: 1 }} />
              <Button variant="contained" onClick={handleSalesFilter} sx={{ minWidth: 90 }}>Filter</Button>
            </Box>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 900, mb: 1 }}>AED {totalSales.toFixed(2)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Store2 Sales</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} size="small" sx={{ flex: 1 }} />
              <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} size="small" sx={{ flex: 1 }} />
              <Button variant="contained" onClick={handleSalesFilter} sx={{ minWidth: 90 }}>Filter</Button>
            </Box>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 900, mb: 1 }}>AED {store2Sales.toFixed(2)}</Typography>
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
        <Grid item xs={12} md={12}>
          <Paper elevation={3} sx={{ p: 3, mt: 2, borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>Technician Stats</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} />
              <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} />
              <Button variant="contained" onClick={handleTechStatsFilter}>Filter</Button>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              {techStats.length === 0 ? <Alert severity="info">No technician activity in selected range.</Alert> : (
                (() => {
                  // Calculate totals
                  const totalRepair = techStats.reduce((sum, t) => sum + (Number(t.repair) || 0), 0);
                  const totalTest = techStats.reduce((sum, t) => sum + (Number(t.test) || 0), 0);
                  // Calculate days in range
                  let days = 0;
                  if (from && to) {
                    const fromDate = new Date(from);
                    const toDate = new Date(to);
                    days = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1);
                  }
                  return (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, borderRadius: 8, overflow: 'hidden', background: '#f9fafd' }}>
                      <thead>
                        <tr style={{ background: '#f0f4fa' }}>
                          <th style={{ border: 'none', padding: 8, fontWeight: 700, color: '#1976d2' }}>Technician</th>
                          <th style={{ border: 'none', padding: 8, fontWeight: 700, color: '#1976d2' }}>Repair</th>
                          <th style={{ border: 'none', padding: 8, fontWeight: 700, color: '#1976d2' }}>Test</th>
                          <th style={{ border: 'none', padding: 8, fontWeight: 700, color: '#1976d2' }}>Total</th>
                          {days > 1 && <th style={{ border: 'none', padding: 8, fontWeight: 700, color: '#1976d2' }}>Avg/Day</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {techStats.map(t => (
                          <tr key={t.name} style={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }}>
                            <td style={{ padding: 8 }}>{t.name}</td>
                            <td style={{ padding: 8 }}>{t.repair}</td>
                            <td style={{ padding: 8 }}>{t.test}</td>
                            <td style={{ padding: 8 }}>{Number(t.repair) + Number(t.test)}</td>
                            {days > 1 && <td style={{ padding: 8 }}>
                              Repair: {(Number(t.repair) / days).toFixed(2)}<br />
                              Test: {(Number(t.test) / days).toFixed(2)}<br />
                              Total: {((Number(t.repair) + Number(t.test)) / days).toFixed(2)}
                            </td>}
                          </tr>
                        ))}
                        
                      </tbody>
                    </table>
                  );
                })()
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
