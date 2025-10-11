import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useInventory } from '../context/InventoryContext';
import { hasPerm } from '../utils/permissions';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Tooltip } from '@mui/material';
import { FileDownload as DownloadIcon, PictureAsPdf as PdfIcon, TableChart as ExcelIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Items() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', unit: '', category: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { warehouse, store, store2, fetchInventory } = useInventory();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const r = await api.get('/items');
      setItems(Array.isArray(r.data) ? r.data : (r.data?.data || []));
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchItems(); fetchInventory(); }, [fetchInventory]);

  const handleOpen = (item) => {
    if (item) {
      setForm({ name: item.name, unit: item.unit, category: item.category });
      setEditId(item._id);
    } else {
      setForm({ name: '', unit: '', category: '' });
      setEditId(null);
    }
    setError('');
    setSuccess('');
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/items/${editId}`, form);
        setSuccess('Item updated');
      } else {
        await api.post('/items', form);
        setSuccess('Item added');
      }
      
      // Refresh items to auto-update category list
      await fetchItems();
      fetchInventory();
      
      // Clear category filter if the new/edited item doesn't match current filter
      if (categoryFilter && form.category !== categoryFilter) {
        setCategoryFilter('');
      }
      
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      fetchItems();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  // Helper functions to get stock for each item
  const getWarehouseQty = (itemId) => warehouse.find(w => w.item?._id === itemId)?.quantity ?? 0;
  const getStoreQty = (itemId) => store.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;
  const getStore2Qty = (itemId) => store2.find(s => s.item?._id === itemId)?.remaining_quantity ?? 0;
  // Get unique categories for filter dropdown - Auto-updates when new categories are added
  const uniqueCategories = React.useMemo(() => {
    return [...new Set(items.map(item => item.category?.trim()).filter(Boolean))].sort();
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         item.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredItems.map(item => ({
      'Item Name': item.name,
      'Category': item.category || '-',
      'Unit': item.unit,
      'Warehouse Stock': getWarehouseQty(item._id),
      'Store 1 Stock': getStoreQty(item._id),
      'Store 2 Stock': getStore2Qty(item._id),
      'Total Stock': getWarehouseQty(item._id) + getStoreQty(item._id) + getStore2Qty(item._id)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Item Name
      { wch: 15 }, // Category
      { wch: 10 }, // Unit
      { wch: 15 }, // Warehouse
      { wch: 15 }, // Store 1
      { wch: 15 }, // Store 2
      { wch: 15 }  // Total
    ];
    
    XLSX.writeFile(wb, `items-list-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Items List', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    
    // Add summary
    doc.text(`Total Items: ${filteredItems.length}`, 14, 35);
    
    // Prepare table data
    const tableData = filteredItems.map(item => [
      item.name,
      item.category || '-',
      item.unit,
      getWarehouseQty(item._id),
      getStoreQty(item._id),
      getStore2Qty(item._id),
      getWarehouseQty(item._id) + getStoreQty(item._id) + getStore2Qty(item._id)
    ]);
    
    // Add table using autoTable
    autoTable(doc, {
      head: [['Item Name', 'Category', 'Unit', 'Warehouse', 'Store 1', 'Store 2', 'Total']],
      body: tableData,
      startY: 42,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [25, 118, 210], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25, fontStyle: 'bold' }
      }
    });
    
    // Open PDF in new tab for preview instead of direct download
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 50%, #f3e5f5 100%)', 
      minHeight: '100vh',
      p: { xs: 2, sm: 3, md: 4 }
    }}>
      {/* Header Section with Modern Design */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3
        }}>
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
                mb: 0.5
              }}
            >
              📦 Items Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Manage your inventory items and track stock levels across all locations
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Tooltip title="Export to Excel">
              <Button
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={handleExportExcel}
                sx={{
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  borderColor: '#10b981',
                  color: '#10b981',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#059669',
                    background: 'rgba(16, 185, 129, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                  },
                  transition: 'all 0.3s'
                }}
              >
                Excel
              </Button>
            </Tooltip>
            
            <Tooltip title="Export to PDF">
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={handleExportPDF}
                sx={{
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#dc2626',
                    background: 'rgba(239, 68, 68, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                  },
                  transition: 'all 0.3s'
                }}
              >
                PDF
              </Button>
            </Tooltip>

            {hasPerm('items','edit') && (
              <Button 
                variant="contained" 
                onClick={() => handleOpen()} 
                sx={{ 
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                    boxShadow: '0 12px 32px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                ➕ Add New Item
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(211, 47, 47, 0.15)',
              border: '1px solid #ffcdd2',
              '& .MuiAlert-icon': {
                fontSize: 28
              }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
            px: 4, 
            py: 2.5, 
            borderRadius: 4, 
            border: '2px solid #e2e8f0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            minWidth: 280
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                📊
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                  Displaying Items
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                  <Box component="span" sx={{ color: '#1976d2' }}>{filteredItems.length}</Box>
                  <Box component="span" sx={{ fontSize: '1rem', color: '#94a3b8', mx: 1 }}>/</Box>
                  <Box component="span" sx={{ fontSize: '1.2rem', color: '#64748b' }}>{items.length}</Box>
                </Typography>
              </Box>
            </Box>
          </Box>
          
          
          {categoryFilter && (
            <Chip 
              label={`📂 ${categoryFilter.toLowerCase()}`}
              onDelete={() => setCategoryFilter('')}
              sx={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
                color: '#1e40af',
                fontWeight: 700,
                fontSize: '0.95rem',
                height: 42,
                borderRadius: 4,
                px: 2,
                border: '2px solid #bfdbfe',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
                '& .MuiChip-deleteIcon': {
                  color: '#3b82f6',
                  fontSize: '22px',
                  '&:hover': {
                    color: '#1e40af',
                    transform: 'scale(1.2)'
                  }
                }
              }}
            />
          )}
        </Box>
      </Box>

      {/* Filters and Search Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: 4,
        p: 3,
        mb: 4,
        border: '2px solid #e2e8f0',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          🔍 Search & Filter
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Search Items"
            placeholder="Search by name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="medium"
            sx={{ 
              flex: 1,
              minWidth: 320, 
              '& .MuiOutlinedInput-root': {
                background: '#ffffff',
                borderRadius: 3,
                fontSize: '1rem',
                fontWeight: 500,
                '& fieldset': {
                  borderColor: '#cbd5e1',
                  borderWidth: 2
                },
                '&:hover fieldset': {
                  borderColor: '#94a3b8'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                fontWeight: 600,
                fontSize: '1rem',
                '&.Mui-focused': {
                  color: '#1976d2'
                }
              }
            }}
          />
          
          <FormControl 
            size="medium" 
            sx={{ 
              minWidth: 280, 
              background: 'linear-gradient(145deg, #ffffff, #f8fafc)', 
              borderRadius: 3, 
              boxShadow: '0 4px 16px rgba(25, 118, 210, 0.1)', 
              border: '2px solid #e2e8f0',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              }
            }}
          >
            <InputLabel 
              sx={{ 
                color: '#64748b', 
                fontWeight: 700, 
                fontSize: '1rem',
                '&.Mui-focused': { 
                  color: '#1976d2' 
                } 
              }}
            >
              Filter by Category
            </InputLabel>
            <Select
              value={categoryFilter}
              label="Filter by Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ 
                borderRadius: 3,
                fontWeight: 600,
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid #1976d2' }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 4,
                    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
                    border: '2px solid #e2e8f0',
                    mt: 1.5,
                    maxHeight: 480,
                    '& .MuiMenuItem-root': {
                      borderRadius: 3,
                      mx: 1.5,
                      my: 0.75,
                      minHeight: 56,
                      fontSize: '1rem',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        transform: 'translateX(6px)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                      },
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        color: '#1e40af',
                        fontWeight: 700,
                        border: '2px solid #93c5fd',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)'
                        }
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="" sx={{ borderBottom: '2px solid #e2e8f0', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, width: '100%' }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 3, 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                  }}>
                    🗂️
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>All Categories</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Show all {items.length} items</Typography>
                  </Box>
                </Box>
              </MenuItem>
              {uniqueCategories.map((category) => {
                const categoryCount = items.filter(item => item.category === category).length;
                // Smart icon detection - automatically assigns icons for new categories
                const getCategoryIcon = (categoryName) => {
                  const name = categoryName.toUpperCase();
                  
                  // Exact matches first
                  const exactMatches = {
                    'IPADS': '📱', 'IPAD': '📱', 'TABLET': '📱',
                    'LAPTOP': '💻', 'LAPT': '💻', 'NOTEBOOK': '💻',
                    'MAC': '🖥️', 'MACBOOK': '💻', 'IMAC': '🖥️',
                    'SURF': '💻', 'SURFACE': '💻',
                    'BOOK': '📚', 'CHROMEBOOK': '💻',
                    'CABLE': '🔌', 'CBL': '🔌', 'WIRE': '🔌',
                    'CHRG': '⚡', 'CHARGING': '⚡', 'CHARGER': '⚡',
                    'ADAPTER': '🔌', 'ADP': '🔌', 'AD': '🔌',
                    'MOUSE': '🖱️', 'MICE': '🖱️',
                    'KEYBOARD': '⌨️', 'KB': '⌨️',
                    'MONITOR': '🖥️', 'SCREEN': '🖥️', 'DISPLAY': '🖥️',
                    'REPAIR': '🔧', 'REPAIRING': '🔧', 'SERVICE': '🔧',
                    'PARTS': '⚙️', 'COMPONENT': '🔩', 'SPARE': '⚙️'
                  };
                  
                  if (exactMatches[name]) return exactMatches[name];
                  
                  // Pattern matching for new categories
                  if (name.includes('PHONE') || name.includes('MOBILE')) return '📱';
                  if (name.includes('COMPUTER') || name.includes('PC')) return '💻';
                  if (name.includes('POWER') || name.includes('BATTERY')) return '🔋';
                  if (name.includes('AUDIO') || name.includes('SOUND') || name.includes('SPEAKER')) return '🔊';
                  if (name.includes('VIDEO') || name.includes('CAMERA')) return '📹';
                  if (name.includes('STORAGE') || name.includes('DRIVE') || name.includes('HDD') || name.includes('SSD')) return '💾';
                  if (name.includes('MEMORY') || name.includes('RAM')) return '🧠';
                  if (name.includes('NETWORK') || name.includes('WIFI') || name.includes('ETHERNET')) return '🌐';
                  if (name.includes('PRINTER') || name.includes('PRINT')) return '🖨️';
                  if (name.includes('ACCESSORY') || name.includes('ACCESSORIES')) return '🎯';
                  if (name.includes('TOOL') || name.includes('EQUIPMENT')) return '🔧';
                  if (name.includes('SOFTWARE') || name.includes('LICENSE')) return '💿';
                  if (name.includes('CASE') || name.includes('COVER') || name.includes('SLEEVE')) return '💼';
                  
                  // Default for unknown categories
                  return '📦';
                };
                
                const categoryIcon = getCategoryIcon(category);
                
                return (
                  <MenuItem key={category} value={category}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, width: '100%' }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 3, 
                        background: `linear-gradient(135deg, ${categoryFilter === category ? '#dbeafe' : '#f1f5f9'}, ${categoryFilter === category ? '#bfdbfe' : '#e2e8f0'})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}>
                        {categoryIcon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', textTransform: 'capitalize' }}>
                          {category.toLowerCase()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                          {categoryCount} {categoryCount === 1 ? 'item' : 'items'}
                        </Typography>
                      </Box>
                      <Chip 
                        label={categoryCount}
                        size="small"
                        sx={{ 
                          background: categoryFilter === category ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                          color: 'white',
                          fontWeight: 700,
                          minWidth: 32,
                          height: 28,
                          fontSize: '0.8rem',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }}
                      />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          
          {categoryFilter && (
            <Button
              variant="outlined"
              size="medium"
              onClick={() => setCategoryFilter('')}
              sx={{ 
                borderRadius: 3, 
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                py: 1.5,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                borderColor: '#fca5a5',
                borderWidth: 2,
                color: '#dc2626',
                '&:hover': {
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  borderColor: '#f87171',
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(220, 38, 38, 0.25)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              ✕ Clear Filter
            </Button>
          )}
        </Box>
      </Box>

      {/* Data Table Section */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 4, 
          boxShadow: '0 12px 48px rgba(25, 118, 210, 0.12)',
          overflow: 'hidden',
          border: '2px solid #e2e8f0'
        }}
      >
        <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table 
            stickyHeader
            sx={{ 
              minWidth: 1200,
              '& .MuiTableCell-root': {
                fontSize: '0.95rem'
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    py: 2.5,
                    borderBottom: '3px solid #0d47a1',
                    minWidth: 220,
                    maxWidth: 320,
                    position: 'sticky',
                    top: 0,
                    zIndex: 100
                  }}
                >
                  📝 Item Name
                </TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>📏 Unit</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>🏷️ Category</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>💰 Avg Price</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>🏪 Store</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>🏬 Store 2</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>🏭 Warehouse</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>📊 Total Qty</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>💵 Total Value</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>🛒 Sales</TableCell>
                <TableCell sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 2.5, borderBottom: '3px solid #0d47a1', position: 'sticky', top: 0, zIndex: 100 }}>⚙️ Actions</TableCell>
              </TableRow>
              </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', py: 6 }}>
                      <CircularProgress size={32} thickness={4} />
                      <Typography sx={{ fontWeight: 600, color: '#64748b', fontSize: '1.1rem' }}>Loading items...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Box sx={{ py: 8 }}>
                      <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 600, mb: 1 }}>
                        📭 No items found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                        {search || categoryFilter ? 'Try adjusting your filters' : 'Add your first item to get started'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredItems.map((item, index) => {
                const warehouseQty = getWarehouseQty(item._id);
                const storeQty = getStoreQty(item._id);
                const store2Qty = getStore2Qty(item._id);
                const totalQty = warehouseQty + storeQty + store2Qty;
                const avgPrice = item.average_price || 0;
                const totalValue = totalQty * avgPrice;
                return (
                  <TableRow 
                    key={item._id} 
                    sx={{ 
                      background: index % 2 === 0 ? '#ffffff' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
                        transform: 'scale(1.001)',
                        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.15)'
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        whiteSpace: 'nowrap', 
                        maxWidth: 320, 
                        minWidth: 220, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: '0.95rem',
                        py: 2.5
                      }}
                    >
                      {item.name}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2.5 }}>{item.unit}</TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Chip 
                        label={item.category} 
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                          color: '#0369a1',
                          border: '1px solid #7dd3fc',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem', py: 2.5 }}>
                      ${avgPrice.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6366f1', py: 2.5 }}>{storeQty}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#8b5cf6', py: 2.5 }}>{store2Qty}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#f59e0b', py: 2.5 }}>{warehouseQty}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#1976d2', fontSize: '1rem', py: 2.5 }}>{totalQty}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#16a34a', fontSize: '1rem', py: 2.5 }}>
                      ${totalValue.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b', py: 2.5 }}>{item.sale_count}</TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {hasPerm('items','edit') && (
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleOpen(item)}
                            sx={{ 
                              fontWeight: 700,
                              borderRadius: 2.5,
                              px: 2.5,
                              textTransform: 'none',
                              borderWidth: 2,
                              borderColor: '#3b82f6',
                              color: '#3b82f6',
                              '&:hover': {
                                borderWidth: 2,
                                borderColor: '#2563eb',
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            ✏️ Edit
                          </Button>
                        )}
                        {hasPerm('items','delete') && (
                          <Button 
                            size="small" 
                            variant="contained"
                            color="error"
                            onClick={() => handleDelete(item._id)}
                            sx={{ 
                              fontWeight: 700,
                              borderRadius: 2.5,
                              px: 2.5,
                              textTransform: 'none',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            🗑️ Delete
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {/* Enhanced Summary Row */}
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                  color: '#1e293b',
                  fontSize: '1.05rem',
                  py: 3,
                  borderTop: '3px solid #1976d2',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10
                }}
              >
                📊 TOTALS
              </TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderTop: '3px solid #1976d2', position: 'sticky', bottom: 0, zIndex: 10 }} />
              <TableCell sx={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderTop: '3px solid #1976d2', position: 'sticky', bottom: 0, zIndex: 10 }} />
              <TableCell sx={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderTop: '3px solid #1976d2', position: 'sticky', bottom: 0, zIndex: 10 }} />
              {/* Store Inventory Total */}
              <TableCell 
                sx={{ 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                  color: '#6366f1',
                  fontSize: '1.05rem',
                  py: 3,
                  borderTop: '3px solid #1976d2',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10
                }}
              >
                {filteredItems.reduce((sum, item) => sum + getStoreQty(item._id), 0)}
              </TableCell>
              {/* Store2 Inventory Total */}
              <TableCell 
                sx={{ 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                  color: '#8b5cf6',
                  fontSize: '1.05rem',
                  py: 3,
                  borderTop: '3px solid #1976d2',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10
                }}
              >
                {filteredItems.reduce((sum, item) => sum + getStore2Qty(item._id), 0)}
              </TableCell>
              {/* Warehouse Inventory Total */}
              <TableCell 
                sx={{ 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                  color: '#f59e0b',
                  fontSize: '1.05rem',
                  py: 3,
                  borderTop: '3px solid #1976d2',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10
                }}
              >
                {filteredItems.reduce((sum, item) => sum + getWarehouseQty(item._id), 0)}
              </TableCell>
              {/* Total Inventory */}
              <TableCell 
                sx={{ 
                  fontWeight: 900, 
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
                  color: '#1e40af',
                  fontSize: '1.15rem',
                  py: 3,
                  borderTop: '3px solid #1976d2',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10,
                  border: '2px solid #93c5fd'
                }}
              >
                {filteredItems.reduce((sum, item) => {
                  const totalQty = getWarehouseQty(item._id) + getStoreQty(item._id) + getStore2Qty(item._id);
                  return sum + totalQty;
                }, 0)}
              </TableCell>
              {/* Total Value */}
              <TableCell 
                sx={{ 
                  fontWeight: 900, 
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
                  color: '#065f46',
                  fontSize: '1.15rem',
                  py: 3,
                  borderTop: '3px solid #1976d2',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10,
                  border: '2px solid #6ee7b7'
                }}
              >
                ${filteredItems.reduce((sum, item) => {
                  const totalQty = getWarehouseQty(item._id) + getStoreQty(item._id) + getStore2Qty(item._id);
                  const avgPrice = item.average_price || 0;
                  return sum + totalQty * avgPrice;
                }, 0).toFixed(2)}
              </TableCell>
              <TableCell sx={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderTop: '3px solid #1976d2', position: 'sticky', bottom: 0, zIndex: 10 }} />
              <TableCell sx={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderTop: '3px solid #1976d2', position: 'sticky', bottom: 0, zIndex: 10 }} />
            </TableRow>
          </Table>
        </Box>
      </TableContainer>

      {/* Enhanced Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
            border: '2px solid #e2e8f0'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.5rem',
            py: 3,
            borderBottom: '3px solid #0d47a1'
          }}
        >
          {editId ? '✏️ Edit Item' : '➕ Add New Item'}
        </DialogTitle>
        <DialogContent sx={{ mt: 3, px: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 3,
                fontWeight: 600,
                border: '2px solid #fca5a5'
              }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                borderRadius: 3,
                fontWeight: 600,
                border: '2px solid #86efac'
              }}
            >
              {success}
            </Alert>
          )}
          <TextField 
            margin="dense" 
            label="Item Name" 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            fullWidth 
            required
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                fontSize: '1rem',
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: '#cbd5e1'
                },
                '&:hover fieldset': {
                  borderColor: '#94a3b8'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                fontWeight: 600,
                '&.Mui-focused': {
                  color: '#1976d2',
                  fontWeight: 700
                }
              }
            }}
          />
          <TextField 
            margin="dense" 
            label="Unit" 
            name="unit" 
            value={form.unit} 
            onChange={handleChange} 
            fullWidth 
            required
            placeholder="e.g., pcs, kg, liter"
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                fontSize: '1rem',
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: '#cbd5e1'
                },
                '&:hover fieldset': {
                  borderColor: '#94a3b8'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                fontWeight: 600,
                '&.Mui-focused': {
                  color: '#1976d2',
                  fontWeight: 700
                }
              }
            }}
          />
          <TextField 
            margin="dense" 
            label="Category" 
            name="category" 
            value={form.category} 
            onChange={handleChange} 
            fullWidth 
            required
            placeholder="e.g., Laptop, iPad, Charger"
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                fontSize: '1rem',
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: '#cbd5e1'
                },
                '&:hover fieldset': {
                  borderColor: '#94a3b8'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: 2
                }
              },
              '& .MuiInputLabel-root': {
                fontWeight: 600,
                '&.Mui-focused': {
                  color: '#1976d2',
                  fontWeight: 700
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
          <Button 
            onClick={handleClose}
            sx={{
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              color: '#64748b',
              '&:hover': {
                background: '#f1f5f9',
                color: '#475569'
              }
            }}
          >
            Cancel
          </Button>
          {hasPerm('items','edit') && (
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              sx={{
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                  boxShadow: '0 12px 32px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {editId ? '💾 Update Item' : '➕ Add Item'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
