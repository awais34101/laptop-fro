import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchTechnicians = () => api.get('/technicians').then(r => setTechnicians(r.data));
  useEffect(() => { fetchTechnicians(); }, []);

  const handleOpen = (tech) => {
    if (tech) {
      setForm({ name: tech.name });
      setEditId(tech._id);
    } else {
      setForm({ name: '' });
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/technicians/${editId}`, form);
        setSuccess('Technician updated');
      } else {
        await api.post('/technicians', form);
        setSuccess('Technician added');
      }
      fetchTechnicians();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>Technicians</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Technician</Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {technicians.map(tech => (
              <TableRow key={tech._id}>
                <TableCell>{tech.name}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpen(tech)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Edit Technician' : 'Add Technician'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
