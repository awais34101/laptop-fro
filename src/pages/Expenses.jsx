import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { listExpenses, createExpense, updateExpense, deleteExpense } from '../services/expensesApi';
import { hasPerm } from '../utils/permissions';

export default function Expenses() {
  const [store, setStore] = useState('store');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([{ description: '', category: '', amount: '' }]);

  const PAGE_SIZE = 20;

  const load = async (p = page) => {
    setLoading(true);
    try {
      const r = await listExpenses({ store, from, to, page: p, limit: PAGE_SIZE });
      setData(r.data || []);
      setTotalPages(r.totalPages || 1);
      setPage(r.page || p);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [store]);

  const openDialog = (doc) => {
    if (doc) {
      setEditId(doc._id);
      setNote(doc.note || '');
      setDate(doc.date ? doc.date.substring(0,10) : '');
      setRows((doc.items || []).map(i => ({ description: i.description, category: i.category || '', amount: String(i.amount) })));
    } else {
      setEditId(null);
      setNote('');
      setDate('');
      setRows([{ description: '', category: '', amount: '' }]);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

  const changeRow = (idx, field, value) => setRows(rows => rows.map((r,i) => i===idx ? { ...r, [field]: value } : r));
  const addRow = () => setRows(rows => [...rows, { description: '', category: '', amount: '' }]);
  const removeRow = (idx) => setRows(rows => rows.length>1 ? rows.filter((_,i)=>i!==idx) : rows);

  const save = async () => {
    try {
      const items = rows.map(r => ({ description: r.description, category: r.category, amount: Number(r.amount) }));
      const payload = { items, note, date: date || undefined };
      if (editId) {
        await updateExpense(editId, { store, ...payload });
        setSuccess('Expense updated');
      } else {
        await createExpense({ store, ...payload });
        setSuccess('Expense created');
      }
      setOpen(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await deleteExpense(id, store); load(); } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  return (
    <Box p={{ xs:1, md:3}} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>Expenses</Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField select label="Store" value={store} onChange={e => setStore(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="store">Store</MenuItem>
            <MenuItem value="store2">Store2</MenuItem>
          </TextField>
          <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} />
          <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} />
          <Button variant="contained" onClick={() => load(1)}>Filter</Button>
          <Box sx={{ flex: 1 }} />
          {(hasPerm('expenses','edit') || hasPerm('expenses','view')) && (
            <Button variant="contained" onClick={() => openDialog(null)}>Add Expense</Button>
          )}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
            ) : (data || []).map(d => {
              const total = (d.items || []).reduce((s,i)=> s + Number(i.amount||0), 0);
              return (
                <TableRow key={d._id}>
                  <TableCell>{new Date(d.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {(d.items||[]).map((i,idx)=>(
                      <div key={idx}>{i.description} {i.category?`(${i.category})`:''} - AED {Number(i.amount).toFixed(2)}</div>
                    ))}
                  </TableCell>
                  <TableCell>{d.note||''}</TableCell>
                  <TableCell>AED {total.toFixed(2)}</TableCell>
                  <TableCell>
                    {hasPerm('expenses','edit') && (
                      <IconButton onClick={()=>openDialog(d)}><EditIcon/></IconButton>
                    )}
                    {hasPerm('expenses','delete') && (
                      <IconButton onClick={()=>del(d._id)} color="error"><DeleteIcon/></IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editId?'Edit Expense':'Add Expense'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display:'flex', gap:2, mb:2, flexWrap:'wrap' }}>
            <TextField label="Note" value={note} onChange={e=>setNote(e.target.value)} fullWidth />
            <TextField type="date" label="Date" InputLabelProps={{ shrink: true }} value={date} onChange={e=>setDate(e.target.value)} />
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r,idx)=>(
                <TableRow key={idx}>
                  <TableCell><TextField value={r.description} onChange={e=>changeRow(idx,'description',e.target.value)} fullWidth required/></TableCell>
                  <TableCell><TextField value={r.category} onChange={e=>changeRow(idx,'category',e.target.value)} fullWidth/></TableCell>
                  <TableCell><TextField type="number" value={r.amount} onChange={e=>changeRow(idx,'amount',e.target.value)} fullWidth required/></TableCell>
                  <TableCell><Button onClick={()=>removeRow(idx)} color="error" disabled={rows.length===1}>Remove</Button></TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4}><Button onClick={addRow}>Add Item</Button></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          {(
            (!editId && hasPerm('expenses','view')) || (editId && hasPerm('expenses','edit'))
          ) && (
            <Button variant="contained" onClick={save}>{editId?'Save':'Create'}</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
