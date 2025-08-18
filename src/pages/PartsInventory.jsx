import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Autocomplete } from '@mui/material';
import { listParts, createPart, updatePart, deletePart, getInventory, transferParts, listPartsTransfers } from '../services/partsInventoryApi';
import { createPartsPurchase, listPartsPurchases, deletePartsPurchase } from '../services/partsPurchaseApi';
import { useParts, listPartsUsage, deletePartsUsage } from '../services/partsUsageApi';
import api from '../services/api';
import { hasPerm } from '../utils/permissions';

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
  const [transfersPage, setTransfersPage] = useState(1);
  const [transfersTotalPages, setTransfersTotalPages] = useState(1);
  const [transfersSearch, setTransfersSearch] = useState('');
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [openBuy, setOpenBuy] = useState(false);
  const [buyForm, setBuyForm] = useState({ items: [{ part: '', quantity: '', price: '' }], supplier: '', invoice_number: '', note: '' });
  const [purchases, setPurchases] = useState([]);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [purchasesTotalPages, setPurchasesTotalPages] = useState(1);
  const [purchasesSearch, setPurchasesSearch] = useState('');
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [openUse, setOpenUse] = useState(false);
  const [useForm, setUseForm] = useState({ from: 'warehouse', technician: '', items: [{ part: '', quantity: '' }], note: '' });
  const [usage, setUsage] = useState([]);
  const [usagePage, setUsagePage] = useState(1);
  const [usageTotalPages, setUsageTotalPages] = useState(1);
  const [usageSearch, setUsageSearch] = useState('');
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [partsSearch, setPartsSearch] = useState('');

  const load = async () => {
    const [p, i] = await Promise.all([listParts(), getInventory()]);
    setParts(p); setInv(i);
  };
  const loadTransfers = async ({ page = transfersPage, q = transfersSearch } = {}) => {
    setLoadingTransfers(true);
    try {
      const r = await listPartsTransfers({ page, limit: 1, q });
      setTransfers(r.data || []);
      setTransfersPage(r.page || page);
      setTransfersTotalPages(r.totalPages || 1);
    } finally { setLoadingTransfers(false); }
  };
  const loadPurchases = async ({ page = purchasesPage, q = purchasesSearch } = {}) => {
    setLoadingPurchases(true);
    try {
      const r = await listPartsPurchases({ page, limit: 1, q });
      setPurchases(r.data || []);
      setPurchasesPage(r.page || page);
      setPurchasesTotalPages(r.totalPages || 1);
    } finally { setLoadingPurchases(false); }
  };
  const loadUsage = async ({ page = usagePage, q = usageSearch } = {}) => {
    setLoadingUsage(true);
    try {
      const r = await listPartsUsage({ page, limit: 1, q });
      setUsage(r.data || []);
      setUsagePage(r.page || page);
      setUsageTotalPages(r.totalPages || 1);
    } finally { setLoadingUsage(false); }
  };
  useEffect(()=>{ load(); loadTransfers({ page:1 }); loadPurchases({ page:1 }); api.get('/technicians').then(r=>setTechnicians(r.data||[])).catch(()=>setTechnicians([])); loadUsage({ page:1 }); },[]);

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
  const invoiceTotal = (buyForm.items || []).reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.price || 0)), 0);
  const filteredParts = (parts || []).filter(p => {
    if (!partsSearch) return true;
    const q = partsSearch.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
  });

  return (
    <Box p={{ xs:1, md:3}} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>Parts Inventory</Typography>
      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb:2 }}>{success}</Alert>}

      <Paper elevation={3} sx={{ p:2, mb:2, borderRadius:3 }}>
        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
          {(hasPerm('partsInventory','edit') || hasPerm('partsInventory','view')) && (
            <Button variant="contained" onClick={openNew}>New Part</Button>
          )}
          <Button variant="outlined" onClick={()=>{ setOpenTransfer(true); setError(''); setSuccess(''); }}>Transfer Parts</Button>
          <Button variant="outlined" onClick={()=>{ setOpenBuy(true); setError(''); setSuccess(''); }}>Buy Parts</Button>
          <Button variant="outlined" color="secondary" onClick={()=>{ setOpenUse(true); setError(''); setSuccess(''); }}>Use Parts</Button>
        </Box>
      </Paper>
      {/* Recent sections first */}
      <Typography variant="h6" sx={{ mb:1, fontWeight:700, color:'primary.main' }}>Recent Parts Transfers</Typography>
      <Box sx={{ display:'flex', gap:1, alignItems:'center', mb:1 }}>
        <TextField size="small" placeholder="Search transfers" value={transfersSearch} onChange={e=>setTransfersSearch(e.target.value)} sx={{ width: 280 }} />
        <Button size="small" variant="outlined" onClick={()=>loadTransfers({ page:1, q: transfersSearch })}>Search</Button>
        <Box sx={{ flex:1 }} />
        <Button size="small" disabled={loadingTransfers || transfersPage<=1} onClick={()=>loadTransfers({ page: transfersPage-1, q: transfersSearch })}>Prev</Button>
        <Typography variant="body2">Page {transfersPage}/{transfersTotalPages}</Typography>
        <Button size="small" disabled={loadingTransfers || transfersPage>=transfersTotalPages} onClick={()=>loadTransfers({ page: transfersPage+1, q: transfersSearch })}>Next</Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius:3 }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Items</TableCell><TableCell>From</TableCell><TableCell>To</TableCell><TableCell>Note</TableCell></TableRow></TableHead>
          <TableBody>
            {loadingTransfers && (
              <TableRow><TableCell colSpan={5} align="center"><Box sx={{ display:'flex', gap:1, justifyContent:'center', py:1 }}><CircularProgress size={20} /> Loading...</Box></TableCell></TableRow>
            )}
            {!loadingTransfers && (transfers||[]).length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">No transfers found</TableCell></TableRow>
            )}
            {!loadingTransfers && (transfers||[]).map(t=> (
              <TableRow key={t._id}><TableCell>{new Date(t.date).toLocaleString()}</TableCell><TableCell>{t.items.map((i,idx)=> <div key={idx}>{i.part?.name} ({i.quantity})</div>)}</TableCell><TableCell>{t.from}</TableCell><TableCell>{t.to}</TableCell><TableCell>{t.note||''}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ mt:3, mb:1, fontWeight:700, color:'primary.main' }}>Recent Parts Purchases</Typography>
      <Box sx={{ display:'flex', gap:1, alignItems:'center', mb:1 }}>
        <TextField size="small" placeholder="Search purchases" value={purchasesSearch} onChange={e=>setPurchasesSearch(e.target.value)} sx={{ width: 280 }} />
        <Button size="small" variant="outlined" onClick={()=>loadPurchases({ page:1, q: purchasesSearch })}>Search</Button>
        <Box sx={{ flex:1 }} />
        <Button size="small" disabled={loadingPurchases || purchasesPage<=1} onClick={()=>loadPurchases({ page: purchasesPage-1, q: purchasesSearch })}>Prev</Button>
        <Typography variant="body2">Page {purchasesPage}/{purchasesTotalPages}</Typography>
        <Button size="small" disabled={loadingPurchases || purchasesPage>=purchasesTotalPages} onClick={()=>loadPurchases({ page: purchasesPage+1, q: purchasesSearch })}>Next</Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius:3, mb:3 }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Invoice</TableCell><TableCell>Supplier</TableCell><TableCell>Items</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {loadingPurchases && (
              <TableRow><TableCell colSpan={4} align="center"><Box sx={{ display:'flex', gap:1, justifyContent:'center', py:1 }}><CircularProgress size={20} /> Loading...</Box></TableCell></TableRow>
            )}
            {!loadingPurchases && (purchases||[]).length === 0 && (
              <TableRow><TableCell colSpan={4} align="center">No purchases found</TableCell></TableRow>
            )}
            {!loadingPurchases && (purchases||[]).map(p=> (
              <TableRow key={p._id}>
                <TableCell>{new Date(p.date).toLocaleString()}</TableCell>
                <TableCell>{p.invoice_number||''}</TableCell>
                <TableCell>{p.supplier||''}</TableCell>
                <TableCell>{p.items.map((it,idx)=> <div key={idx}>{it.part?.name} - {it.quantity} x AED {Number(it.price).toFixed(2)}</div>)}</TableCell>
                <TableCell>
                  {hasPerm('partsInventory','delete') && (
                    <Button size="small" color="error" onClick={async ()=>{ if(window.confirm('Delete this purchase record? This will not change inventory.')){ await deletePartsPurchase(p._id); loadPurchases({ page: purchasesPage, q: purchasesSearch }); } }}>Delete</Button>
                  )}
                </TableCell>
              </TableRow>
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

      <Dialog open={openTransfer} onClose={()=>setOpenTransfer(false)} maxWidth="md" fullWidth>
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
            <Box key={idx} sx={{ display:'flex', gap:2, mb:1, flexWrap:'wrap', alignItems:'center' }}>
              <Autocomplete
                options={parts}
                getOptionLabel={(option)=> option ? `${option.name}${option.sku ? ` (${option.sku})` : ''}` : ''}
                isOptionEqualToValue={(opt, val)=>opt?._id === val?._id}
                value={parts.find(p=>p._id===it.part) || null}
                onChange={(e, val)=>chTItem(idx,'part', val? val._id : '')}
                renderInput={(params)=>(<TextField {...params} label="Part" />)}
                sx={{ flex: '2 1 380px', minWidth: 280 }}
              />
              <TextField type="number" label="Quantity" value={it.quantity} onChange={e=>chTItem(idx,'quantity',e.target.value)} sx={{ width: 140 }} />
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

      <Dialog open={openBuy} onClose={()=>setOpenBuy(false)} maxWidth="md" fullWidth>
        <DialogTitle>Buy Parts</DialogTitle>
        <DialogContent>
          {/* Supplier & Invoice moved to top */}
          <Box sx={{ display:'flex', gap:2, mb:2 }}>
            <TextField label="Supplier" value={buyForm.supplier} onChange={e=>setBuyForm({...buyForm, supplier:e.target.value})} fullWidth />
            <TextField label="Invoice #" value={buyForm.invoice_number} onChange={e=>setBuyForm({...buyForm, invoice_number:e.target.value})} fullWidth />
          </Box>
          {buyForm.items.map((it,idx)=> (
            <Box key={idx} sx={{ display:'flex', gap:2, mb:1, flexWrap:'wrap', alignItems:'center' }}>
              <Autocomplete
                options={parts}
                getOptionLabel={(option)=> option ? `${option.name}${option.sku ? ` (${option.sku})` : ''}` : ''}
                isOptionEqualToValue={(opt, val)=>opt?._id === val?._id}
                value={parts.find(p=>p._id===it.part) || null}
                onChange={(e, val)=>chBuyItem(idx,'part', val? val._id : '')}
                renderInput={(params)=>(<TextField {...params} label="Part" />)}
                sx={{ flex: '2 1 380px', minWidth: 280 }}
              />
              <TextField type="number" label="Quantity" value={it.quantity} onChange={e=>chBuyItem(idx,'quantity',e.target.value)} sx={{ width: 120 }} />
              <TextField type="number" label="Price" value={it.price} onChange={e=>chBuyItem(idx,'price',e.target.value)} sx={{ width: 140 }} />
              <TextField label="Total (AED)" value={`AED ${(Number(it.quantity || 0) * Number(it.price || 0)).toFixed(2)}`} disabled sx={{ width: 150 }} />
              <Button color="error" onClick={()=>rmBuyItem(idx)}>Remove</Button>
            </Box>
          ))}
          <Button onClick={addBuyItem}>Add Another Part</Button>
          <Box sx={{ display:'flex', justifyContent:'flex-end', mt:1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight:700 }}>Invoice Total: AED {invoiceTotal.toFixed(2)}</Typography>
          </Box>
          <TextField label="Note" value={buyForm.note} onChange={e=>setBuyForm({...buyForm, note:e.target.value})} fullWidth multiline rows={2} sx={{ mt:2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenBuy(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitBuy}>Save Purchase</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openUse} onClose={()=>setOpenUse(false)} maxWidth="md" fullWidth>
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
            <Box key={idx} sx={{ display:'flex', gap:2, mb:1, flexWrap:'wrap', alignItems:'center' }}>
              <Autocomplete
                options={parts}
                getOptionLabel={(option)=> option ? `${option.name}${option.sku ? ` (${option.sku})` : ''}` : ''}
                isOptionEqualToValue={(opt, val)=>opt?._id === val?._id}
                value={parts.find(p=>p._id===it.part) || null}
                onChange={(e, val)=>chUseItem(idx,'part', val? val._id : '')}
                renderInput={(params)=>(<TextField {...params} label="Part" />)}
                sx={{ flex: '2 1 380px', minWidth: 280 }}
              />
              <TextField type="number" label="Quantity" value={it.quantity} onChange={e=>chUseItem(idx,'quantity',e.target.value)} sx={{ width: 140 }} />
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
      <Box sx={{ display:'flex', gap:1, alignItems:'center', mb:1 }}>
        <TextField size="small" placeholder="Search usage" value={usageSearch} onChange={e=>setUsageSearch(e.target.value)} sx={{ width: 280 }} />
        <Button size="small" variant="outlined" onClick={()=>loadUsage({ page:1, q: usageSearch })}>Search</Button>
        <Box sx={{ flex:1 }} />
        <Button size="small" disabled={loadingUsage || usagePage<=1} onClick={()=>loadUsage({ page: usagePage-1, q: usageSearch })}>Prev</Button>
        <Typography variant="body2">Page {usagePage}/{usageTotalPages}</Typography>
        <Button size="small" disabled={loadingUsage || usagePage>=usageTotalPages} onClick={()=>loadUsage({ page: usagePage+1, q: usageSearch })}>Next</Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius:3, mb:3 }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Technician</TableCell><TableCell>From</TableCell><TableCell>Items</TableCell><TableCell>Note</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {loadingUsage && (
              <TableRow><TableCell colSpan={5} align="center"><Box sx={{ display:'flex', gap:1, justifyContent:'center', py:1 }}><CircularProgress size={20} /> Loading...</Box></TableCell></TableRow>
            )}
            {!loadingUsage && (usage||[]).length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">No usage found</TableCell></TableRow>
            )}
            {!loadingUsage && (usage||[]).map(u=> (
              <TableRow key={u._id}>
                <TableCell>{new Date(u.date).toLocaleString()}</TableCell>
                <TableCell>{u.technician?.name||''}</TableCell>
                <TableCell>{u.from}</TableCell>
                <TableCell>{u.items.map((it,idx)=> <div key={idx}>{it.part?.name} ({it.quantity})</div>)}</TableCell>
                <TableCell>{u.note||''}</TableCell>
                <TableCell>
                  {hasPerm('partsInventory','delete') && (
                    <Button size="small" color="error" onClick={async ()=>{ if(window.confirm('Delete this usage record? This will not change inventory.')){ await deletePartsUsage(u._id); loadUsage({ page: usagePage, q: usageSearch }); } }}>Delete</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Parts inventory moved to bottom */}
      <Typography variant="h6" sx={{ mt:3, mb:1, fontWeight:700, color:'primary.main' }}>All Parts</Typography>
      <Box sx={{ display:'flex', gap:1, alignItems:'center', mb:1 }}>
        <TextField size="small" placeholder="Search parts by name or SKU" value={partsSearch} onChange={e=>setPartsSearch(e.target.value)} sx={{ width: 320 }} />
        {partsSearch && <Button size="small" onClick={()=>setPartsSearch('')}>Clear</Button>}
        <Box sx={{ flex:1 }} />
        <Typography variant="body2" color="text.secondary">{filteredParts.length}/{parts.length} shown</Typography>
      </Box>
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
            {filteredParts.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No parts found</TableCell></TableRow>
            )}
            {filteredParts.map(p => (
              <TableRow key={p._id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.sku}</TableCell>
                <TableCell>{findQty(inv.warehouse, p._id)}</TableCell>
                <TableCell>{findQty(inv.store, p._id)}</TableCell>
                <TableCell>{findQty(inv.store2, p._id)}</TableCell>
                <TableCell>{p.minStock||0}</TableCell>
                <TableCell>
                  {hasPerm('partsInventory','edit') && (
                    <Button size="small" onClick={()=>openEdit(p)}>Edit</Button>
                  )}
                  {hasPerm('partsInventory','delete') && (
                    <Button size="small" color="error" onClick={()=>removePart(p._id)}>Delete</Button>
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
