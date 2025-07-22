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
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Warehouse Stock
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search Inventory"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 320, background: '#fff', borderRadius: 2 }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 520, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
        <Table sx={{ minWidth: 500, '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9fafd' }, '& tbody tr:hover': { backgroundColor: '#e3eafc' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>Item</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStock.map(s => (
              <TableRow key={s._id} sx={{ transition: 'background 0.2s' }}>
                <TableCell sx={{ fontWeight: 600 }}>{s.item?.name}</TableCell>
                <TableCell>{s.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
