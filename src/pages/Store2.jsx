import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, TextField, CircularProgress, Alert, Grid, Card, CardContent, Chip, InputAdornment,
  IconButton, Tooltip, LinearProgress, alpha, TableSortLabel, Badge, Button, Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Store as StoreIcon,
  Storefront as StorefrontIcon,
  TrendingDown as SlowMovingIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as InStockIcon,
  Inventory as InventoryIcon,
  Speed as SpeedIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  ViewInAr as BoxIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Store2() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [slowMoving, setSlowMoving] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out, slow
  const [expandedRows, setExpandedRows] = useState({});
  const [lowStockThreshold, setLowStockThreshold] = useState(3);

  useEffect(() => {
    loadInventory();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data) {
        setLowStockThreshold(response.data.low_stock_threshold_store2 || 3);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const [inv, alerts] = await Promise.all([
        api.get('/store2'),
        api.get('/alerts/slow-moving')
      ]);
      setInventory(Array.isArray(inv.data) ? inv.data : (inv.data?.data || []));
      setSlowMoving(alerts.data.store2 || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load store2 inventory');
    } finally {
      setLoading(false);
    }
  };

  // Toggle row expansion for inline box view
  const toggleRowExpansion = async (itemId, itemName) => {
    if (expandedRows[itemId]) {
      // Collapse
      setExpandedRows(prev => ({ ...prev, [itemId]: null }));
    } else {
      // Expand and load box info
      try {
        const response = await api.get(`/store2/item/${itemId}/boxes`);
        setExpandedRows(prev => ({ ...prev, [itemId]: response.data }));
      } catch (e) {
        setError(e.response?.data?.error || 'Failed to load box information');
      }
    }
  };

  // Get slow moving item ids for highlighting
  const slowIds = new Set(slowMoving.map(s => s.item?._id));

  // Calculate statistics
  const stats = {
    totalItems: inventory.length,
    inStock: inventory.filter(s => s.remaining_quantity > 20).length,
    lowStock: inventory.filter(s => s.remaining_quantity > 0 && s.remaining_quantity <= 20).length,
    outOfStock: inventory.filter(s => s.remaining_quantity === 0).length,
    slowMoving: slowMoving.length,
    totalQuantity: inventory.reduce((sum, s) => sum + s.remaining_quantity, 0)
  };

  // Get stock status
  const getStockStatus = (quantity, itemId) => {
    if (slowIds.has(itemId)) return { label: 'Slow Moving', color: 'warning', icon: <SlowMovingIcon /> };
    if (quantity === 0) return { label: 'Out of Stock', color: 'error', icon: <WarningIcon /> };
    if (quantity > 0 && quantity <= lowStockThreshold) return { label: 'Low Stock', color: 'warning', icon: <WarningIcon /> };
    return { label: 'In Stock', color: 'success', icon: <InStockIcon /> };
  };

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter(s => {
      const matchesSearch = s.item?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = 
        stockFilter === 'all' ? true :
        stockFilter === 'low' ? (s.remaining_quantity > 0 && s.remaining_quantity <= 20) :
        stockFilter === 'out' ? s.remaining_quantity === 0 :
        stockFilter === 'slow' ? slowIds.has(s.item?._id) : true;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Always show slow moving items first
      const aIsSlow = slowIds.has(a.item?._id);
      const bIsSlow = slowIds.has(b.item?._id);
      if (aIsSlow && !bIsSlow) return -1;
      if (!aIsSlow && bIsSlow) return 1;

      // Then sort by selected column
      let aVal, bVal;
      if (orderBy === 'name') {
        aVal = a.item?.name || '';
        bVal = b.item?.name || '';
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else if (orderBy === 'quantity') {
        aVal = a.remaining_quantity;
        bVal = b.remaining_quantity;
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredInventory.map((s) => {
      const status = getStockStatus(s.remaining_quantity, s.item?._id);
      return {
        'Item Name': s.item?.name || 'Unknown Item',
        'Remaining Quantity': s.remaining_quantity,
        'Stock Level': s.remaining_quantity === 0 ? '0%' : 
                      s.remaining_quantity <= 20 ? 'Low' : 'Good',
        'Status': status.label
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Store 2 Inventory');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Item Name
      { wch: 20 }, // Remaining Quantity
      { wch: 15 }, // Stock Level
      { wch: 15 }  // Status
    ];

    const fileName = `Store2_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Store 2 Inventory Report', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    // Add statistics
    doc.setFontSize(10);
    doc.text(`Total Items: ${stats.totalItems}  |  In Stock: ${stats.inStock}  |  Low Stock: ${stats.lowStock}  |  Out of Stock: ${stats.outOfStock}  |  Slow Moving: ${stats.slowMoving}`, 14, 38);
    
    // Prepare table data
    const tableData = filteredInventory.map((s) => {
      const status = getStockStatus(s.remaining_quantity, s.item?._id);
      return [
        s.item?.name || 'Unknown Item',
        s.remaining_quantity.toLocaleString(),
        s.remaining_quantity === 0 ? '0%' : 
          s.remaining_quantity <= 20 ? 'Low' : 'Good',
        status.label
      ];
    });

    // Add table
    autoTable(doc, {
      startY: 45,
      head: [['Item Name', 'Remaining Quantity', 'Stock Level', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [6, 190, 182],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' }
      },
      didParseCell: function(data) {
        // Color code status cells
        if (data.column.index === 3) {
          const status = data.cell.text[0];
          if (status === 'Out of Stock') {
            data.cell.styles.textColor = [211, 47, 47];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Low Stock') {
            data.cell.styles.textColor = [237, 108, 2];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Slow Moving') {
            data.cell.styles.textColor = [255, 152, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'In Stock') {
            data.cell.styles.textColor = [46, 125, 50];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    const fileName = `Store2_Inventory_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
              boxShadow: '0 4px 12px rgba(6, 190, 182, 0.3)'
            }}>
              <StorefrontIcon sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748', letterSpacing: 0.5 }}>
                Store 2 Inventory
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                Real-time stock management and alerts
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<ExcelIcon />}
              onClick={exportToExcel}
              disabled={loading || filteredInventory.length === 0}
              sx={{
                background: 'linear-gradient(135deg, #1e7e34 0%, #28a745 100%)',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                boxShadow: '0 4px 12px rgba(30, 126, 52, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #155d27 0%, #218838 100%)',
                  boxShadow: '0 6px 16px rgba(30, 126, 52, 0.4)'
                }
              }}
            >
              Export Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={exportToPDF}
              disabled={loading || filteredInventory.length === 0}
              sx={{
                background: 'linear-gradient(135deg, #c82333 0%, #dc3545 100%)',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                boxShadow: '0 4px 12px rgba(200, 35, 51, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #a71d2a 0%, #c82333 100%)',
                  boxShadow: '0 6px 16px rgba(200, 35, 51, 0.4)'
                }
              }}
            >
              Export PDF
            </Button>
            <Tooltip title="Refresh Inventory">
              <IconButton 
                onClick={loadInventory}
                disabled={loading}
                sx={{ 
                  background: '#fff', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': { background: '#f7fafc', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(6, 190, 182, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InventoryIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Items</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.totalItems}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {stats.totalQuantity.toLocaleString()} units
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(56, 239, 125, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InStockIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>In Stock</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.inStock}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {stats.totalItems > 0 ? Math.round((stats.inStock / stats.totalItems) * 100) : 0}% of items
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(250, 139, 255, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Low Stock</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.lowStock}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Needs attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(250, 112, 154, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Out of Stock</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.outOfStock}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Requires restocking
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(255, 154, 86, 0.4)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SlowMovingIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Slow Moving</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{stats.slowMoving}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Action required
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search inventory by item name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              sx={{ 
                flexGrow: 1, 
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label="All" 
                onClick={() => setStockFilter('all')}
                color={stockFilter === 'all' ? 'primary' : 'default'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
              <Chip 
                label={`In Stock (${stats.inStock})`}
                icon={<InStockIcon />}
                onClick={() => setStockFilter('in-stock')}
                color={stockFilter === 'in-stock' ? 'success' : 'default'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
              <Chip 
                label={`Low (${stats.lowStock})`}
                icon={<WarningIcon />}
                onClick={() => setStockFilter('low')}
                color={stockFilter === 'low' ? 'warning' : 'default'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
              <Chip 
                label={`Out (${stats.outOfStock})`}
                icon={<WarningIcon />}
                onClick={() => setStockFilter('out')}
                color={stockFilter === 'out' ? 'error' : 'default'}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
              <Badge badgeContent={stats.slowMoving} color="warning">
                <Chip 
                  label="Slow Moving"
                  icon={<SlowMovingIcon />}
                  onClick={() => setStockFilter('slow')}
                  color={stockFilter === 'slow' ? 'warning' : 'default'}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              </Badge>
            </Box>
          </Box>
        </Paper>

        {/* Loading Bar */}
        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* Inventory Table */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleSort('name')}
                      sx={{ 
                        color: '#fff !important',
                        '&.MuiTableSortLabel-root': { color: '#fff' },
                        '&.Mui-active': { color: '#fff' },
                        '& .MuiTableSortLabel-icon': { color: '#fff !important' }
                      }}
                    >
                      Item Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    <TableSortLabel
                      active={orderBy === 'quantity'}
                      direction={orderBy === 'quantity' ? order : 'asc'}
                      onClick={() => handleSort('quantity')}
                      sx={{ 
                        color: '#fff !important',
                        '&.MuiTableSortLabel-root': { color: '#fff' },
                        '&.Mui-active': { color: '#fff' },
                        '& .MuiTableSortLabel-icon': { color: '#fff !important' }
                      }}
                    >
                      Remaining Quantity
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    Stock Level
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    Box Info
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && filteredInventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <StoreIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No items found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {search ? 'Try adjusting your search' : 'Inventory is empty'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredInventory.map((s) => {
                  const status = getStockStatus(s.remaining_quantity, s.item?._id);
                  const maxQuantity = Math.max(...inventory.map(item => item.remaining_quantity), 100);
                  const stockPercentage = (s.remaining_quantity / maxQuantity) * 100;
                  const isSlow = slowIds.has(s.item?._id);
                  const isExpanded = expandedRows[s.item?._id];
                  
                  return (
                    <React.Fragment key={s._id}>
                      <TableRow 
                        sx={{ 
                          backgroundColor: isSlow ? alpha('#ff9800', 0.08) : 'inherit',
                          '&:nth-of-type(odd)': { 
                            backgroundColor: isSlow ? alpha('#ff9800', 0.12) : alpha('#06beb6', 0.02) 
                          },
                          '&:hover': { 
                            backgroundColor: isSlow ? alpha('#ff9800', 0.15) : alpha('#06beb6', 0.08),
                            transform: 'scale(1.001)',
                            transition: 'all 0.2s'
                          }
                        }}
                      >
                        <TableCell sx={{ fontWeight: isSlow ? 700 : 600, fontSize: '0.95rem' }}>
                          {isSlow && (
                            <Chip 
                              icon={<SpeedIcon />}
                              label="SLOW" 
                              size="small" 
                              color="warning" 
                              sx={{ mr: 1, fontWeight: 700 }} 
                            />
                          )}
                          {s.item?.name || 'Unknown Item'}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {s.remaining_quantity.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(stockPercentage, 100)}
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 1,
                                  backgroundColor: alpha(
                                    isSlow ? '#ff9800' : 
                                    status.color === 'error' ? '#d32f2f' : 
                                    status.color === 'warning' ? '#ed6c02' : '#2e7d32', 0.1
                                  ),
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: 
                                      isSlow ? '#ff9800' : 
                                      status.color === 'error' ? '#d32f2f' : 
                                      status.color === 'warning' ? '#ed6c02' : '#2e7d32',
                                    borderRadius: 1
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
                              {Math.round(stockPercentage)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            icon={status.icon}
                            label={status.label}
                            color={status.color}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={isExpanded ? "Hide box details" : "Show box details"}>
                            <IconButton 
                              size="small"
                              onClick={() => toggleRowExpansion(s.item?._id, s.item?.name)}
                              sx={{ 
                                color: '#06beb6',
                                '&:hover': { 
                                  backgroundColor: alpha('#06beb6', 0.1),
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              {isExpanded ? <ExpandLessIcon /> : <BoxIcon />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Box Information Row */}
                      <TableRow>
                        <TableCell 
                          colSpan={5} 
                          sx={{ 
                            p: 0, 
                            borderBottom: isExpanded ? '1px solid rgba(224, 224, 224, 1)' : 'none' 
                          }}
                        >
                          <Collapse in={!!isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ 
                              p: 3, 
                              backgroundColor: alpha('#06beb6', 0.03),
                              borderLeft: `4px solid #06beb6`
                            }}>
                              {isExpanded ? (
                                <>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <BoxIcon sx={{ color: '#06beb6', fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#06beb6' }}>
                                      Box Distribution for {s.item?.name}
                                    </Typography>
                                  </Box>
                                  
                                  {isExpanded.boxes && isExpanded.boxes.length > 0 ? (
                                    <>
                                      <Grid container spacing={2} sx={{ mb: 2 }}>
                                        <Grid item xs={12} sm={4}>
                                          <Card sx={{ 
                                            background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                                            color: '#fff'
                                          }}>
                                            <CardContent>
                                              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                Total Boxes
                                              </Typography>
                                              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                                {isExpanded.totalBoxes}
                                              </Typography>
                                            </CardContent>
                                          </Card>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                          <Card sx={{ 
                                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                            color: '#fff'
                                          }}>
                                            <CardContent>
                                              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                Total in Boxes
                                              </Typography>
                                              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                                {isExpanded.totalQuantity}
                                              </Typography>
                                            </CardContent>
                                          </Card>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                          <Card sx={{ 
                                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            color: '#fff'
                                          }}>
                                            <CardContent>
                                              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                Store 2 Total
                                              </Typography>
                                              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                                {s.remaining_quantity}
                                              </Typography>
                                            </CardContent>
                                          </Card>
                                        </Grid>
                                      </Grid>

                                      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow sx={{ backgroundColor: alpha('#06beb6', 0.1) }}>
                                              <TableCell sx={{ fontWeight: 700 }}>Box Number</TableCell>
                                              <TableCell align="center" sx={{ fontWeight: 700 }}>Quantity</TableCell>
                                              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                              <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {isExpanded.boxes.map((box, index) => (
                                              <TableRow 
                                                key={box.boxId}
                                                sx={{ 
                                                  '&:hover': { backgroundColor: alpha('#06beb6', 0.05) },
                                                  backgroundColor: index % 2 === 0 ? '#fff' : alpha('#06beb6', 0.02)
                                                }}
                                              >
                                                <TableCell>
                                                  <Chip 
                                                    icon={<BoxIcon />}
                                                    label={`Box ${box.boxNumber}`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                  />
                                                </TableCell>
                                                <TableCell align="center">
                                                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                                    {box.quantity}
                                                  </Typography>
                                                </TableCell>
                                                <TableCell>
                                                  <Chip 
                                                    label={box.boxStatus}
                                                    size="small"
                                                    color={
                                                      box.boxStatus === 'Active' ? 'success' :
                                                      box.boxStatus === 'Full' ? 'warning' : 'default'
                                                    }
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Typography variant="body2" color="text.secondary">
                                                    {box.notes || box.boxDescription || '-'}
                                                  </Typography>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </Paper>
                                    </>
                                  ) : (
                                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                                      <Typography variant="body2">
                                        This item is not currently stored in any boxes in Store 2.
                                      </Typography>
                                    </Alert>
                                  )}
                                </>
                              ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                  <CircularProgress size={24} />
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Results Summary */}
        {!loading && filteredInventory.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              Showing {filteredInventory.length} of {inventory.length} items
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
