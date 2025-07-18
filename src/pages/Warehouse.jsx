import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

export default function Warehouse() {
  const [stock, setStock] = useState([]);
  useEffect(() => { api.get('/warehouse').then(r => setStock(r.data)); }, []);
  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Warehouse Stock</Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stock.map(s => (
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
