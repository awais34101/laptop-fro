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
    setSuccess('');
    
    // Validation checks with specific error messages
    if (!supplier || !supplier.trim()) {
      setError('❌ Supplier name is required. Please enter the supplier name before saving.');
      return;
    }
    
    if (!invoiceNumber || !invoiceNumber.trim()) {
      setError('❌ Invoice number is required. Please enter a unique invoice number before saving.');
      return;
    }
    
    if (rows.length === 0) {
      setError('❌ No items added. Please add at least one item to the purchase invoice.');
      return;
    }
    
    const emptyItemRow = rows.find(r => !r.item);
    if (emptyItemRow) {
      setError('❌ Item selection required. Please select an item from the dropdown for all rows.');
      return;
    }
    
    const invalidQtyRow = rows.find(r => !r.quantity || Number(r.quantity) <= 0 || Number.isNaN(Number(r.quantity)));
    if (invalidQtyRow) {
      setError('❌ Invalid quantity. Quantity must be a positive number greater than 0 for all items.');
      return;
    }
    
    const invalidPriceRow = rows.find(r => r.price === '' || Number(r.price) < 0 || Number.isNaN(Number(r.price)));
    if (invalidPriceRow) {
      setError('❌ Invalid price. Price must be a valid number (0 or greater) for all items.');
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
      // Display detailed error from backend or provide helpful message
      const errorMessage = err.response?.data?.error;
      if (errorMessage) {
        setError(errorMessage);
      } else if (err.message.includes('Network')) {
        setError('❌ Network error: Cannot connect to the server. Please check your internet connection and try again.');
      } else if (err.response?.status === 409) {
        setError('❌ Duplicate invoice detected: This invoice number already exists for this supplier. Please use a different invoice number or check if this invoice was already entered.');
      } else if (err.response?.status === 400) {
        setError('❌ Invalid data: Please check all fields and make sure they are filled correctly with valid values.');
      } else {
        setError('❌ Cannot save purchase invoice: An unexpected error occurred. Please try again or contact support if the problem persists.');
      }
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
      const errorMessage = err.response?.data?.error;
      if (errorMessage) {
        setError(errorMessage);
      } else {
        setError('❌ Cannot delete invoice: An error occurred while trying to delete the invoice. Please try again.');
      }
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            Purchase Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage all purchase invoices
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          onClick={() => handleOpen(null)}
          disabled={!items || items.length === 0 || saving}
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 700,
            px: 4,
            py: 1.5,
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          + Add Purchase Invoice
        </Button>
      </Box>

      {/* Pagination Controls */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 2,
          mb: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          p: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Button 
          variant="contained" 
          disabled={loading || page <= 1} 
          onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchPurchases(p); }}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600,
            minWidth: 100,
            '&:disabled': {
              background: '#e0e0e0'
            }
          }}
        >
          Previous
        </Button>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 600,
            px: 3,
            py: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Page {page} of {totalPages}
        </Typography>
        <Button 
          variant="contained" 
          disabled={loading || page >= totalPages} 
          onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchPurchases(p); }}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600,
            minWidth: 100,
            '&:disabled': {
              background: '#e0e0e0'
            }
          }}
        >
          Next
        </Button>
      </Box>

      {/* Main Table */}
      {/* Purchase Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, ml: 2 }}>
              Loading purchases...
            </Typography>
          </Box>
        ) : sortedPurchases.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No purchases found
            </Typography>
          </Box>
        ) : sortedPurchases.map(p => (
          <Paper 
            key={p._id}
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  🏢 Supplier: {p.supplier}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  📅 Date: {new Date(p.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
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
                    {p.invoice_number}
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 10,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                  }
                }
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#667eea'
                      }}
                    >
                      Item Name
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#667eea'
                      }}
                    >
                      Quantity
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#667eea'
                      }}
                    >
                      Price (AED)
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#667eea'
                      }}
                    >
                      Total (AED)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray(p.items) ? p.items : []).map((item, idx) => (
                    <TableRow 
                      key={idx}
                      sx={{
                        '&:hover': {
                          background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>
                        {item.item?.name || getItemName(item.item?._id || item.item)}
                      </TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                            fontWeight: 600,
                            color: '#667eea'
                          }}
                        >
                          {item.quantity}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#2e7d32' }}>
                        {item.price}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#d32f2f' }}>
                        {(item.quantity * item.price).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow>
                    <TableCell 
                      colSpan={3} 
                      align="right"
                      sx={{ 
                        background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.2) 100%)',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: '#1a237e',
                        borderTop: '3px solid #667eea'
                      }}
                    >
                      Invoice Total:
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.15) 100%)',
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        color: '#d32f2f',
                        borderTop: '3px solid #667eea'
                      }}
                    >
                      {(Array.isArray(p.items) ? p.items : []).reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2)} AED
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
                startIcon={<EditIcon />}
                onClick={() => handleOpen(p)}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#764ba2',
                    background: 'rgba(102, 126, 234, 0.05)'
                  }
                }}
              >
                Edit
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => handleViewPDF(p)}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#764ba2',
                    background: 'rgba(102, 126, 234, 0.05)'
                  }
                }}
              >
                View PDF
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => handleDownloadPDF(p)}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#764ba2',
                    background: 'rgba(102, 126, 234, 0.05)'
                  }
                }}
              >
                Download PDF
              </Button>
              {hasPerm('purchases','delete') && (
                <IconButton 
                  onClick={() => handleDelete(p._id)}
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

      {/* Add/Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={saving ? undefined : handleClose} 
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 4,
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            fontWeight: 800,
            fontSize: '1.3rem',
            py: 3,
            textAlign: 'center',
            letterSpacing: '0.5px'
          }}
        >
          {editId ? '✏️ Edit Purchase Invoice' : '➕ Add Purchase Invoice'}
        </DialogTitle>
        <DialogContent 
          onKeyDown={e => { 
            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { 
              e.preventDefault(); 
            } 
          }} 
          sx={{ pt: 3, px: 4 }}
        >
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.95rem',
                border: '2px solid #d32f2f',
                background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(244, 67, 54, 0.15) 100%)',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
              }}
            >
              <Box sx={{ whiteSpace: 'pre-wrap' }}>
                {error}
              </Box>
            </Alert>
          )}
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.95rem',
                border: '2px solid #2e7d32',
                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(76, 175, 80, 0.15) 100%)',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
              }}
            >
              {success}
            </Alert>
          )}
          
          {/* Supplier and Invoice Info */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
              p: 2,
              borderRadius: 3,
              background: 'rgba(102, 126, 234, 0.05)',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}
          >
            <TextField 
              label="Supplier Name" 
              value={supplier} 
              onChange={e => setSupplier(e.target.value)} 
              fullWidth 
              required 
              disabled={saving}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#667eea'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea'
                  }
                }
              }}
            />
            <TextField 
              label="Invoice Number" 
              value={invoiceNumber} 
              onChange={e => setInvoiceNumber(e.target.value)} 
              fullWidth 
              required 
              disabled={saving}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#667eea'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea'
                  }
                }
              }}
            />
          </Box>

          {/* Items Table */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 700,
                      py: 2
                    }}
                  >
                    Item
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 700
                    }}
                  >
                    Quantity
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 700
                    }}
                  >
                    Price
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 700
                    }}
                  >
                    Total
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 700
                    }}
                  >
                    Stock
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }}
                  ></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow 
                    key={idx}
                    sx={{
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.05)'
                      }
                    }}
                  >
                    <TableCell>
                      {/* Use Autocomplete for item selection */}
                      <Box sx={{ minWidth: 250, width: 280 }}>
                        <Autocomplete
                          options={items}
                          getOptionLabel={option => option.name || ''}
                          value={items.find(i => i._id === row.item) || null}
                          onChange={(_, newValue) => handleRowChange(idx, 'item', newValue ? newValue._id : '')}
                          disableClearable
                          disabled={saving}
                          renderInput={params => (
                            <TextField 
                              {...params} 
                              label="Select Item" 
                              fullWidth 
                              required
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2
                                }
                              }}
                            />
                          )}
                          isOptionEqualToValue={(option, value) => option._id === value._id}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 100 }}>
                        <TextField 
                          type="number" 
                          value={row.quantity} 
                          onChange={e => handleRowChange(idx, 'quantity', e.target.value)} 
                          label="Qty" 
                          required 
                          disabled={saving}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 140 }}>
                        <TextField 
                          type="number" 
                          value={row.price} 
                          onChange={e => handleRowChange(idx, 'price', e.target.value)} 
                          label="Price" 
                          required 
                          disabled={saving}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          fontWeight: 700,
                          color: '#d32f2f',
                          fontSize: '1rem'
                        }}
                      >
                        {(row.quantity && row.price) ? (Number(row.quantity) * Number(row.price)).toFixed(2) : '0.00'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          background: row.item && getWarehouseQty(row.item) > 0 
                            ? 'rgba(46, 125, 50, 0.1)' 
                            : 'rgba(211, 47, 47, 0.1)',
                          color: row.item && getWarehouseQty(row.item) > 0 
                            ? '#2e7d32' 
                            : '#d32f2f',
                          fontWeight: 600
                        }}
                      >
                        {row.item ? getWarehouseQty(row.item) : '-'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveRow(idx);
                        }} 
                        color="error" 
                        disabled={rows.length === 1 || saving}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: 2,
                          fontWeight: 600,
                          '&:hover': {
                            background: 'rgba(211, 47, 47, 0.1)'
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Invoice total row */}
                <TableRow>
                  <TableCell 
                    colSpan={3} 
                    align="right"
                    sx={{
                      background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.15) 100%)',
                      fontWeight: 800,
                      fontSize: '1rem',
                      py: 2,
                      borderTop: '2px solid #667eea'
                    }}
                  >
                    Invoice Total
                  </TableCell>
                  <TableCell 
                    colSpan={3} 
                    align="left"
                    sx={{
                      background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      color: '#d32f2f',
                      py: 2,
                      borderTop: '2px solid #667eea'
                    }}
                  >
                    {rows.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.price) || 0), 0).toFixed(2)} AED
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add Item Button */}
          <Button 
            onClick={handleAddRow} 
            disabled={saving}
            variant="outlined"
            sx={{
              borderColor: '#667eea',
              color: '#667eea',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              py: 1,
              '&:hover': {
                borderColor: '#764ba2',
                background: 'rgba(102, 126, 234, 0.05)'
              }
            }}
          >
            + Add Another Item
          </Button>
        </DialogContent>
        
        <DialogActions sx={{ px: 4, py: 3, background: '#f8f9fa' }}>
          <Button 
            onClick={handleClose} 
            disabled={saving}
            sx={{
              fontWeight: 600,
              color: '#666',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress color="inherit" size={18} /> : null}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 700,
              px: 4,
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }
            }}
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
