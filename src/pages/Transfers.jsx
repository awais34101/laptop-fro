import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import TechnicianStatsBox from '../components/TechnicianStatsBox';
import { useInventory } from '../context/InventoryContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import api from '../services/api';
import { getPurchaseSheets } from '../services/sheetsApi';
import { createSheetTransfer } from '../services/sheetsApi';
import { hasPerm } from '../utils/permissions';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Transfers() {
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transfer? This action cannot be undone.')) return;
    try {
      await api.delete(`/transfers/${id}`);
      setSuccess('✅ Transfer deleted successfully');
      fetchTransfers();
      setTimeout(async () => {
        await fetchInventory();
        window.dispatchEvent(new Event('inventoryChanged'));
      }, 200);
    } catch (err) {
      const errorMessage = err.response?.data?.error;
      if (errorMessage) {
        setError(errorMessage);
      } else if (err.response?.status === 404) {
        setError('❌ Transfer not found: The transfer may have been already deleted. Refreshing the list...');
        fetchTransfers();
      } else {
        setError('❌ Cannot delete transfer: An error occurred while trying to delete the transfer. Please try again.');
      }
    }
  };
  const [transfers, setTransfers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentDate, setCurrentDate] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from: 'warehouse', to: 'store', items: [{ item: '', quantity: '' }], technician: '', workType: '' });
  const [sheetOptions, setSheetOptions] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    technician: '',
    from: '',
    to: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const { warehouse, store, store2, items: inventoryItems, fetchInventory } = useInventory();

  // Helper functions to get inventory quantities
  const getWarehouseQty = (itemId) => warehouse.find(w => w.item?._id === itemId)?.quantity ?? 0;
  const getStoreQty = (itemId) => store.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;
  const getStore2Qty = (itemId) => store2.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;

  // Get quantity for specific location
  const getLocationQty = (location, itemId) => {
    switch(location) {
      case 'warehouse': return getWarehouseQty(itemId);
      case 'store': return getStoreQty(itemId);
      case 'store2': return getStore2Qty(itemId);
      default: return 0;
    }
  };

  const PAGE_SIZE = 20;
  const fetchTransfers = async (p = page, currentFilters = filters) => {
    setLoading(true);
    try {
      // Build query params with filters - use groupByDate mode
      const params = new URLSearchParams({
        page: p,
        groupByDate: 'true' // Enable date grouping
      });
      
      if (currentFilters.technician) params.append('technician', currentFilters.technician);
      if (currentFilters.from) params.append('from', currentFilters.from);
      if (currentFilters.to) params.append('to', currentFilters.to);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
      
      const r = await api.get(`/transfers?${params.toString()}`);
      
      if (r.data) {
        setTransfers(r.data.data || []);
        setTotalPages(r.data.totalPages || 1);
        setCurrentDate(r.data.currentDate || null);
        setHasNext(r.data.hasNext || false);
        setHasPrev(r.data.hasPrev || false);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message);
      setTransfers([]);
      setCurrentDate(null);
    } finally {
      setLoading(false);
    }
  };
  const fetchItems = async () => {
    try {
      const r = await api.get('/items');
      setItems(r.data);
    } catch (err) {
      // If the user lacks permission to view items, don't block the page
      setItems([]);
    }
  };

  const fetchTechnicians = () =>
    api.get('/technicians').then(r => setTechnicians(r.data)).catch(() => setTechnicians([]));

  useEffect(() => { 
    fetchTransfers(1); 
    fetchItems(); 
    fetchTechnicians(); 
    fetchInventory(); // Load inventory data on component mount
  }, []);

  const handleOpen = () => {
    setForm({ from: 'warehouse', to: 'store', items: [{ item: '', quantity: '' }], technician: '', workType: '' });
    setSelectedSheetId('');
    setSheetOptions([]);
    setError('');
    setSuccess('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleItemChange = (idx, field, value) => {
    const newItems = form.items.map((it, i) => i === idx ? { ...it, [field]: value } : it);
    setForm(f => ({ ...f, items: newItems }));
  };
  const handleAddItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { item: '', quantity: '' }] }));
  };

  const handleRemoveItem = idx => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Frontend validation checks with specific error messages
    if (form.from === form.to) {
      setError('❌ Cannot create transfer: Source and destination must be different. Please select different locations for \"From\" and \"To\".');
      return;
    }
    
    if (!form.from || !form.to) {
      setError('❌ Both source and destination locations are required. Please select \"From\" and \"To\" locations.');
      return;
    }
    
    if (form.items.length === 0) {
      setError('❌ No items added to transfer. Please add at least one item to the transfer.');
      return;
    }
    
    const emptyItemRow = form.items.find(it => !it.item);
    if (emptyItemRow) {
      setError('❌ Item selection required. Please select an item from the dropdown for all rows.');
      return;
    }
    
    const invalidQtyRow = form.items.find(it => !it.quantity || Number(it.quantity) <= 0 || Number.isNaN(Number(it.quantity)));
    if (invalidQtyRow) {
      setError('❌ Invalid quantity. Quantity must be a positive number greater than 0 for all items.');
      return;
    }
    
    // Check stock availability for each item
    for (const it of form.items) {
      const availableQty = getLocationQty(form.from, it.item);
      const requestedQty = Number(it.quantity);
      if (requestedQty > availableQty) {
        const itemName = items.find(i => i._id === it.item)?.name || 'Unknown Item';
        setError(`❌ Insufficient stock: You are trying to transfer ${requestedQty} units of \"${itemName}\" from ${form.from.toUpperCase()} but only ${availableQty} units are available. Please adjust the quantity.`);
        return;
      }
    }
    
    try {
      setSubmitting(true);
      // If a sheet is selected, use the sheet-specific transfer flow
      if (selectedSheetId) {
        if (form.to === 'warehouse') {
          throw new Error('For sheet transfers, destination cannot be Warehouse');
        }
        const payload = {
          destination: form.to,
          items: form.items
            .filter(it => Number(it.quantity) > 0)
            .map(it => ({ item: it.item, quantity: Number(it.quantity) })),
          workType: form.workType || undefined, // Include workType for sheet transfers
        };
        await createSheetTransfer(selectedSheetId, payload);
        setSuccess('Sheet transfer completed');
      } else {
        const payload = {
          from: form.from,
          to: form.to,
          items: form.items.map(it => ({ item: it.item, quantity: Number(it.quantity) })),
          technician: form.technician,
          workType: form.workType,
        };
        if (form._id) {
          await api.put(`/transfers/${form._id}`, payload);
          setSuccess('Transfer updated');
        } else {
          await api.post('/transfers', payload);
          setSuccess('Transfer completed');
        }
      }
      // Refresh list and inventory, then close dialog
      fetchTransfers();
      setTimeout(async () => {
        await fetchInventory(); // Refresh inventory everywhere
        window.dispatchEvent(new Event('inventoryChanged'));
      }, 200);
      // Reset form and close
      setForm({ from: 'warehouse', to: 'store', items: [{ item: '', quantity: '' }], technician: '', workType: '' });
      setSelectedSheetId('');
      setSheetOptions([]);
      setOpen(false);
    } catch (err) {
      // Display detailed error from backend or provide helpful message
      const errorMessage = err.response?.data?.error;
      if (errorMessage) {
        setError(errorMessage);
      } else if (err.message.includes('Network') || err.message.includes('network')) {
        setError('❌ Network error: Cannot connect to the server. Please check your internet connection and try again.');
      } else if (err.response?.status === 400) {
        setError('❌ Invalid transfer data: Please check all fields and make sure they are filled correctly with valid values.');
      } else if (err.response?.status === 404) {
        setError('❌ Transfer not found: The transfer record may have been deleted. Please refresh the page and try again.');
      } else {
        setError('❌ Cannot complete transfer: An unexpected error occurred. Please try again or contact support if the problem persists.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = t => {
    setForm({
      from: t.from,
      to: t.to,
      items: t.items.map(it => ({ item: it.item?._id || it.item, quantity: it.quantity })),
      technician: t.technician?._id || t.technician || '',
      workType: t.workType || '',
      _id: t._id,
    });
    setError('');
    setSuccess('');
    setOpen(true);
  };

  // Load sheets when technician changes
  useEffect(() => {
    const loadSheets = async () => {
      if (!form.technician) {
        setSheetOptions([]);
        setSelectedSheetId('');
        return;
      }
      try {
        const { data } = await getPurchaseSheets({ technician: form.technician, limit: 100, page: 1 });
        setSheetOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        setSheetOptions([]);
      }
    };
    loadSheets();
  }, [form.technician]);

  // When selecting a sheet, auto-fill items from the sheet with remaining quantities
  const handleSelectSheet = (value) => {
    setSelectedSheetId(value);
    const sheet = sheetOptions.find(s => s._id === value);
    if (!sheet) {
      return;
    }
    const rows = (sheet.items || []).map(it => {
      const pr = (sheet.progress || []).find(p => (p.item?._id || p.item) === (it.item?._id || it.item));
      const purchased = it.quantity || 0;
      const transferred = pr?.transferred || 0;
      const remaining = Math.max(0, purchased - transferred);
      return { item: it.item?._id || it.item, quantity: remaining };
    }).filter(r => r.quantity > 0);
    setForm(f => ({ ...f, from: 'warehouse', to: f.to === 'warehouse' ? 'store' : f.to, items: rows.length ? rows : [{ item: '', quantity: '' }] }));
  };

  // Filter handlers
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchTransfers(1, filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      technician: '',
      from: '',
      to: '',
      startDate: '',
      endDate: ''
    };
    setFilters(clearedFilters);
    setPage(1);
    fetchTransfers(1, clearedFilters);
  };

  // Generate PDF for transfer invoice
  const generateTransferPDF = (transfer) => {
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const items = Array.isArray(transfer.items) ? transfer.items : 
                  (transfer.item && transfer.quantity ? [{ item: transfer.item, quantity: transfer.quantity }] : []);

    let pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Transfer Invoice - ${transfer._id}</title>
  <style>
    @media print {
      @page { margin: 0.5cm; }
      body { margin: 1cm; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
      color: #333;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border: 2px solid #667eea;
      border-radius: 10px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #667eea;
    }
    .header h1 {
      color: #667eea;
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 900;
    }
    .header p {
      color: #666;
      margin: 5px 0;
      font-size: 14px;
    }
    .invoice-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9ff;
      border-radius: 8px;
    }
    .info-block {
      padding: 10px;
    }
    .info-block label {
      font-weight: bold;
      color: #667eea;
      display: block;
      margin-bottom: 5px;
      font-size: 12px;
      text-transform: uppercase;
    }
    .info-block p {
      margin: 0;
      font-size: 16px;
      color: #333;
      font-weight: 600;
    }
    .transfer-route {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin: 30px 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      color: white;
    }
    .location {
      font-size: 20px;
      font-weight: bold;
      padding: 10px 20px;
      background: rgba(255,255,255,0.2);
      border-radius: 8px;
      text-transform: uppercase;
    }
    .arrow {
      font-size: 30px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    th {
      padding: 15px;
      text-align: left;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
    }
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 14px;
    }
    tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    tbody tr:hover {
      background: #f0f4ff;
    }
    .total-row {
      background: #667eea !important;
      color: white;
      font-weight: bold;
      font-size: 16px;
    }
    .total-row td {
      border: none;
      padding: 15px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .print-button {
      text-align: center;
      margin: 20px 0;
    }
    .print-button button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .print-button button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
    @media print {
      .print-button { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>📦 TRANSFER INVOICE</h1>
      <p>PRO CRM - Laptop Business</p>
      <p>Transfer ID: ${transfer._id}</p>
    </div>

    <div class="invoice-info">
      <div class="info-block">
        <label>Transfer Date</label>
        <p>${formatDate(transfer.date)}</p>
      </div>
      <div class="info-block">
        <label>Technician</label>
        <p>${transfer.technician?.name || 'N/A'}</p>
      </div>
      <div class="info-block">
        <label>Work Type</label>
        <p>${transfer.workType || 'N/A'}</p>
      </div>
      <div class="info-block">
        <label>Invoice Generated</label>
        <p>${formatDate(new Date())}</p>
      </div>
    </div>

    <div class="transfer-route">
      <div class="location">${transfer.from}</div>
      <div class="arrow">→</div>
      <div class="location">${transfer.to}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Quantity</th>
          <th style="text-align: right;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(it => `
          <tr>
            <td><strong>${it.item?.name || it.item?.model || it.item || 'Unknown Item'}</strong></td>
            <td style="text-align: center;"><strong>${it.quantity}</strong></td>
            <td style="text-align: right; color: #4caf50;">✓ Transferred</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td><strong>TOTAL QUANTITY</strong></td>
          <td style="text-align: center;"><strong>${items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)}</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p><strong>PRO CRM - Laptop Business Management System</strong></p>
      <p>This is an automatically generated transfer invoice</p>
      <p>Generated on ${formatDate(new Date())} at ${new Date().toLocaleTimeString()}</p>
    </div>

    <div class="print-button">
      <button onclick="window.print()">🖨️ Print Invoice</button>
    </div>
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        p: { xs: 2, md: 4 }
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
            }}>
              <SwapHorizIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 900, 
                  color: '#667eea',
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
              >
                Stock Transfers
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500,
                  mt: 0.5
                }}
              >
                Manage inventory transfers between locations
              </Typography>
            </Box>
          </Box>
          
          {hasPerm('transfers', 'view') && (
            <Button 
              variant="contained" 
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleOpen} 
              sx={{ 
                background: 'white',
                color: '#667eea',
                fontWeight: 700, 
                px: 4, 
                py: 1.5,
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                '&:hover': {
                  background: '#f8f9fa',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              New Transfer
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter Section */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: '20px', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        background: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: showFilters ? 3 : 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FilterListIcon sx={{ color: '#667eea', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
              Advanced Filters
            </Typography>
          </Box>
          <Button 
            variant={showFilters ? "contained" : "outlined"}
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ 
              fontWeight: 600,
              borderRadius: '10px',
              px: 3,
              background: showFilters ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: showFilters ? 'white' : '#667eea',
              borderColor: '#667eea',
              '&:hover': {
                background: showFilters ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : 'rgba(102, 126, 234, 0.05)',
              }
            }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>
        
        {showFilters && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Technician"
                  value={filters.technician}
                  onChange={(e) => handleFilterChange('technician', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Technicians</MenuItem>
                  {technicians.map(t => (
                    <MenuItem key={t._id} value={t._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18, color: '#667eea' }} />
                        {t.name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="From Location"
                  value={filters.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  <MenuItem value="warehouse">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarehouseIcon sx={{ fontSize: 18, color: '#667eea' }} />
                      Warehouse
                    </Box>
                  </MenuItem>
                  <MenuItem value="store">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ fontSize: 18, color: '#667eea' }} />
                      Store
                    </Box>
                  </MenuItem>
                  <MenuItem value="store2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ fontSize: 18, color: '#667eea' }} />
                      Store2
                    </Box>
                  </MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="To Location"
                  value={filters.to}
                  onChange={(e) => handleFilterChange('to', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  <MenuItem value="warehouse">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarehouseIcon sx={{ fontSize: 18, color: '#667eea' }} />
                      Warehouse
                    </Box>
                  </MenuItem>
                  <MenuItem value="store">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ fontSize: 18, color: '#667eea' }} />
                      Store
                    </Box>
                  </MenuItem>
                  <MenuItem value="store2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ fontSize: 18, color: '#667eea' }} />
                      Store2
                    </Box>
                  </MenuItem>
                </TextField>
              </Grid>
            </Grid>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleApplyFilters}
                sx={{ 
                  fontWeight: 600,
                  borderRadius: '10px',
                  px: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  }
                }}
              >
                Apply Filters
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                sx={{ 
                  fontWeight: 600,
                  borderRadius: '10px',
                  px: 4,
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.05)',
                    borderColor: '#667eea',
                  }
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Main Table */}
      <Paper sx={{ 
        borderRadius: '20px', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        background: 'white'
      }}>
        {error && (
          <Alert severity="error" sx={{ m: 3, borderRadius: '12px' }}>{error}</Alert>
        )}
        
        {/* Date Navigation */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 3,
          color: 'white'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <Button 
              variant="contained" 
              disabled={loading || !hasPrev} 
              onClick={() => { 
                const p = Math.max(1, page - 1); 
                setPage(p); 
                fetchTransfers(p); 
              }}
              sx={{ 
                fontWeight: 600, 
                minWidth: 150,
                borderRadius: '12px',
                background: 'white',
                color: '#667eea',
                '&:hover': {
                  background: '#f8f9fa',
                  transform: 'translateX(-5px)',
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.5)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              ← Previous Date
            </Button>
            
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                {currentDate ? new Date(currentDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'No Date'}
              </Typography>
              <Box sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 1.5,
                bgcolor: 'rgba(255,255,255,0.2)',
                px: 2,
                py: 0.5,
                borderRadius: '20px'
              }}>
                <Chip 
                  label={`Day ${page} of ${totalPages}`} 
                  size="small"
                  sx={{ 
                    bgcolor: 'white',
                    color: '#667eea',
                    fontWeight: 700
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.95 }}>
                  {transfers.length} transfer{transfers.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            
            <Button 
              variant="contained" 
              disabled={loading || !hasNext} 
              onClick={() => { 
                const p = Math.min(totalPages, page + 1); 
                setPage(p); 
                fetchTransfers(p); 
              }}
              sx={{ 
                fontWeight: 600, 
                minWidth: 150,
                borderRadius: '12px',
                background: 'white',
                color: '#667eea',
                '&:hover': {
                  background: '#f8f9fa',
                  transform: 'translateX(5px)',
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.5)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Next Date →
            </Button>
          </Box>
        </Box>

        {/* Transfer Invoice Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                Loading transfers...
              </Typography>
            </Box>
          ) : transfers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                No transfers found
              </Typography>
            </Box>
          ) : (
            transfers.map((t, index) => (
              <Paper 
                key={t._id}
                sx={{
                  borderRadius: 4,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  overflow: 'hidden'
                }}
              >
                {/* Transfer Invoice Header */}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SwapHorizIcon /> Transfer: {t.from} → {t.to}
                      </Typography>
                      {t.technician?.name && (
                        <Chip
                          icon={<PersonIcon />}
                          label={t.technician.name}
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.25)',
                            color: 'white',
                            fontWeight: 600,
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                            border: '1px solid'
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                      📅 Date: {new Date(t.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{ 
                        display: 'inline-block',
                        px: 3,
                        py: 1.5,
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.4)'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', fontWeight: 600 }}>
                        Transfer Number
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>
                        #{t._id ? t._id.slice(-6).toUpperCase() : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Transfer Details */}
                <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 600 }}>
                          From Location
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, textTransform: 'capitalize' }}>
                          {t.from === 'warehouse' ? <WarehouseIcon /> : <StorefrontIcon />}
                          {t.from}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#388e3c', fontWeight: 600 }}>
                          To Location
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#388e3c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, textTransform: 'capitalize' }}>
                          {t.to === 'warehouse' ? <WarehouseIcon /> : <StorefrontIcon />}
                          {t.to}
                        </Typography>
                      </Paper>
                    </Grid>
                    {t.workType && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: t.workType === 'repair' ? '#ffebee' : '#f3e5f5', borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: t.workType === 'repair' ? '#c62828' : '#6a1b9a', fontWeight: 600 }}>
                            Work Type
                          </Typography>
                          <Typography variant="h6" sx={{ color: t.workType === 'repair' ? '#c62828' : '#6a1b9a', fontWeight: 700, textTransform: 'capitalize' }}>
                            {t.workType}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 600 }}>
                          Total Items
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#e65100', fontWeight: 700 }}>
                          {Array.isArray(t.items) && t.items.length > 0
                            ? t.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
                            : t.quantity || 0} pcs
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                {/* Items Table */}
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          py: 2
                        }}>
                          Item Name
                        </TableCell>
                        <TableCell sx={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontWeight: 800,
                          py: 2
                        }}>
                          Quantity
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(t.items) && t.items.length > 0 ? (
                        t.items.map((it, idx) => (
                          <TableRow 
                            key={idx}
                            sx={{
                              '&:nth-of-type(odd)': { bgcolor: '#f9fafb' },
                              '&:hover': { 
                                bgcolor: '#f0f4ff'
                              }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>
                              {it.item?.name || it.item?.model || it.item?.toString?.()}
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
                                {it.quantity}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : t.item && t.quantity ? (
                        <TableRow sx={{ '&:hover': { bgcolor: '#f0f4ff' } }}>
                          <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>
                            {t.item?.name || t.item?.model || t.item?.toString?.()}
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
                              {t.quantity}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            No items
                          </TableCell>
                        </TableRow>
                      )}
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
                  <Tooltip title="View Transfer">
                    <IconButton
                      sx={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        '&:hover': {
                          background: 'rgba(102, 126, 234, 0.2)',
                        }
                      }}
                    >
                      <VisibilityIcon sx={{ color: '#667eea' }} />
                    </IconButton>
                  </Tooltip>
                  {hasPerm('transfers','edit') && (
                    <Tooltip title="Edit Transfer">
                      <IconButton 
                        onClick={() => handleEdit(t)}
                        sx={{
                          background: 'rgba(25, 118, 210, 0.1)',
                          '&:hover': {
                            background: 'rgba(25, 118, 210, 0.2)',
                          }
                        }}
                      >
                        <EditIcon sx={{ color: '#1976d2' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {hasPerm('transfers','delete') && (
                    <Tooltip title="Delete Transfer">
                      <IconButton 
                        onClick={() => handleDelete(t._id)}
                        sx={{
                          background: 'rgba(211, 47, 47, 0.1)',
                          '&:hover': {
                            background: 'rgba(211, 47, 47, 0.2)',
                          }
                        }}
                      >
                        <DeleteOutlineIcon sx={{ color: '#d32f2f' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {hasPerm('transfers','view') && (
                    <Tooltip title="Generate PDF">
                      <IconButton
                        onClick={() => generateTransferPDF(t)}
                        sx={{
                          background: 'rgba(211, 47, 47, 0.1)',
                          '&:hover': {
                            background: 'rgba(211, 47, 47, 0.2)',
                          }
                        }}
                      >
                        <PictureAsPdfIcon sx={{ color: '#d32f2f' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Paper>
            ))
          )}
        </Box>
      </Paper>
      

  <Dialog 
    open={open} 
    onClose={handleClose} 
    maxWidth="lg" 
    fullWidth
    sx={{
      '& .MuiDialog-paper': {
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }
    }}
  >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          fontWeight: 800,
          fontSize: '1.5rem',
          textAlign: 'center',
          py: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}>
          <SwapHorizIcon sx={{ fontSize: 32 }} />
          {form._id ? 'Edit Transfer' : 'Create New Transfer'}
        </DialogTitle>
        <DialogContent sx={{ mt: 3, px: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: '12px',
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
                borderRadius: '12px',
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
          
          {/* From/To Section */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)',
            border: '2px solid #e8eaf6'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
              Transfer Route
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField 
                  select 
                  label="From Location" 
                  name="from" 
                  value={form.from} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'white',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                >
                  <MenuItem value="warehouse">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarehouseIcon sx={{ color: '#667eea' }} />
                      Warehouse
                    </Box>
                  </MenuItem>
                  <MenuItem value="store">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ color: '#667eea' }} />
                      Store
                    </Box>
                  </MenuItem>
                  <MenuItem value="store2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ color: '#667eea' }} />
                      Store2
                    </Box>
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  select 
                  label="To Location" 
                  name="to" 
                  value={form.to} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'white',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                >
                  <MenuItem value="warehouse">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarehouseIcon sx={{ color: '#667eea' }} />
                      Warehouse
                    </Box>
                  </MenuItem>
                  <MenuItem value="store">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ color: '#667eea' }} />
                      Store
                    </Box>
                  </MenuItem>
                  <MenuItem value="store2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon sx={{ color: '#667eea' }} />
                      Store2
                    </Box>
                  </MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Technician & Sheet Selection */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #fff9f0 0%, #fff 100%)',
            border: '2px solid #ffe0b2'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#fb8c00' }}>
              Assignment Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField 
                  select 
                  label="Technician" 
                  name="technician" 
                  value={form.technician} 
                  onChange={handleChange} 
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'white',
                      '&:hover fieldset': {
                        borderColor: '#fb8c00',
                      },
                    },
                  }}
                >
                  <MenuItem value="">Select Technician</MenuItem>
                  {technicians.map(t => (
                    <MenuItem key={t._id} value={t._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ color: '#fb8c00', fontSize: 20 }} />
                        {t.name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  select 
                  label="Work Type" 
                  name="workType" 
                  value={form.workType} 
                  onChange={handleChange} 
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'white',
                      '&:hover fieldset': {
                        borderColor: '#fb8c00',
                      },
                    },
                  }}
                >
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="repair">Repair</MenuItem>
                  <MenuItem value="test">Test</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <TextField
                select
                label="Sheet (Optional)"
                value={selectedSheetId}
                onChange={(e) => handleSelectSheet(e.target.value)}
                fullWidth
                disabled={!form.technician}
                helperText={form.technician ? 'Link this transfer to a purchase sheet' : 'Select a technician first to view available sheets'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#fb8c00',
                    },
                  },
                }}
              >
                <MenuItem value="">No Sheet (Regular Transfer)</MenuItem>
                {sheetOptions.map(s => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.invoice_number} • {new Date(s.date).toLocaleDateString()} 
                    {s.assignment?.status ? ` • ${s.assignment.status}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Paper>

          {/* Items Section */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f0fff4 0%, #fff 100%)',
            border: '2px solid #c8e6c9'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#388e3c' }}>
                Transfer Items
              </Typography>
              <Button 
                onClick={handleAddItem} 
                startIcon={<AddCircleOutlineIcon />}
                sx={{ 
                  fontWeight: 600,
                  borderRadius: '10px',
                  color: '#388e3c',
                  borderColor: '#388e3c',
                  '&:hover': {
                    background: 'rgba(56, 142, 60, 0.05)',
                    borderColor: '#2e7d32',
                  }
                }}
                variant="outlined"
              >
                Add Item
              </Button>
            </Box>
            
            {form.items.map((it, idx) => {
              const selectedItem = items.find(i => i._id === it.item);
              const fromQty = form.from ? getLocationQty(form.from, it.item) : 0;
              const toQty = form.to ? getLocationQty(form.to, it.item) : 0;
              
              return (
              <Card 
                key={idx} 
                sx={{ 
                  mb: 2,
                  borderRadius: '12px',
                  border: '2px solid #e8f5e9',
                  boxShadow: '0 2px 8px rgba(56, 142, 60, 0.1)',
                  overflow: 'hidden'
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={items}
                        getOptionLabel={option => option.name || ''}
                        value={items.find(i => i._id === it.item) || null}
                        onChange={(_, newValue) => handleItemChange(idx, 'item', newValue ? newValue._id : '')}
                        renderInput={params => (
                          <TextField 
                            {...params} 
                            label="Select Item" 
                            required
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                              },
                            }}
                          />
                        )}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField 
                        label="Quantity" 
                        value={it.quantity} 
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)} 
                        type="number" 
                        fullWidth 
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Tooltip title="Remove Item">
                        <IconButton 
                          onClick={() => handleRemoveItem(idx)} 
                          sx={{
                            bgcolor: '#ffebee',
                            color: '#c62828',
                            width: '100%',
                            borderRadius: '10px',
                            '&:hover': {
                              bgcolor: '#c62828',
                              color: 'white',
                            }
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                  
                  {/* Inventory Display */}
                  {selectedItem && (form.from || form.to) && (
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2,
                      flexWrap: 'wrap',
                      mt: 2,
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: '10px',
                      border: '1px solid #e0e0e0'
                    }}>
                      {form.from && (
                        <Chip
                          icon={<WarehouseIcon />}
                          label={`From ${form.from.charAt(0).toUpperCase() + form.from.slice(1)}: ${fromQty} available`}
                          sx={{
                            bgcolor: '#e3f2fd',
                            color: '#1976d2',
                            fontWeight: 700,
                            py: 2.5,
                            px: 1
                          }}
                        />
                      )}
                      
                      {form.to && (
                        <Chip
                          icon={<StorefrontIcon />}
                          label={`To ${form.to.charAt(0).toUpperCase() + form.to.slice(1)}: ${toQty} current`}
                          sx={{
                            bgcolor: '#e8f5e9',
                            color: '#388e3c',
                            fontWeight: 700,
                            py: 2.5,
                            px: 1
                          }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          background: '#f8f9fa',
          gap: 2
        }}>
          <Button 
            onClick={handleClose} 
            disabled={submitting}
            sx={{
              fontWeight: 600,
              borderRadius: '10px',
              px: 4,
              color: '#666',
              '&:hover': {
                background: '#e0e0e0',
              }
            }}
          >
            Cancel
          </Button>
          {(
            (!form._id && hasPerm('transfers','view')) || (form._id && hasPerm('transfers','edit'))
          ) && (
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={submitting}
              sx={{
                fontWeight: 700,
                borderRadius: '10px',
                px: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
                '&:disabled': {
                  background: '#ccc',
                }
              }}
            >
              {submitting ? 'Processing...' : form._id ? 'Update Transfer' : 'Create Transfer'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
