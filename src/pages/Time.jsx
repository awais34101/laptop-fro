import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, MenuItem } from '@mui/material';
import { clockIn, clockOut, listTimeEntries, updateEntry, deleteEntry } from '../services/timeApi';

export default function Time() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = ['admin','manager'].includes(user.role);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userId, setUserId] = useState('');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async (p = page) => {
    try {
      const res = await listTimeEntries({ from, to, userId: isManager ? userId : user._id, page: p, limit: 20 });
      setData(res.data || []);
      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  useEffect(()=>{ load(1); },[]);

  const doClockIn = async () => { setError(''); setSuccess(''); try { await clockIn(); setSuccess('Clocked in'); load(1); } catch(e) { setError(e.response?.data?.error || e.message); } };
  const doClockOut = async () => { setError(''); setSuccess(''); try { await clockOut(); setSuccess('Clocked out'); load(1); } catch(e) { setError(e.response?.data?.error || e.message); } };

  return (
    <Box p={{ xs:1, md:3}} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>Time Tracking</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={3} sx={{ p:2, mb:2, borderRadius:3 }}>
        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
          <Button variant="contained" onClick={doClockIn}>Clock In</Button>
          <Button variant="outlined" onClick={doClockOut}>Clock Out</Button>
          <Box sx={{ flex:1 }} />
          <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={e=>setFrom(e.target.value)} />
          <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={e=>setTo(e.target.value)} />
          {isManager && <TextField label="User ID" value={userId} onChange={e=>setUserId(e.target.value)} sx={{ minWidth: 220 }} />}
          <Button variant="contained" onClick={()=>load(1)}>Filter</Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius:3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Clock In</TableCell>
              <TableCell>Clock Out</TableCell>
              <TableCell>Duration (min)</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data||[]).map(row => (
              <TableRow key={row._id}>
                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                <TableCell>{row.staffName}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell>{new Date(row.clockIn).toLocaleTimeString()}</TableCell>
                <TableCell>{row.clockOut ? new Date(row.clockOut).toLocaleTimeString() : '-'}</TableCell>
                <TableCell>{row.durationMinutes || '-'}</TableCell>
                <TableCell>{row.notes || ''}</TableCell>
                <TableCell>
                  {isManager && (
                    <Button size="small" onClick={async()=>{ const ni = prompt('New clock in (YYYY-MM-DD HH:mm, optional)'); const no = prompt('New clock out (YYYY-MM-DD HH:mm, optional)'); const nn = prompt('Notes', row.notes||''); await updateEntry(row._id, { clockIn: ni? new Date(ni):undefined, clockOut: no? new Date(no):undefined, notes: nn }); load(); }}>Edit</Button>
                  )}
                  {isManager && (
                    <Button size="small" color="error" onClick={async()=>{ if(!window.confirm('Delete entry?')) return; await deleteEntry(row._id); load(); }}>Delete</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
