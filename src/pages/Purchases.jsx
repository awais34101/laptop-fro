import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Autocomplete } from '@mui/material';
import api from '../services/api';
import { hasPerm } from '../utils/permissions';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, IconButton, Backdrop, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useInventory } from '../context/InventoryContext';



export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([{ item: '', quantity: '', price: '' }]);
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [storeStock, setStoreStock] = useState([]);
  const { fetchInventory } = useInventory();

  const PAGE_SIZE = 1;
  const fetchPurchases = async (p = page) => {
    setLoading(true);
    try {
      const r = await api.get(`/purchases?page=${p}&limit=${PAGE_SIZE}`);
      if (Array.isArray(r.data)) {
        // backward compatibility with old response
        setPurchases(r.data);
        setTotalPages(1);
      } else {
        setPurchases(r.data.data || []);
        setTotalPages(r.data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  };
  const fetchItems = () => api.get('/items').then(r => setItems(Array.isArray(r.data) ? r.data : []));
  const fetchWarehouse = () => api.get('/warehouse').then(r => setWarehouseStock(r.data));
  const fetchStore = () => api.get('/store').then(r => setStoreStock(r.data));

  useEffect(() => { fetchPurchases(1); fetchItems(); fetchWarehouse(); fetchStore(); }, []);

  const handleOpen = (purchase) => {
    if (purchase) {
      setRows((Array.isArray(purchase.items) ? purchase.items : []).map(i => ({ item: i.item?._id || i.item, quantity: i.quantity, price: i.price })));
      setSupplier(purchase.supplier);
      setInvoiceNumber(purchase.invoice_number);
      setEditId(purchase._id);
    } else {
      setRows([{ item: '', quantity: '', price: '' }]);
      setSupplier('');
      setInvoiceNumber('');
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleRowChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };
  const handleAddRow = () => setRows([...rows, { item: '', quantity: '', price: '' }]);
  const handleRemoveRow = idx => setRows(rows => rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);

  const handleSubmit = async () => {
    // Basic validation to avoid mistakes
    setError('');
    const invalidRow = rows.find(r => !r.item || Number(r.quantity) <= 0 || Number.isNaN(Number(r.quantity)) || Number(r.price) < 0 || Number.isNaN(Number(r.price)));
    if (!supplier || !invoiceNumber) {
      setError('Supplier and Invoice Number are required.');
      return;
    }
    if (invalidRow) {
      setError('Please select an item and enter valid quantity (> 0) and price (>= 0) for all rows.');
      return;
    }

    setSaving(true);
    try {
      // Prepare payload for purchase
      const itemsPayload = rows.map(r => ({
        item: r.item,
        quantity: Number(r.quantity),
        price: Number(r.price)
      }));

      if (editId) {
        await api.put(`/purchases/${editId}`, {
          items: itemsPayload,
          supplier,
          invoice_number: invoiceNumber
        });
      } else {
        await api.post('/purchases', {
          items: itemsPayload,
          supplier,
          invoice_number: invoiceNumber
        });
      }

      setSuccess('Purchase invoice saved');
      await fetchPurchases(1);
      setPage(1);
      setTimeout(async () => {
        await fetchInventory();
        window.dispatchEvent(new Event('inventoryChanged'));
      }, 200);
      // Close only on success
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/purchases/${id}`);
      setSuccess('Invoice deleted successfully');
  await fetchPurchases(1);
  setPage(1);
        setTimeout(async () => {
          await fetchInventory();
          window.dispatchEvent(new Event('inventoryChanged'));
        }, 200);
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  // Helper: get item name by id
  const getItemName = (id) => items.find(i => i._id === id)?.name || '';

  // PDF Generation for Purchase Invoice
  const generatePDF = (purchase) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Purchase Invoice', 14, 16);
    doc.setFontSize(12);
    doc.text(`Supplier: ${purchase.supplier || ''}`, 14, 28);
    doc.text(`Invoice #: ${purchase.invoice_number || ''}`, 14, 36);
    doc.text(`Date: ${purchase.date ? new Date(purchase.date).toLocaleDateString() : ''}`, 14, 44);

    const tableColumn = ['Item', 'Quantity', 'Price', 'Total'];
    const tableRows = (purchase.items || []).map(item => [
      item.item?.name || getItemName(item.item?._id || item.item),
      item.quantity,
      item.price,
      (item.quantity * item.price).toFixed(2)
    ]);

    // Add table using autoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
    });

    // Invoice total
    const total = (purchase.items || []).reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2);
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 60;
    doc.text(`Invoice Total: ${total}`, 14, finalY + 10);

    return doc;
  };

  const handleDownloadPDF = (purchase) => {
    const doc = generatePDF(purchase);
    doc.save(`Purchase_Invoice_${purchase.invoice_number || ''}.pdf`);
  };

  const handleViewPDF = (purchase) => {
    const doc = generatePDF(purchase);
    window.open(doc.output('bloburl'), '_blank');
  };
  // Helper: get warehouse/store stock for item
  const getWarehouseQty = (id) => warehouseStock.find(w => w.item?._id === id)?.quantity ?? 0;
  const getStoreQty = (id) => storeStock.find(s => s.item?._id === id)?.remaining_quantity ?? 0;

  // Already sorted by backend; keep fallback sort
  const sortedPurchases = (Array.isArray(purchases) ? purchases.slice().sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        Purchases
      </Typography>
      <Button variant="contained" color="primary" onClick={handleOpen} disabled={!items || items.length === 0 || saving} sx={{ fontWeight: 700, px: 3, borderRadius: 2, mb: 2 }}>
        Add Purchase
      </Button>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" disabled={loading || page <= 1} onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchPurchases(p); }}>Prev</Button>
        <Typography variant="body2">Page {page} / {totalPages}</Typography>
        <Button variant="outlined" disabled={loading || page >= totalPages} onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchPurchases(p); }}>Next</Button>
      </Box>
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 520, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)' }}>
  <Table sx={{ minWidth: 900, '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9fafd' }, '& tbody tr:hover': { backgroundColor: '#e3eafc' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, fontSize: '1.1rem', color: 'primary.main' }}>Item</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Quantity</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Price</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Total</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Supplier</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Invoice #</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Date</TableCell>
              <TableCell sx={{ position: 'sticky', top: 0, background: '#f0f4fa', zIndex: 2, fontWeight: 900, color: 'primary.main' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading...</TableCell>
              </TableRow>
            ) : sortedPurchases.map(p => (
              <React.Fragment key={p._id}>
                {(Array.isArray(p.items) ? p.items : []).map((item, idx) => (
                  <TableRow key={p._id + '-' + idx} sx={{ transition: 'background 0.2s' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{item.item?.name || getItemName(item.item?._id || item.item)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>{(item.quantity * item.price).toFixed(2)}</TableCell>
                    {idx === 0 && (
                      <>
                        <TableCell rowSpan={p.items?.length || 1}>{p.supplier}</TableCell>
                        <TableCell rowSpan={p.items?.length || 1}>{p.invoice_number}</TableCell>
                        <TableCell rowSpan={p.items?.length || 1}>{new Date(p.date).toLocaleDateString()}</TableCell>
                        <TableCell rowSpan={p.items?.length || 1}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <IconButton onClick={() => handleOpen(p)}><EditIcon /></IconButton>
                            <Button size="small" variant="outlined" sx={{ mb: 0.5 }} onClick={() => handleViewPDF(p)}>
                              View PDF
                            </Button>
                            <Button size="small" variant="outlined" sx={{ mb: 0.5 }} onClick={() => handleDownloadPDF(p)}>
                              Download PDF
                            </Button>
                            {hasPerm('purchases','delete') && (
                              <IconButton onClick={() => handleDelete(p._id)}><DeleteIcon /></IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {/* Invoice total row */}
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ background: '#f0f4fa', fontWeight: 700 }}>Invoice Total</TableCell>
                  <TableCell colSpan={5} align="left" sx={{ background: '#f0f4fa', fontWeight: 700 }}>
                    {(Array.isArray(p.items) ? p.items : []).reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
  <Dialog open={open} onClose={saving ? undefined : handleClose} maxWidth="md" fullWidth>
  <DialogTitle>{editId ? 'Edit Purchase Invoice' : 'Add Purchase Invoice'}</DialogTitle>
  <DialogContent onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); } }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label="Supplier" value={supplier} onChange={e => setSupplier(e.target.value)} fullWidth required disabled={saving} />
            <TextField label="Invoice Number" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} fullWidth required disabled={saving} />
          </Box>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Warehouse Stock</TableCell>
                  <TableCell>Store Stock</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {/* Use Autocomplete for item selection */}
                      <Box sx={{ minWidth: 200 }}>
                        {/* Autocomplete import moved to top of file */}
                        <Autocomplete
                          options={items}
                          getOptionLabel={option => option.name || ''}
                          value={items.find(i => i._id === row.item) || null}
                          onChange={(_, newValue) => handleRowChange(idx, 'item', newValue ? newValue._id : '')}
                          disableClearable
                          disabled={saving}
                          renderInput={params => (
                            <TextField {...params} label="Item" fullWidth required />
                          )}
                          isOptionEqualToValue={(option, value) => option._id === value._id}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField type="number" value={row.quantity} onChange={e => handleRowChange(idx, 'quantity', e.target.value)} fullWidth required disabled={saving} />
                    </TableCell>
                    <TableCell>
                      <TextField type="number" value={row.price} onChange={e => handleRowChange(idx, 'price', e.target.value)} fullWidth required disabled={saving} />
                    </TableCell>
                    <TableCell>
                      {(row.quantity && row.price) ? (Number(row.quantity) * Number(row.price)).toFixed(2) : ''}
                    </TableCell>
                    <TableCell>
                      {row.item ? getWarehouseQty(row.item) : ''}
                    </TableCell>
                    <TableCell>
                      {row.item ? getStoreQty(row.item) : ''}
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => handleRemoveRow(idx)} color="error" disabled={rows.length === 1 || saving}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Invoice total row */}
                <TableRow>
                  <TableCell colSpan={3} align="right"><b>Invoice Total</b></TableCell>
                  <TableCell colSpan={4} align="left">
                    <b>{rows.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.price) || 0), 0).toFixed(2)}</b>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Button onClick={handleAddRow} color="primary" disabled={saving}>Add Item</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress color="inherit" size={18} /> : null}
          >
            {editId ? (saving ? 'Saving...' : 'Update Invoice') : (saving ? 'Saving...' : 'Add Invoice')}
          </Button>
        </DialogActions>
        <Backdrop open={saving} sx={{ zIndex: theme => theme.zIndex.modal + 1, color: '#fff' }}>
          <CircularProgress color="inherit" />
        </Backdrop>
      </Dialog>
    </Box>
  );
}
