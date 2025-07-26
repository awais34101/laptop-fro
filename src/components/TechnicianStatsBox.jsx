import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { fetchTechnicianStats } from '../services/technicianStatsApi';
import { fetchMyStats } from '../services/technicianSelfApi';

export default function TechnicianStatsBox({ initialFrom = '', initialTo = '', technicianId = null }) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [techStats, setTechStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleTechStatsFilter = async () => {
    setLoading(true);
    if (user.role === 'technician') {
      // For technician, use self endpoint and pass date filters
      const stats = await fetchMyStats(from, to);
      setTechStats(stats ? [stats] : []);
    } else {
      let stats = await fetchTechnicianStats(from, to);
      if (technicianId) {
        // Ensure filtering by technicianId matches backend expectations
        stats = stats.filter(t => t._id === technicianId);
      }
      setTechStats(stats);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    handleTechStatsFilter();
    // eslint-disable-next-line
  }, [technicianId]);

  // Calculate days in range
  let days = 0;
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    days = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1);
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>Technician Stats</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} />
        <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} />
        <Button variant="contained" onClick={handleTechStatsFilter} disabled={loading}>Filter</Button>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        {techStats.length === 0 ? <Alert severity="info">No technician activity in selected range.</Alert> : (
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
                <tr key={t._id} style={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }}>
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
        )}
      </Box>
    </Box>
  );
}
