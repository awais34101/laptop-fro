import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { listDocuments, createDocument, updateDocument, deleteDocument, listDocumentCategories } from '../services/documentsApi';
import { hasPerm } from '../utils/permissions';

export default function Documents() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expiringInDays, setExpiringInDays] = useState('');

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', number: '', issueDate: '', expiryDate: '', note: '' });
  const [categories, setCategories] = useState([]);

  const PAGE_SIZE = 20;

  const load = async (p = page) => {
    setLoading(true);
    try {
      const r = await listDocuments({ q, category: categoryFilter, page: p, limit: PAGE_SIZE, expiringInDays: expiringInDays || undefined });
  setData(r.data || []);
  setTotal(r.total || 0);
      setTotalPages(r.totalPages || 1);
      setPage(r.page || p);
    } catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); (async()=>{ try { const r = await listDocumentCategories(); setCategories(r.data || []); } catch(_){} })(); }, []);

  const openNew = () => { setEdit(null); setForm({ name: '', category: '', number: '', issueDate: '', expiryDate: '', note: '' }); setOpen(true); setError(''); setSuccess(''); };
  const openEdit = (d) => { setEdit(d); setForm({ name: d.name, category: d.category, number: d.number || '', issueDate: d.issueDate ? d.issueDate.substring(0,10) : '', expiryDate: d.expiryDate ? d.expiryDate.substring(0,10) : '', note: d.note || '' }); setOpen(true); setError(''); setSuccess(''); };
  const save = async () => {
    try {
      const payload = { ...form, issueDate: form.issueDate || null, expiryDate: form.expiryDate || null };
  if (edit) await updateDocument(edit._id, payload); else await createDocument(payload);
  setOpen(false); setEdit(null); setSuccess('Saved'); setSnackOpen(true); load();
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };
  const remove = async (id) => { if (!window.confirm('Delete document?')) return; await deleteDocument(id); load(); };

  return (
    <Box p={{ xs:1, md:3}} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
  <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 0.5 }}>Documents Expiry</Typography>
  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>Expiring and expired documents are shown first (soonest expiry on top).</Typography>

      <Paper elevation={3} sx={{ p:2, mb:2, borderRadius:3 }}>
        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
          <TextField size="small" label="Search" value={q} onChange={e=>setQ(e.target.value)} sx={{ minWidth: 240 }} />
          <TextField size="small" label="Category" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} sx={{ minWidth: 200 }} />
          <TextField size="small" label="Expiring in (days)" type="number" value={expiringInDays} onChange={e=>setExpiringInDays(e.target.value)} sx={{ width: 180 }} />
          <Button variant="contained" onClick={()=>load(1)}>Filter</Button>
          <Button variant="text" onClick={()=>{ setQ(''); setCategoryFilter(''); setExpiringInDays(''); load(1); }}>Clear</Button>
          <Box sx={{ flex:1 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{total} results</Typography>
          {(hasPerm('documents','edit') || hasPerm('documents','view')) && (
            <Button variant="contained" onClick={openNew}>New Document</Button>
          )}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb:2 }}>{success}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius:3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Number</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow> : (data||[]).map(d => (
              <TableRow key={d._id} sx={{ backgroundColor: d.expiryDate && new Date(d.expiryDate) <= new Date(Date.now() + 7*86400000) ? 'rgba(255,0,0,0.06)' : 'inherit' }}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.category}</TableCell>
                <TableCell>{d.number||''}</TableCell>
                <TableCell>{d.issueDate ? new Date(d.issueDate).toLocaleDateString() : ''}</TableCell>
                <TableCell>{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : ''}</TableCell>
                <TableCell>{d.note||''}</TableCell>
                <TableCell>
                  {hasPerm('documents','edit') && (
                    <Button size="small" onClick={()=>openEdit(d)}>Edit</Button>
                  )}
                  {hasPerm('documents','delete') && (
                    <Button size="small" color="error" onClick={()=>remove(d._id)}>Delete</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:1, mt:2 }}>
        <Button size="small" disabled={page <= 1 || loading} onClick={()=>load(page - 1)}>Prev</Button>
        <Typography variant="body2">Page {page} / {totalPages}</Typography>
        <Button size="small" disabled={page >= totalPages || loading} onClick={()=>load(page + 1)}>Next</Button>
      </Box>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{edit? 'Edit Document' : 'New Document'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'flex', gap:2, my:1, flexWrap:'wrap' }}>
            <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} fullWidth />
            <Autocomplete
              freeSolo
              options={categories}
              value={form.category}
              onInputChange={(_, newInput) => setForm({ ...form, category: newInput || '' })}
              renderInput={(params) => <TextField {...params} label="Category" fullWidth />}
              sx={{ width: '100%' }}
            />
            <TextField label="Number" value={form.number} onChange={e=>setForm({...form, number: e.target.value})} fullWidth />
            <TextField type="date" label="Issue Date" InputLabelProps={{ shrink: true }} value={form.issueDate} onChange={e=>setForm({...form, issueDate: e.target.value})} />
            <TextField type="date" label="Expiry Date" InputLabelProps={{ shrink: true }} value={form.expiryDate} onChange={e=>setForm({...form, expiryDate: e.target.value})} />
            <TextField label="Note" value={form.note} onChange={e=>setForm({...form, note: e.target.value})} fullWidth multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          {(
            // Allow Save for create when user has 'view'; require 'edit' for editing existing documents
            (!edit && hasPerm('documents','view')) || (edit && hasPerm('documents','edit'))
          ) && (
            <Button variant="contained" onClick={save}>Save</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message="Saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
