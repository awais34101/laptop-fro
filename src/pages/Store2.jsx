import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField } from '@mui/material';

export default function Store2() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [slowMoving, setSlowMoving] = useState([]);
  useEffect(() => {
    api.get('/store2').then(r => setInventory(r.data));
    api.get('/alerts/slow-moving').then(r => setSlowMoving(r.data.store2 || []));
  }, []);
  const filteredInventory = inventory.filter(s =>
    s.item?.name?.toLowerCase().includes(search.toLowerCase())
  );
  // Get slow moving item ids for highlighting
  const slowIds = new Set(slowMoving.map(s => s.item?._id));
  // Sort: slow moving items first
  const sortedInventory = [
    ...filteredInventory.filter(s => slowIds.has(s.item?._id)),
    ...filteredInventory.filter(s => !slowIds.has(s.item?._id)),
  ];
  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Store2 Inventory</Typography>
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
            {sortedInventory.map(s => (
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
