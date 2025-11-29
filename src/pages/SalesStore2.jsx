import React, { useEffect, useState } from 'react';
import { Autocomplete } from '@mui/material';
import api from '../services/api';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useInventory } from '../context/InventoryContext';
import { hasPerm } from '../utils/permissions';
import { generateInvoicePDF } from '../utils/invoicePdfGenerator';

export default function SalesStore2() {
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([{ item: '', quantity: '', price: '' }]);
  const [customer, setCustomer] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pdfDialog, setPdfDialog] = useState(false);
  const [currentPdf, setCurrentPdf] = useState(null);
  const [searchItem, setSearchItem] = useState('');
  const { store2, fetchInventory } = useInventory();

  // Helper function to get Store2 inventory for an item
  const getStore2Qty = (itemId) => store2.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;

  const PAGE_SIZE = 1;
  const fetchSales = async (p = page, itemId = searchItem) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: itemId ? 1 : p, 
        limit: itemId ? 10000 : PAGE_SIZE 
      });
      if (itemId) params.append('item', itemId);
      const r = await api.get(`/sales-store2?${params.toString()}`);
      if (Array.isArray(r.data)) {
        const sorted = [...r.data].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setSales(itemId ? sorted : sorted.slice(0, 1));
        setTotalPages(itemId ? 1 : (sorted.length ? sorted.length : 1));
      } else {
        setSales(r.data.data || []);
        setTotalPages(itemId ? 1 : (r.data.totalPages || 1));
      }
    } catch (e) {
      setSales([]);
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchItems = async () => {
    try {
      const r = await api.get('/items');
      setItems(r.data);
    } catch {
      setItems([]);
    }
  };
  const fetchCustomers = async () => {
    try {
      const r = await api.get('/customers');
      setCustomers(r.data);
    } catch {
      setCustomers([]);
    }
  };

  useEffect(() => { fetchSales(1); fetchItems(); fetchCustomers(); fetchInventory(); }, [fetchInventory]);

  // Listen for inventory changes from other components
  useEffect(() => {
    const handler = () => {
      fetchInventory();
    };
    window.addEventListener('inventoryChanged', handler);
    return () => window.removeEventListener('inventoryChanged', handler);
  }, [fetchInventory]);

  const handleOpen = (sale) => {
    if (sale) {
      setRows(sale.items ? sale.items.map(i => ({ item: i.item?._id || i.item, quantity: i.quantity, price: i.price || '' })) : [{ item: '', quantity: '', price: '' }]);
      setCustomer(sale.customer?._id || sale.customer || '');
      setInvoiceNumber(sale.invoice_number || '');
      setEditId(sale._id);
    } else {
      setRows([{ item: '', quantity: '', price: '' }]);
      setCustomer('');
      setInvoiceNumber('');
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // Handle PDF generation and show dialog
  const handleGeneratePDF = (sale) => {
    const pdfData = generateInvoicePDF(sale, 'store2');
    setCurrentPdf(pdfData);
    setPdfDialog(true);
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (currentPdf) {
      currentPdf.doc.save(currentPdf.fileName);
      setPdfDialog(false);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (currentPdf) {
      const message = `Invoice ${currentPdf.invoiceNumber} for ${currentPdf.customerName}\nTotal: ${currentPdf.total} AED\n\nThank you for your business!\nPRO CRM - Laptop Business`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Share via Email
  const handleShareEmail = () => {
    if (currentPdf) {
      const subject = `Invoice ${currentPdf.invoiceNumber} - PRO CRM`;
      const body = `Dear ${currentPdf.customerName},\n\nPlease find your invoice details below:\n\nInvoice Number: ${currentPdf.invoiceNumber}\nTotal Amount: ${currentPdf.total} AED\n\nThank you for your business!\n\nBest regards,\nPRO CRM - Laptop Business`;
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
    }
  };

  // Preview PDF in new tab
  const handlePreviewPDF = () => {
    if (currentPdf) {
      const pdfBlob = currentPdf.doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    }
  };

  const handleRowChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };
  const handleAddRow = () => setRows([...rows, { item: '', quantity: '', price: '' }]);
  const handleRemoveRow = idx => setRows(rows => rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);

  const handleSubmit = async () => {
    setSaving(true);
    setError(''); // Clear previous errors
    
    try {
      // Validate required fields
      if (!customer) {
        setError('⚠️ Please select a customer before saving the invoice.');
        setSaving(false);
        return;
      }
      
      // Validate at least one complete item row
      const completeRows = rows.filter(row => row.item && row.quantity && Number(row.quantity) > 0 && row.price);
      if (completeRows.length === 0) {
        setError('⚠️ Please add at least one item with quantity and price to create an invoice.');
        setSaving(false);
        return;
      }
      
      // Validate inventory before submitting
      const inventoryErrors = [];
      
      for (const row of completeRows) {
        const requestedQty = Number(row.quantity);
        const availableStock = getStore2Qty(row.item);
        const itemName = items.find(i => i._id === row.item)?.name || 'Unknown Item';
        
        if (requestedQty > availableStock) {
          inventoryErrors.push(
            `❌ ${itemName}: Cannot sell ${requestedQty} units - only ${availableStock} units available in Store 2 inventory`
          );
        }
      }
      
      // If there are inventory errors, show them and stop submission
      if (inventoryErrors.length > 0) {
        setError('Insufficient Stock:\n\n' + inventoryErrors.join('\n\n'));
        setSaving(false);
        return;
      }
      
      const itemsPayload = rows.map(r => ({ item: r.item, quantity: Number(r.quantity), price: Number(r.price) }));
      if (editId) {
        await api.put(`/sales-store2/${editId}`, {
          items: itemsPayload,
          customer,
          invoice_number: invoiceNumber
        });
      } else {
        await api.post('/sales-store2', {
          items: itemsPayload,
          customer,
          invoice_number: invoiceNumber
        });
      }
      setSuccess('Sale invoice saved');
      setOpen(false);
      fetchSales();
      // Refresh inventory immediately and notify other components
      fetchInventory();
      window.dispatchEvent(new Event('inventoryChanged'));
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  // Helper: get item name by id
  const getItemName = (id) => items.find(i => i._id === id)?.name || '';

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/sales-store2/${id}`);
      setSuccess('Invoice deleted successfully');
      fetchSales();
      // Refresh inventory immediately and notify other components
      fetchInventory();
      window.dispatchEvent(new Event('inventoryChanged'));
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        p: { xs: 2, sm: 3, md: 4 }
      }}
    >
      {/* Header Section */}
      <Box 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          p: 3,
          mb: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            Sales Management (Store 2)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage all Store 2 sales invoices
          </Typography>
        </Box>
        {hasPerm('sales','view') && (
          <Button 
            variant="contained" 
            onClick={() => handleOpen()}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
              }
            }}
          >
            + Add Sale Invoice
          </Button>
        )}
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>{success}</Alert>
      )}

      {/* Search by Item */}
      <Box 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          p: 2,
          mb: 3,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Autocomplete
            options={items}
            getOptionLabel={(option) => option.name || ''}
            value={items.find(i => i._id === searchItem) || null}
            onChange={(_, value) => {
              const itemId = value?._id || '';
              setSearchItem(itemId);
              setPage(1);
              fetchSales(1, itemId);
            }}
            filterOptions={(options, state) => {
              if (!state.inputValue) return [];
              return options.filter(option => 
                option.name.toLowerCase().includes(state.inputValue.toLowerCase())
              );
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Search Invoice by Item" 
                placeholder="Type item name..."
                helperText="Search sales invoices containing specific items"
                sx={{ minWidth: 300 }}
              />
            )}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            noOptionsText="Type to search items"
            sx={{ flex: 1, minWidth: 300 }}
          />
          {searchItem && (
            <Button 
              variant="outlined"
              onClick={() => {
                setSearchItem('');
                setPage(1);
                fetchSales(1, '');
              }}
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#1565c0',
                  background: 'rgba(25, 118, 210, 0.05)'
                }
              }}
            >
              Clear Search
            </Button>
          )}
        </Box>
      </Box>

      {/* Pagination Controls */}
      <Box 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          p: 2,
          mb: 3,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3
        }}
      >
        {searchItem ? (
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1976d2' }}>
            Found {sales.length} invoice{sales.length !== 1 ? 's' : ''} containing the selected item
          </Typography>
        ) : (
          <>
            <Button 
              variant="outlined" 
              disabled={loading || page <= 1} 
              onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchSales(p); }}
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  borderColor: '#1565c0',
                  background: 'rgba(25, 118, 210, 0.05)'
                }
              }}
            >
              Previous
            </Button>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Page {page} of {totalPages}
            </Typography>
            <Button 
              variant="outlined" 
              disabled={loading || page >= totalPages} 
              onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchSales(p); }}
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  borderColor: '#1565c0',
                  background: 'rgba(25, 118, 210, 0.05)'
                }
              }}
            >
              Next
            </Button>
          </>
        )}
      </Box>

      {/* Sales Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Typography variant="body2" color="text.secondary">
              Loading sales...
            </Typography>
          </Box>
        ) : sales.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No sales found
            </Typography>
          </Box>
        ) : sales.map(sale => (
          <Paper 
            key={sale._id}
            sx={{
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden'
            }}
          >
            {/* Invoice Header */}
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  👤 Customer: {sale.customer?.name || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  📅 Date: {sale.date ? new Date(sale.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem', fontWeight: 600 }}>
                    Invoice Number
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mt: 0.5 }}>
                    {sale.invoice_number || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Items Table */}
            <TableContainer 
              sx={{ 
                maxHeight: 400,
                '&::-webkit-scrollbar': {
                  width: '10px',
                  height: '10px'
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: 10
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  borderRadius: 10,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)'
                  }
                }
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(21, 101, 192, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#1976d2'
                      }}
                    >
                      Item Name
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(21, 101, 192, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#1976d2'
                      }}
                    >
                      Quantity
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(21, 101, 192, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#1976d2'
                      }}
                    >
                      Price (AED)
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(21, 101, 192, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#1976d2'
                      }}
                    >
                      Total (AED)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items && sale.items.map((row, idx) => (
                    <TableRow 
                      key={idx}
                      sx={{
                        '&:hover': {
                          background: 'linear-gradient(90deg, rgba(25, 118, 210, 0.03) 0%, rgba(21, 101, 192, 0.03) 100%)'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>
                        {row.item?.name || getItemName(row.item?._id || row.item)}
                      </TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(21, 101, 192, 0.15) 100%)',
                            fontWeight: 600,
                            color: '#1976d2'
                          }}
                        >
                          {row.quantity}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#2e7d32' }}>
                        {row.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#d32f2f' }}>
                        {(row.quantity && row.price) ? (Number(row.quantity) * Number(row.price)).toFixed(2) : '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow>
                    <TableCell 
                      colSpan={3} 
                      align="right"
                      sx={{ 
                        background: 'linear-gradient(90deg, rgba(25, 118, 210, 0.15) 0%, rgba(21, 101, 192, 0.2) 100%)',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: '#1a237e',
                        borderTop: '3px solid #1976d2'
                      }}
                    >
                      Invoice Total:
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(90deg, rgba(25, 118, 210, 0.2) 0%, rgba(21, 101, 192, 0.15) 100%)',
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        color: '#d32f2f',
                        borderTop: '3px solid #1976d2'
                      }}
                    >
                      {sale.items && sale.items.reduce((sum, i) => sum + (Number(i.quantity) * (i.price || 0)), 0).toFixed(2)} AED
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Actions Footer */}
            <Box 
              sx={{ 
                p: 2,
                background: '#f8f9fa',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                flexWrap: 'wrap'
              }}
            >
              <Button 
                variant="outlined" 
                startIcon={<PictureAsPdfIcon />}
                onClick={() => handleGeneratePDF(sale)}
                sx={{
                  borderColor: '#d32f2f',
                  color: '#d32f2f',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#b71c1c',
                    background: 'rgba(211, 47, 47, 0.05)'
                  }
                }}
              >
                View PDF
              </Button>
              {hasPerm('sales','edit') && (
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />}
                  onClick={() => handleOpen(sale)}
                  sx={{
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#1565c0',
                      background: 'rgba(25, 118, 210, 0.05)'
                    }
                  }}
                >
                  Edit
                </Button>
              )}
              {hasPerm('sales','delete') && (
                <IconButton 
                  onClick={() => handleDelete(sale._id)}
                  sx={{
                    background: 'rgba(211, 47, 47, 0.1)',
                    '&:hover': {
                      background: 'rgba(211, 47, 47, 0.2)',
                    }
                  }}
                >
                  <DeleteIcon sx={{ color: '#d32f2f' }} />
                </IconButton>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Sale Invoice' : 'Add Sale Invoice'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3, whiteSpace: 'pre-line' }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => option.name || ''}
              value={customers.find(c => c._id === customer) || null}
              onChange={(_, value) => setCustomer(value?._id || '')}
              filterOptions={(options, state) => {
                if (!state.inputValue) return [];
                return options.filter(option => 
                  option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                );
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Customer *" 
                  placeholder="Type to search customer..."
                  helperText="Start typing to search customers"
                  fullWidth
                />
              )}
              fullWidth
              isOptionEqualToValue={(option, value) => option._id === value._id}
              noOptionsText="Type to search customers"
            />
            <TextField
              label="Invoice Number"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              sx={{ width: 200 }}
            />
          </Box>
          {rows.map((row, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Autocomplete
                options={items}
                getOptionLabel={option => option.name || ''}
                value={items.find(i => i._id === row.item) || null}
                onChange={(_, v) => handleRowChange(idx, 'item', v?._id || '')}
                renderInput={params => <TextField {...params} label="Item" fullWidth />}
                sx={{ width: 300 }}
              />
              <TextField
                label="Quantity"
                type="number"
                value={row.quantity}
                onChange={e => handleRowChange(idx, 'quantity', e.target.value)}
                sx={{ width: 120 }}
              />
              <TextField
                label="Price"
                type="number"
                value={row.price}
                onChange={e => handleRowChange(idx, 'price', e.target.value)}
                sx={{ width: 120 }}
              />
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                minWidth: 100, 
                px: 2, 
                py: 1, 
                bgcolor: '#f0f4fa', 
                borderRadius: 1, 
                border: '1px solid #ddd' 
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {(row.quantity && row.price) ? (Number(row.quantity) * Number(row.price)).toFixed(2) : '0.00'}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                minWidth: 80, 
                px: 2, 
                py: 1, 
                bgcolor: '#e8f5e8', 
                borderRadius: 1, 
                border: '1px solid #c8e6c9' 
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                  Stock: {row.item ? getStore2Qty(row.item) : '-'}
                </Typography>
              </Box>
              <Button onClick={() => handleRemoveRow(idx)} color="error" sx={{ minWidth: 40 }}>Remove</Button>
            </Box>
          ))}
          <Button onClick={handleAddRow} sx={{ mt: 1 }}>Add Item</Button>
          
          {/* Invoice Total Display */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #ddd' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'right' }}>
              Invoice Total: {rows.reduce((sum, row) => sum + (Number(row.quantity) * Number(row.price) || 0), 0).toFixed(2)} AED
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {hasPerm('sales','view') && (
            <Button onClick={handleSubmit} variant="contained" color="primary" disabled={saving}>{saving ? 'Saving…' : (editId ? 'Save' : 'Add Invoice')}</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* PDF Share Dialog */}
      <Dialog open={pdfDialog} onClose={() => setPdfDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(145deg, #1976d2, #1565c0)', color: 'white', fontWeight: 700 }}>
          📄 Invoice PDF Options
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Choose how you would like to share or save this invoice:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Preview Button */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={handlePreviewPDF}
              sx={{ 
                py: 2, 
                justifyContent: 'flex-start', 
                px: 3,
                borderColor: '#1976d2',
                '&:hover': { background: '#e3f2fd' }
              }}
            >
              <Box component="span" sx={{ fontSize: '1.5rem', mr: 2 }}>👁️</Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Preview PDF</Typography>
                <Typography variant="caption" color="text.secondary">Open invoice in new tab</Typography>
              </Box>
            </Button>

            {/* WhatsApp Button */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={handleShareWhatsApp}
              sx={{ 
                py: 2, 
                justifyContent: 'flex-start', 
                px: 3,
                borderColor: '#25D366',
                color: '#25D366',
                '&:hover': { background: '#e8f5e9', borderColor: '#25D366' }
              }}
            >
              <Box component="span" sx={{ fontSize: '1.5rem', mr: 2 }}>💬</Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Share via WhatsApp</Typography>
                <Typography variant="caption" color="text.secondary">Send invoice details</Typography>
              </Box>
            </Button>

            {/* Email Button */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={handleShareEmail}
              sx={{ 
                py: 2, 
                justifyContent: 'flex-start', 
                px: 3,
                borderColor: '#EA4335',
                color: '#EA4335',
                '&:hover': { background: '#ffebee', borderColor: '#EA4335' }
              }}
            >
              <Box component="span" sx={{ fontSize: '1.5rem', mr: 2 }}>📧</Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Share via Email</Typography>
                <Typography variant="caption" color="text.secondary">Send invoice via email</Typography>
              </Box>
            </Button>

            {/* Download Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleDownloadPDF}
              sx={{ 
                py: 2, 
                justifyContent: 'flex-start', 
                px: 3,
                background: 'linear-gradient(145deg, #1976d2, #1565c0)',
                '&:hover': { background: 'linear-gradient(145deg, #1565c0, #0d47a1)' }
              }}
            >
              <Box component="span" sx={{ fontSize: '1.5rem', mr: 2 }}>⬇️</Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Download PDF</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>Save to your device</Typography>
              </Box>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
