import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel } from '@mui/material';
import api from '../services/api';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', canViewFinancials: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem('token');

  const fetchUsers = () => {
    api.get('/users/list', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUsers(r.data))
      .catch(() => setUsers([]));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpen = (user) => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: '', role: user.role, canViewFinancials: user.canViewFinancials });
      setEditId(user._id);
    } else {
      setForm({ name: '', email: '', password: '', role: 'staff', canViewFinancials: false });
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editId) {
        await api.put(`/users/${editId}/edit`, { role: form.role, canViewFinancials: form.canViewFinancials, isActive: true }, { headers: { Authorization: `Bearer ${token}` } });
        setSuccess('User updated');
      } else {
        await api.post('/users/add-staff', form, { headers: { Authorization: `Bearer ${token}` } });
        setSuccess('User added');
      }
      fetchUsers();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}/delete`, { headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Staff Management</Typography>
      <Button variant="contained" onClick={() => handleOpen()}>Add Staff</Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Financials</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u._id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.canViewFinancials ? 'Yes' : 'No'}</TableCell>
                <TableCell>{u.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleOpen(u)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleDeactivate(u._id)} disabled={!u.isActive}>Deactivate</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Edit User' : 'Add Staff'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" required disabled={!!editId} />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth margin="normal" required disabled={!!editId} />
            {!editId && <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth margin="normal" required />}
            <TextField select label="Role" name="role" value={form.role} onChange={handleChange} fullWidth margin="normal">
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </TextField>
            <FormControlLabel control={<Switch checked={form.canViewFinancials} onChange={handleChange} name="canViewFinancials" />} label="Can View Financials" />
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">{editId ? 'Update' : 'Add'}</Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
