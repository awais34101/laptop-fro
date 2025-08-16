import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { listParts, createPart, updatePart, deletePart, getInventory, transferParts, listPartsTransfers } from '../services/partsInventoryApi';
import { createPartsPurchase, listPartsPurchases } from '../services/partsPurchaseApi';
import { useParts, listPartsUsage } from '../services/partsUsageApi';
import api from '../services/api';

export default function PartsInventory() {
  const [parts, setParts] = useState([]);
  const [inv, setInv] = useState({ warehouse: [], store: [], store2: [] });
  const [openPart, setOpenPart] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', unit: 'pcs', minStock: 0 });
  const [openTransfer, setOpenTransfer] = useState(false);
  const [tForm, setTForm] = useState({ from: 'warehouse', to: 'store', items: [{ part: '', quantity: '' }], note: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transfers, setTransfers] = useState([]);
  const [openBuy, setOpenBuy] = useState(false);
  const [buyForm, setBuyForm] = useState({ items: [{ part: '', quantity: '', price: '' }], supplier: '', invoice_number: '', note: '' });
  const [purchases, setPurchases] = useState([]);
  const [openUse, setOpenUse] = useState(false);
  const [useForm, setUseForm] = useState({ from: 'warehouse', technician: '', items: [{ part: '', quantity: '' }], note: '' });
  const [usage, setUsage] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const load = async () => {
    const [p, i] = await Promise.all([listParts(), getInventory()]);
    setParts(p); setInv(i);
  };
  const loadTransfers = async () => {
    const r = await listPartsTransfers({ page: 1, limit: 20 });
    setTransfers(r.data || []);
  };
  const loadPurchases = async () => {
    const r = await listPartsPurchases({ page: 1, limit: 20 });
    setPurchases(r.data || []);
  };
  useEffect(()=>{ load(); loadTransfers(); loadPurchases(); api.get('/technicians').then(r=>setTechnicians(r.data||[])).catch(()=>setTechnicians([])); loadUsage(); },[]);
  const loadUsage = async () => { const r = await listPartsUsage({ page:1, limit:20 }); setUsage(r.data||[]); };

  const openNew = () => { setEdit(null); setForm({ name:'', sku:'', unit:'pcs', minStock:0 }); setOpenPart(true); setError(''); setSuccess(''); };
  const openEdit = (p) => { setEdit(p); setForm({ name:p.name, sku:p.sku||'', unit:p.unit||'pcs', minStock:p.minStock||0 }); setOpenPart(true); setError(''); setSuccess(''); };
  const savePart = async () => {
    try {
      if (edit) await updatePart(edit._id, form); else await createPart(form);
      setOpenPart(false); setEdit(null); load(); setSuccess('Saved');
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };
  const removePart = async (id) => { if (!window.confirm('Delete part?')) return; await deletePart(id); load(); };

  const addTItem = () => setTForm(f=>({...f, items:[...f.items,{ part:'', quantity:'' }]}));
  const rmTItem = (idx) => setTForm(f=>({...f, items:f.items.filter((_,i)=>i!==idx)}));
  const chTItem = (idx, field, value) => setTForm(f=>({...f, items:f.items.map((it,i)=>i===idx?{...it,[field]:value}:it)}));
  const submitTransfer = async () => {
    try {
      const payload = { ...tForm, items: tForm.items.map(i=>({ part: i.part, quantity: Number(i.quantity) })) };
      await transferParts(payload);
      setOpenTransfer(false); setTForm({ from:'warehouse', to:'store', items:[{part:'',quantity:''}], note:'' }); load(); loadTransfers(); setSuccess('Transferred');
      window.dispatchEvent(new Event('inventoryChanged'));
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  const addBuyItem = () => setBuyForm(f=>({ ...f, items:[...f.items, { part:'', quantity:'', price:'' }] }));
  const rmBuyItem = (idx) => setBuyForm(f=>({ ...f, items: f.items.filter((_,i)=>i!==idx) }));
  const chBuyItem = (idx, field, value) => setBuyForm(f=>({ ...f, items: f.items.map((it,i)=> i===idx ? { ...it, [field]: value } : it ) }));
  const submitBuy = async () => {
    const payload = { ...buyForm, items: buyForm.items.map(i=>({ part: i.part, quantity: Number(i.quantity), price: Number(i.price) })) };
    await createPartsPurchase(payload);
    setOpenBuy(false); setBuyForm({ items:[{part:'',quantity:'',price:''}], supplier:'', invoice_number:'', note:'' });
    await Promise.all([load(), loadPurchases()]);
  };

  const addUseItem = () => setUseForm(f=>({ ...f, items:[...f.items, { part:'', quantity:'' }] }));
  const rmUseItem = (idx) => setUseForm(f=>({ ...f, items: f.items.filter((_,i)=>i!==idx) }));
  const chUseItem = (idx, field, value) => setUseForm(f=>({ ...f, items: f.items.map((it,i)=> i===idx ? { ...it, [field]: value } : it ) }));
  const submitUse = async () => {
  if (!useForm.technician) { setError('Technician is required'); return; }
    const payload = { ...useForm, items: useForm.items.map(i=>({ part: i.part, quantity: Number(i.quantity) })) };
    await useParts(payload);
    setOpenUse(false); setUseForm({ from:'warehouse', technician:'', items:[{part:'',quantity:''}], note:'' });
    await Promise.all([load(), loadUsage()]);
  };

  const findQty = (arr, id) => (arr.find(x=>x.part?._id===id)?.quantity || arr.find(x=>x.part?._id===id)?.remaining_quantity || 0);

  return (
    <Box p={{ xs:1, md:3}} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>Parts Inventory</Typography>
      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb:2 }}>{success}</Alert>}

      <Paper elevation={3} sx={{ p:2, mb:2, borderRadius:3 }}>
        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
          <Button variant="contained" onClick={openNew}>New Part</Button>
          <Button variant="outlined" onClick={()=>{ setOpenTransfer(true); setError(''); setSuccess(''); }}>Transfer Parts</Button>
          <Button variant="outlined" onClick={()=>{ setOpenBuy(true); setError(''); setSuccess(''); }}>Buy Parts</Button>
          <Button variant="outlined" color="secondary" onClick={()=>{ setOpenUse(true); setError(''); setSuccess(''); }}>Use Parts</Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius:3, mb:3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Part</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Store</TableCell>
              <TableCell>Store2</TableCell>
              <TableCell>Min Stock</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parts.map(p => (
              <TableRow key={p._id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.sku}</TableCell>
                <TableCell>{findQty(inv.warehouse, p._id)}</TableCell>
                <TableCell>{findQty(inv.store, p._id)}</TableCell>
                <TableCell>{findQty(inv.store2, p._id)}</TableCell>
                <TableCell>{p.minStock||0}</TableCell>
                <TableCell>
                  <Button size="small" onClick={()=>openEdit(p)}>Edit</Button>
                  <Button size="small" color="error" onClick={()=>removePart(p._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ mb:1, fontWeight:700, color:'primary.main' }}>Recent Parts Transfers</Typography>
      <TableContainer component={Paper} sx={{ borderRadius:3 }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Items</TableCell><TableCell>From</TableCell><TableCell>To</TableCell><TableCell>Note</TableCell></TableRow></TableHead>
          <TableBody>
            {(transfers||[]).map(t=> (
              <TableRow key={t._id}><TableCell>{new Date(t.date).toLocaleString()}</TableCell><TableCell>{t.items.map((i,idx)=> <div key={idx}>{i.part?.name} ({i.quantity})</div>)}</TableCell><TableCell>{t.from}</TableCell><TableCell>{t.to}</TableCell><TableCell>{t.note||''}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ mt:3, mb:1, fontWeight:700, color:'primary.main' }}>Recent Parts Purchases</Typography>
      <TableContainer component={Paper} sx={{ borderRadius:3, mb:3 }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Invoice</TableCell><TableCell>Supplier</TableCell><TableCell>Items</TableCell></TableRow></TableHead>
          <TableBody>
            {(purchases||[]).map(p=> (
              <TableRow key={p._id}><TableCell>{new Date(p.date).toLocaleString()}</TableCell><TableCell>{p.invoice_number||''}</TableCell><TableCell>{p.supplier||''}</TableCell><TableCell>{p.items.map((it,idx)=> <div key={idx}>{it.part?.name} - {it.quantity} x AED {Number(it.price).toFixed(2)}</div>)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openPart} onClose={()=>setOpenPart(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{edit? 'Edit Part' : 'New Part'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'flex', gap:2, my:1, flexWrap:'wrap' }}>
            <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} fullWidth required />
            <TextField label="SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} fullWidth />
            <TextField label="Unit" value={form.unit} onChange={e=>setForm({...form, unit:e.target.value})} fullWidth />
            <TextField type="number" label="Min Stock" value={form.minStock} onChange={e=>setForm({...form, minStock:e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenPart(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePart}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTransfer} onClose={()=>setOpenTransfer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Parts</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'flex', gap:2, mb:2 }}>
            <TextField select label="From" value={tForm.from} onChange={e=>setTForm({...tForm, from:e.target.value})} fullWidth>
              <MenuItem value="warehouse">Warehouse</MenuItem>
              <MenuItem value="store">Store</MenuItem>
              <MenuItem value="store2">Store2</MenuItem>
            </TextField>
            <TextField select label="To" value={tForm.to} onChange={e=>setTForm({...tForm, to:e.target.value})} fullWidth>
              <MenuItem value="warehouse">Warehouse</MenuItem>
              <MenuItem value="store">Store</MenuItem>
              <MenuItem value="store2">Store2</MenuItem>
            </TextField>
          </Box>
          {tForm.items.map((it,idx)=> (
            <Box key={idx} sx={{ display:'flex', gap:2, mb:1 }}>
              <TextField select label="Part" value={it.part} onChange={e=>chTItem(idx,'part',e.target.value)} fullWidth>
                <MenuItem value="">Select Part</MenuItem>
                {parts.map(p=> <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </TextField>
              <TextField type="number" label="Quantity" value={it.quantity} onChange={e=>chTItem(idx,'quantity',e.target.value)} fullWidth />
              <Button color="error" onClick={()=>rmTItem(idx)}>Remove</Button>
            </Box>
          ))}
          <Button onClick={addTItem}>Add Another Part</Button>
          <TextField label="Note" value={tForm.note} onChange={e=>setTForm({...tForm, note:e.target.value})} fullWidth multiline rows={2} sx={{ mt:2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenTransfer(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitTransfer}>Transfer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openBuy} onClose={()=>setOpenBuy(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Buy Parts</DialogTitle>
        <DialogContent>
          {buyForm.items.map((it,idx)=> (
            <Box key={idx} sx={{ display:'flex', gap:2, mb:1 }}>
              <TextField select label="Part" value={it.part} onChange={e=>chBuyItem(idx,'part',e.target.value)} fullWidth>
                <MenuItem value="">Select Part</MenuItem>
                {parts.map(p=> <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </TextField>
              <TextField type="number" label="Quantity" value={it.quantity} onChange={e=>chBuyItem(idx,'quantity',e.target.value)} fullWidth />
              <TextField type="number" label="Price" value={it.price} onChange={e=>chBuyItem(idx,'price',e.target.value)} fullWidth />
              <Button color="error" onClick={()=>rmBuyItem(idx)}>Remove</Button>
            </Box>
          ))}
          <Button onClick={addBuyItem}>Add Another Part</Button>
          <Box sx={{ display:'flex', gap:2, mt:2 }}>
            <TextField label="Supplier" value={buyForm.supplier} onChange={e=>setBuyForm({...buyForm, supplier:e.target.value})} fullWidth />
            <TextField label="Invoice #" value={buyForm.invoice_number} onChange={e=>setBuyForm({...buyForm, invoice_number:e.target.value})} fullWidth />
          </Box>
          <TextField label="Note" value={buyForm.note} onChange={e=>setBuyForm({...buyForm, note:e.target.value})} fullWidth multiline rows={2} sx={{ mt:2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenBuy(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitBuy}>Save Purchase</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openUse} onClose={()=>setOpenUse(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Use Parts</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'flex', gap:2, mb:2 }}>
            <TextField select label="From" value={useForm.from} onChange={e=>setUseForm({...useForm, from:e.target.value})} fullWidth>
              <MenuItem value="warehouse">Warehouse</MenuItem>
              <MenuItem value="store">Store</MenuItem>
              <MenuItem value="store2">Store2</MenuItem>
            </TextField>
            <TextField select label="Technician" value={useForm.technician} onChange={e=>setUseForm({...useForm, technician:e.target.value})} fullWidth required>
              <MenuItem value="">Select Technician</MenuItem>
              {technicians.map(t=> <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
            </TextField>
          </Box>
          {useForm.items.map((it,idx)=> (
            <Box key={idx} sx={{ display:'flex', gap:2, mb:1 }}>
              <TextField select label="Part" value={it.part} onChange={e=>chUseItem(idx,'part',e.target.value)} fullWidth>
                <MenuItem value="">Select Part</MenuItem>
                {parts.map(p=> <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </TextField>
              <TextField type="number" label="Quantity" value={it.quantity} onChange={e=>chUseItem(idx,'quantity',e.target.value)} fullWidth />
              <Button color="error" onClick={()=>rmUseItem(idx)}>Remove</Button>
            </Box>
          ))}
          <Button onClick={addUseItem}>Add Another Part</Button>
          <TextField label="Note" value={useForm.note} onChange={e=>setUseForm({...useForm, note:e.target.value})} fullWidth multiline rows={2} sx={{ mt:2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenUse(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitUse}>Mark as Used</Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h6" sx={{ mt:3, mb:1, fontWeight:700, color:'primary.main' }}>Recent Parts Usage</Typography>
      <TableContainer component={Paper} sx={{ borderRadius:3, mb:3 }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Technician</TableCell><TableCell>From</TableCell><TableCell>Items</TableCell><TableCell>Note</TableCell></TableRow></TableHead>
          <TableBody>
            {(usage||[]).map(u=> (
              <TableRow key={u._id}><TableCell>{new Date(u.date).toLocaleString()}</TableCell><TableCell>{u.technician?.name||''}</TableCell><TableCell>{u.from}</TableCell><TableCell>{u.items.map((it,idx)=> <div key={idx}>{it.part?.name} ({it.quantity})</div>)}</TableCell><TableCell>{u.note||''}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
