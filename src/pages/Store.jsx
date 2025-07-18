import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

export default function Store() {
  const [inventory, setInventory] = useState([]);
  useEffect(() => { api.get('/store').then(r => setInventory(r.data)); }, []);
  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Store Inventory</Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Remaining Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map(s => (
              <TableRow key={s._id}>
                <TableCell>{s.item?.name}</TableCell>
                <TableCell>{s.remaining_quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
