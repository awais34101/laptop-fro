import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Alert, Box, Typography, Grid, Paper, TextField, Button } from '@mui/material';
import { fetchTechnicianStats } from '../services/technicianStatsApi';


export default function Dashboard() {
  const [slowMoving, setSlowMoving] = useState([]);
  const [lowStock, setLowStock] = useState({ warehouse: [], store: [] });
  const [totalSales, setTotalSales] = useState(0);
  const [techStats, setTechStats] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    api.get('/alerts/slow-moving').then(r => setSlowMoving(r.data));
    api.get('/alerts/low-stock').then(r => setLowStock(r.data));
    fetchSalesTotal();
    fetchTechnicianStats().then(setTechStats);
  }, []);

  const fetchSalesTotal = async (f = from, t = to) => {
    let params = {};
    if (f) params.from = f;
    if (t) params.to = t;
    const r = await api.get('/sales', { params });
    const total = r.data.reduce((sum, sale) => sum + (sale.items ? sale.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.price || 0)), 0) : 0), 0);
    setTotalSales(total);
  };

  const handleSalesFilter = () => {
    fetchSalesTotal();
  };

  const handleTechStatsFilter = async () => {
    const stats = await fetchTechnicianStats(from, to);
    setTechStats(stats);
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Dashboard Alerts</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Total Sales</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} size="small" />
              <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} size="small" />
              <Button variant="contained" onClick={handleSalesFilter}>Filter</Button>
            </Box>
            <Typography variant="h5" color="primary"><b>AED {totalSales.toFixed(2)}</b></Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6">Slow Moving Items</Typography>
            {slowMoving.length === 0 ? <Alert severity="success">No slow moving items</Alert> : slowMoving.map(item => (
              <Alert severity="warning" key={item._id}>{item.name} (Last Sale: {item.last_sale_date ? new Date(item.last_sale_date).toLocaleDateString() : 'Never'})</Alert>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6">Low Stock</Typography>
            {lowStock.warehouse.length === 0 && lowStock.store.length === 0 ? <Alert severity="success">Stock levels are healthy</Alert> : <>
              {lowStock.warehouse.map(w => <Alert severity="error" key={w._id}>Warehouse: {w.item?.name} (Qty: {w.quantity})</Alert>)}
              {lowStock.store.map(s => <Alert severity="error" key={s._id}>Store: {s.item?.name} (Qty: {s.remaining_quantity})</Alert>)}
            </>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={12}>
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6">Technician Stats</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} />
              <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} />
              <Button variant="contained" onClick={handleTechStatsFilter}>Filter</Button>
            </Box>
            <Box>
              {techStats.length === 0 ? <Alert severity="info">No technician activity in selected range.</Alert> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: 4 }}>Technician</th>
                      <th style={{ border: '1px solid #ccc', padding: 4 }}>Repair</th>
                      <th style={{ border: '1px solid #ccc', padding: 4 }}>Test</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techStats.map(t => (
                      <tr key={t.name}>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}>{t.name}</td>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}>{t.repair}</td>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}>{t.test}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
