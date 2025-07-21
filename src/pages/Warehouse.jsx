import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField } from '@mui/material';

export default function Warehouse() {
  const [stock, setStock] = useState([]);
  const [search, setSearch] = useState('');
  useEffect(() => { api.get('/warehouse').then(r => setStock(r.data)); }, []);
  const filteredStock = stock.filter(s =>
    s.item?.name?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Warehouse Stock</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search Inventory"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 300 }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStock.map(s => (
              <TableRow key={s._id}>
                <TableCell>{s.item?.name}</TableCell>
                <TableCell>{s.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
