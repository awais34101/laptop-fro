import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { listPartRequests, createPartRequest, updatePartRequestStatus, deletePartRequest, getItemPriceHistory } from '../services/partsApi';
import api from '../services/api';

const STATUS = ['requested','approved','ordered','received','rejected','cancelled'];

export default function PartsRequests() {
  const [status, setStatus] = useState('');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);

  const PAGE_SIZE = 20;

  const load = async (p=page) => {
    setLoading(true);
    try {
      const r = await listPartRequests({ status, page: p, limit: PAGE_SIZE });
      setData(r.data||[]); setTotalPages(r.totalPages||1); setPage(r.page||p);
    } catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(1); api.get('/items').then(r=>setItems(r.data||[])); },[]);

  const openDialog = () => { setItem(''); setQuantity('1'); setNote(''); setError(''); setSuccess(''); setOpen(true); };
  const closeDialog = () => setOpen(false);

  const save = async () => {
    try {
      await createPartRequest({ item, quantity: Number(quantity), note });
      setSuccess('Request submitted');
      setOpen(false);
      load();
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  const changeStatus = async (id, s) => {
    try { await updatePartRequestStatus(id, s); load(); } catch(e){ setError(e.response?.data?.error||e.message);} }

  const del = async (id) => { if (!window.confirm('Delete this request?')) return; try { await deletePartRequest(id); load(); } catch(e){ setError(e.response?.data?.error||e.message);} };

  const openHistory = async (itemId) => { setHistoryOpen(true); try { const h = await getItemPriceHistory(itemId); setHistory(h||[]); } catch(e){ setHistory([]);} };

  return (
    <Box p={{ xs:1, md:3}} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>Parts Requests</Typography>

      <Paper elevation={3} sx={{ p:2, mb:2, borderRadius:3 }}>
        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
          <TextField select label="Status" value={status} onChange={e=>setStatus(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            {STATUS.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={()=>load(1)}>Filter</Button>
          <Box sx={{ flex:1 }} />
          <Button variant="contained" onClick={openDialog}>New Request</Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb:2 }}>{success}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius:3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow> : (data||[]).map(d => (
              <TableRow key={d._id}>
                <TableCell>{new Date(d.createdAt||d.date).toLocaleString()}</TableCell>
                <TableCell>{d.item?.name || ''} <Button size="small" onClick={()=>openHistory(d.item?._id || d.item)}>Price history</Button></TableCell>
                <TableCell>{d.quantity}</TableCell>
                <TableCell>{d.note||''}</TableCell>
                <TableCell>
                  <TextField select size="small" value={d.status} onChange={(e)=>changeStatus(d._id,e.target.value)}>
                    {STATUS.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell>
                  <IconButton onClick={()=>del(d._id)} color="error"><DeleteIcon/></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>New Part Request</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'flex', gap:2, my:1 }}>
            <TextField select label="Item" value={item} onChange={e=>setItem(e.target.value)} fullWidth>
              {items.map(i=> <MenuItem key={i._id} value={i._id}>{i.name}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Quantity" value={quantity} onChange={e=>setQuantity(e.target.value)} sx={{ maxWidth: 140 }} />
          </Box>
          <TextField label="Note" value={note} onChange={e=>setNote(e.target.value)} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={save} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyOpen} onClose={()=>setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Item Price History</DialogTitle>
        <DialogContent>
          {(history||[]).length===0 ? (
            <Typography>No history</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h,idx)=>(
                  <TableRow key={idx}>
                    <TableCell>{new Date(h.date).toLocaleDateString()}</TableCell>
                    <TableCell>{h.invoice_number}</TableCell>
                    <TableCell>{h.quantity}</TableCell>
                    <TableCell>{Number(h.price).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
