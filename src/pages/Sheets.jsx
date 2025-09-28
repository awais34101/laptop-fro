import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  TextField, 
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Autocomplete
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getPurchaseSheets, getTechnicians, assignSheet, updateSheetStatus } from '../services/sheetsApi';
import { hasPerm } from '../utils/permissions';

export default function Sheets() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [currentSheet, setCurrentSheet] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({ technicianId: '', notes: '' });
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });
  

  const PAGE_SIZE = 12;

  const fetchSheets = async (pageNum = 1, searchTerm = '', technicianId = '', status = '') => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageNum,
        limit: PAGE_SIZE,
        search: searchTerm
      };
      
      if (technicianId) params.technician = technicianId;
      if (status) params.status = status;
      
      const result = await getPurchaseSheets(params);
      
      setSheets(result.data || []);
      setTotalPages(result.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching sheets:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load sheets';
      setError(`Failed to load sheets: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const result = await getTechnicians();
      setTechnicians(result || []);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load technicians';
      setError(`Failed to load technicians: ${errorMessage}`);
    }
  };

  useEffect(() => {
    if (hasPerm('purchases', 'view')) {
      fetchSheets(1, '', '', '');
      fetchTechnicians();
    }
  }, []);

  const handleSearch = () => {
    setSearch(searchInput);
    fetchSheets(1, searchInput, selectedTechnician, selectedStatus);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = () => {
    fetchSheets(1, search, selectedTechnician, selectedStatus);
  };

  

  const openAssignDialog = (sheet) => {
    setCurrentSheet(sheet);
    setAssignmentForm({
      technicianId: sheet.assignment?.technician?._id || '',
      notes: sheet.assignment?.notes || ''
    });
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!assignmentForm.technicianId) {
      setError('Please select a technician');
      return;
    }

    try {
      await assignSheet(currentSheet._id, assignmentForm);
      setAssignDialogOpen(false);
      fetchSheets(page, search, selectedTechnician, selectedStatus);
    } catch (err) {
      console.error('Error assigning sheet:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to assign sheet';
      setError(`Failed to assign sheet: ${errorMessage}`);
    }
  };

  const openStatusDialog = (sheet) => {
    if (!sheet.assignment) return;
    setCurrentAssignment(sheet.assignment);
    setStatusForm({
      status: sheet.assignment.status,
      notes: sheet.assignment.notes || ''
    });
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    try {
      await updateSheetStatus(currentAssignment._id, statusForm);
      setStatusDialogOpen(false);
      fetchSheets(page, search, selectedTechnician, selectedStatus);
    } catch (err) {
      setError('Failed to update status');
      console.error('Error updating status:', err);
    }
  };

  const printSheet = (sheet) => {
    const progMap = new Map();
    (sheet.progress || []).forEach(p => {
      const key = p.item?._id || p.item;
      progMap.set(String(key), { 
        transferred: p.transferred || 0, 
        remaining: p.remaining || 0,
        transferPercentage: p.transferPercentage || 0
      });
    });
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stock Verification Sheet - ${sheet.invoice_number}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .sheet-title {
            font-size: 18px;
            color: #666;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
          }
          .info-group {
            flex: 1;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .info-value {
            margin-left: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .quantity-col {
            width: 100px;
            text-align: center;
          }
          .verified-col {
            width: 120px;
            text-align: center;
          }
          .transferred-col, .remaining-col {
            width: 120px;
            text-align: center;
          }
          .percentage-col {
            width: 80px;
            text-align: center;
            font-weight: bold;
            color: #2e7d32;
          }
          .notes-col {
            width: 200px;
          }
          .progress-section {
            margin: 20px 0;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          .progress-header {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
            color: #1976d2;
          }
          .progress-info {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
          }
          .progress-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 5px;
          }
          .progress-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 3px;
          }
          .progress-value {
            font-size: 14px;
            font-weight: bold;
            color: #2e7d32;
          }
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            border: 1px solid #ddd;
            padding: 20px;
            width: 200px;
            height: 80px;
            text-align: center;
          }
          .print-date {
            text-align: right;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Laptop Business - UAE</div>
          <div class="sheet-title">Stock Verification Sheet</div>
        </div>
        
        <div class="invoice-info">
          <div class="info-group">
            <span class="info-label">Invoice #:</span>
            <span class="info-value">${sheet.invoice_number || 'N/A'}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Date:</span>
            <span class="info-value">${new Date(sheet.date).toLocaleDateString()}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Verification ID:</span>
            <span class="info-value">${sheet._id.slice(-6).toUpperCase()}</span>
          </div>
          ${sheet.assignment ? `
          <div class="info-group">
            <span class="info-label">Assigned To:</span>
            <span class="info-value">${sheet.assignment.technician?.name || 'N/A'}</span>
          </div>
          ` : ''}
        </div>

        <div class="progress-section">
          <div class="progress-header">Transfer Progress Summary</div>
          <div class="progress-info">
            <div class="progress-item">
              <span class="progress-label">Overall Progress:</span>
              <span class="progress-value">${sheet.transferPercentage || 0}%</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">Total Purchased:</span>
              <span class="progress-value">${sheet.totalPurchased || 0}</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">Total Transferred:</span>
              <span class="progress-value">${sheet.totalTransferred || 0}</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">Total Remaining:</span>
              <span class="progress-value">${sheet.totalRemaining || 0}</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>SKU</th>
              <th class="quantity-col">Expected Qty</th>
              <th class="transferred-col">Transferred</th>
              <th class="remaining-col">Remaining</th>
              <th class="percentage-col">Transfer %</th>
              <th class="verified-col">Verified Qty</th>
              <th class="notes-col">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${sheet.items.map(item => `
              <tr>
                <td>${item.item?.name || 'Unknown Item'}</td>
                <td>${item.item?.sku || '-'}</td>
                <td class="quantity-col">${item.quantity}</td>
                <td class="transferred-col">${(() => { const p = progMap.get(String(item.item?._id || item.item)); return p?.transferred ?? 0; })()}</td>
                <td class="remaining-col">${(() => { const p = progMap.get(String(item.item?._id || item.item)); return p?.remaining ?? (item.quantity || 0); })()}</td>
                <td class="percentage-col">${(() => { const p = progMap.get(String(item.item?._id || item.item)); return p?.transferPercentage ?? 0; })()}%</td>
                <td class="verified-col">_______</td>
                <td class="notes-col">_________________</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signature-section">
          <div>
            <div class="signature-box">
              <div style="margin-bottom: 50px;">Verified By:</div>
              <div style="border-top: 1px solid #333; padding-top: 5px;">Signature & Date</div>
            </div>
          </div>
          <div>
            <div class="signature-box">
              <div style="margin-bottom: 50px;">Checked By:</div>
              <div style="border-top: 1px solid #333; padding-top: 5px;">Signature & Date</div>
            </div>
          </div>
        </div>

        <div class="print-date">
          Printed on: ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!hasPerm('purchases', 'view')) {
    return (
      <Box p={3}>
        <Alert severity="error">Access denied. You don't have permission to view sheets.</Alert>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ 
      background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', 
      minHeight: '100vh' 
    }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 900, 
          letterSpacing: 1, 
          color: 'primary.main', 
          mb: 3 
        }}
      >
        Stock Verification Sheets
      </Typography>

      <Typography 
        variant="body1" 
        sx={{ 
          mb: 3, 
          color: 'text.secondary',
          fontStyle: 'italic'
        }}
      >
        Print these sheets for staff to manually verify incoming stock against purchase invoices.
        Supplier names and prices are hidden for security.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          placeholder="Search by invoice number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          sx={{ minWidth: 300 }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
          disabled={loading}
        >
          Search
        </Button>
        {search && (
            <Button
              variant="outlined"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setSelectedTechnician('');
                setSelectedStatus('');
                fetchSheets(1, '', '', '');
              }}
            >
              Clear All
            </Button>
          )}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Technician</InputLabel>
          <Select
            value={selectedTechnician}
            label="Filter by Technician"
            onChange={(e) => {
              setSelectedTechnician(e.target.value);
              fetchSheets(1, search, e.target.value, selectedStatus);
            }}
          >
            <MenuItem value="">All Technicians</MenuItem>
            {technicians.map((tech) => (
              <MenuItem key={tech._id} value={tech._id}>
                {tech.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={selectedStatus}
            label="Filter by Status"
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              fetchSheets(1, search, selectedTechnician, e.target.value);
            }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="unassigned">Unassigned</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Box>      {/* Pagination */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button 
          variant="outlined" 
          disabled={loading || page <= 1} 
          onClick={() => fetchSheets(page - 1, search, selectedTechnician, selectedStatus)}
        >
          Previous
        </Button>
        <Typography variant="body2">
          Page {page} of {totalPages}
        </Typography>
        <Button 
          variant="outlined" 
          disabled={loading || page >= totalPages} 
          onClick={() => fetchSheets(page + 1, search, selectedTechnician, selectedStatus)}
        >
          Next
        </Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {sheets.length} sheets on this page
        </Typography>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Sheets Grid */}
      <Grid container spacing={3}>
        {!loading && sheets.map((sheet) => (
          <Grid item xs={12} sm={6} md={4} key={sheet._id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                    {sheet.invoice_number || 'No Invoice #'}
                  </Typography>
                  <Chip 
                    label={`${sheet.items?.length || 0} items`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Date:</strong> {new Date(sheet.date).toLocaleDateString()}
                </Typography>

                {/* Assignment Info */}
                {sheet.assignment ? (
                  <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(25,118,210,0.08)', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Assigned to: {sheet.assignment.technician?.name}
                    </Typography>
                    <Chip 
                      label={sheet.assignment.status.replace('-', ' ').toUpperCase()} 
                      size="small" 
                      color={
                        sheet.assignment.status === 'completed' ? 'success' : 
                        sheet.assignment.status === 'in-progress' ? 'warning' : 'primary'
                      }
                    />
                  </Box>
                ) : (
                  <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(255,193,7,0.08)', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Not assigned to any technician
                    </Typography>
                  </Box>
                )}

                {/* Transfer Progress */}
                <Box sx={{ mb: 2, p: 2, backgroundColor: 'rgba(76,175,80,0.08)', borderRadius: 2, border: '1px solid rgba(76,175,80,0.2)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Transfer Progress
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {sheet.transferPercentage || 0}%
                    </Typography>
                  </Box>
                  
                  {/* Progress Bar */}
                  <Box sx={{ 
                    width: '100%', 
                    height: 8, 
                    backgroundColor: 'rgba(0,0,0,0.1)', 
                    borderRadius: 4, 
                    overflow: 'hidden',
                    mb: 1 
                  }}>
                    <Box sx={{ 
                      width: `${sheet.transferPercentage || 0}%`, 
                      height: '100%', 
                      backgroundColor: sheet.transferPercentage === 100 ? 'success.main' : 'warning.main',
                      borderRadius: 4,
                      transition: 'width 0.3s ease-in-out'
                    }} />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
                    <span>Transferred: {sheet.totalTransferred || 0}</span>
                    <span>Remaining: {sheet.totalRemaining || 0}</span>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Items to verify:
                </Typography>
                
                <Box sx={{ maxHeight: 180, overflow: 'auto' }}>
                  {sheet.items?.slice(0, 5).map((item, idx) => {
                    const pr = (sheet.progress || []).find(p => (p.item?._id || p.item) === (item.item?._id || item.item));
                    const transferred = pr?.transferred || 0;
                    const remaining = Math.max(0, (item.quantity || 0) - transferred);
                    const itemPercentage = pr?.transferPercentage || 0;
                    return (
                      <Box 
                        key={idx} 
                        sx={{ 
                          mb: 1,
                          padding: '4px 8px',
                          backgroundColor: idx % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent',
                          borderRadius: 1,
                          border: itemPercentage === 100 ? '1px solid rgba(76,175,80,0.3)' : 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            {item.item?.name || 'Unknown Item'} × {item.quantity}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 600,
                            color: itemPercentage === 100 ? 'success.main' : itemPercentage > 0 ? 'warning.main' : 'text.secondary'
                          }}>
                            {itemPercentage}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          Transferred: {transferred} | Remaining: {remaining}
                        </Typography>
                      </Box>
                    );
                  })}
                  {sheet.items?.length > 5 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      +{sheet.items.length - 5} more items...
                    </Typography>
                  )}
                </Box>
              </CardContent>
              
              <CardActions sx={{ flexDirection: 'column', gap: 1, pb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={() => printSheet(sheet)}
                  fullWidth
                  sx={{ 
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  Print Verification Sheet
                </Button>
                
                {hasPerm('purchases', 'edit') && (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Button
                      variant="outlined"
                      startIcon={<AssignmentIndIcon />}
                      onClick={() => openAssignDialog(sheet)}
                      size="small"
                      sx={{ flex: 1 }}
                    >
                      {sheet.assignment ? 'Reassign' : 'Assign'}
                    </Button>
                    
                    {sheet.assignment && (
                      <Button
                        variant="outlined"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => openStatusDialog(sheet)}
                        size="small"
                        sx={{ flex: 1 }}
                        color={sheet.assignment.status === 'completed' ? 'success' : 'primary'}
                      >
                        Status
                      </Button>
                    )}
                  </Box>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* No results */}
      {!loading && sheets.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {search ? 'No sheets found matching your search.' : 'No purchase sheets available.'}
          </Typography>
          {search && (
            <Button
              variant="outlined"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setSelectedTechnician('');
                setSelectedStatus('');
                fetchSheets(1, '', '', '');
              }}
              sx={{ mt: 2 }}
            >
              Show All Sheets
            </Button>
          )}
        </Box>
      )}

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Sheet to Technician</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Technician</InputLabel>
              <Select
                value={assignmentForm.technicianId}
                label="Select Technician"
                onChange={(e) => setAssignmentForm({...assignmentForm, technicianId: e.target.value})}
              >
                {technicians.map((tech) => (
                  <MenuItem key={tech._id} value={tech._id}>
                    {tech.name} - {tech.specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={assignmentForm.notes}
              onChange={(e) => setAssignmentForm({...assignmentForm, notes: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign}>
            {currentSheet?.assignment ? 'Reassign' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Sheet Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusForm.status}
                label="Status"
                onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
              >
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={statusForm.notes}
              onChange={(e) => setStatusForm({...statusForm, notes: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
      
    </Box>
  );
}