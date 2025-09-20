import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, CircularProgress, Alert } from '@mui/material';

export default function Store2() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [slowMoving, setSlowMoving] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const load = async () => {
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
    load();
  }, []);
  const filteredInventory = inventory.filter(s =>
    s.item?.name?.toLowerCase().includes(search.toLowerCase())
  );
  // Get slow moving item ids for highlighting
  const slowIds = new Set(slowMoving.map(s => s.item?._id));
  // Sort: slow moving items first, then alphabetically within each group
  const sortedInventory = [
    ...filteredInventory.filter(s => slowIds.has(s.item?._id)).sort((a, b) => (a.item?.name || '').localeCompare(b.item?.name || '')),
    ...filteredInventory.filter(s => !slowIds.has(s.item?._id)).sort((a, b) => (a.item?.name || '').localeCompare(b.item?.name || '')),
  ];
  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Store2 Inventory</Typography>
  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search Inventory"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 300 }}
        />
      </Box>
      {slowMoving.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {slowMoving.map(s => (
            <Box key={s._id} sx={{ bgcolor: '#ffeaea', color: '#d32f2f', p: 1, mb: 1, borderRadius: 2, fontWeight: 700 }}>
              Slow Moving: {s.item?.name} (Qty: {s.remaining_quantity})
            </Box>
          ))}
        </Box>
      )}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Remaining Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                    <span>Loading inventory...</span>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {!loading && sortedInventory.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center">No items found</TableCell>
              </TableRow>
            )}
            {!loading && sortedInventory.map(s => (
              <TableRow key={s._id} sx={slowIds.has(s.item?._id) ? { bgcolor: '#ffeaea' } : {}}>
                <TableCell sx={slowIds.has(s.item?._id) ? { color: '#d32f2f', fontWeight: 700 } : {}}>{s.item?.name}</TableCell>
                <TableCell>{s.remaining_quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
