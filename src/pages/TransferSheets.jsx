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
  Grid,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { getTransfers, verifyTransfer } from '../services/transferApi';
import { hasPerm } from '../utils/permissions';

export default function TransferSheets() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ status: 'verified', notes: '' });

  const PAGE_SIZE = 12;

  const fetchTransfers = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageNum,
        limit: PAGE_SIZE,
      };
      
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      if (filterStatus) params.status = filterStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const result = await getTransfers(params);
      
      setTransfers(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.total || 0);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Failed to load transfer sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPerm('transfers', 'view')) {
      fetchTransfers(1);
    }
  }, []);

  const handleFilterChange = () => {
    fetchTransfers(1);
  };

  const openVerifyDialog = (transfer) => {
    setCurrentTransfer(transfer);
    setVerifyForm({ status: 'verified', notes: '' });
    setVerifyDialogOpen(true);
  };

  const handleVerify = async () => {
    if (!currentTransfer) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await verifyTransfer(currentTransfer._id, {
        status: verifyForm.status,
        verificationNotes: verifyForm.notes
      });
      
      setSuccess(`Transfer ${verifyForm.status === 'verified' ? 'verified' : 'marked with discrepancy'} successfully!`);
      setVerifyDialogOpen(false);
      setCurrentTransfer(null);
      setVerifyForm({ status: 'verified', notes: '' });
      
      // Refresh the list
      fetchTransfers(page);
    } catch (err) {
      console.error('Error verifying transfer:', err);
      setError(err.response?.data?.error || 'Failed to verify transfer');
    } finally {
      setLoading(false);
    }
  };

  const printSheet = (transfer) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    
    const fromLabel = transfer.from === 'warehouse' ? 'Warehouse' : transfer.from === 'store' ? 'Store 1' : 'Store 2';
    const toLabel = transfer.to === 'warehouse' ? 'Warehouse' : transfer.to === 'store' ? 'Store 1' : 'Store 2';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transfer Sheet - ${new Date(transfer.date).toLocaleDateString()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            padding: 20px; 
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #333;
            padding-bottom: 15px;
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 8px;
            color: #1976d2;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 8px;
          }
          .info-box {
            flex: 1;
          }
          .info-box strong {
            display: block;
            color: #666;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .info-box span {
            display: block;
            font-size: 16px;
            font-weight: bold;
            color: #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px 8px; 
            text-align: left; 
          }
          th { 
            background-color: #1976d2; 
            color: white;
            font-weight: bold;
            font-size: 13px;
          }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:hover { background-color: #f0f0f0; }
          .item-name { font-weight: 600; }
          .quantity-col { 
            text-align: center; 
            font-weight: bold;
            color: #1976d2;
          }
          .verified-col, .notes-col { 
            text-align: center;
            color: #999;
          }
          .signature-section {
            display: flex;
            justify-content: space-around;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #ddd;
          }
          .signature-box {
            text-align: center;
            width: 250px;
          }
          .print-date {
            text-align: center;
            margin-top: 30px;
            font-size: 11px;
            color: #999;
          }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚚 STOCK TRANSFER VERIFICATION SHEET</h1>
          <p style="font-size: 14px; color: #666; margin-top: 5px;">Please verify all items during transfer</p>
        </div>

        <div class="info-section">
          <div class="info-box">
            <strong>Transfer Date:</strong>
            <span>${new Date(transfer.date).toLocaleDateString()}</span>
          </div>
          <div class="info-box">
            <strong>From Location:</strong>
            <span>${fromLabel}</span>
          </div>
          <div class="info-box">
            <strong>To Location:</strong>
            <span>${toLabel}</span>
          </div>
          ${transfer.technician ? `
          <div class="info-box">
            <strong>Technician:</strong>
            <span>${transfer.technician.name || 'N/A'}</span>
          </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Item Name</th>
              <th style="width: 100px;" class="quantity-col">Quantity</th>
              <th style="width: 120px;" class="verified-col">Verified ✓</th>
              <th style="width: 200px;" class="notes-col">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${transfer.items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="item-name">${item.item?.name || 'Unknown Item'}</td>
                <td class="quantity-col">${item.quantity}</td>
                <td class="verified-col">_______</td>
                <td class="notes-col">_________________</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signature-section">
          <div>
            <div class="signature-box">
              <div style="margin-bottom: 50px;">Sent By (${fromLabel}):</div>
              <div style="border-top: 1px solid #333; padding-top: 5px;">Signature & Date</div>
            </div>
          </div>
          <div>
            <div class="signature-box">
              <div style="margin-bottom: 50px;">Received By (${toLabel}):</div>
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

  if (!hasPerm('transfers', 'view')) {
    return (
      <Box p={3}>
        <Alert severity="error">Access denied. You don't have permission to view transfer sheets.</Alert>
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
        🚚 Transfer Verification Sheets
      </Typography>

      <Typography 
        variant="body1" 
        sx={{ 
          mb: 3, 
          color: 'text.secondary',
          fontStyle: 'italic'
        }}
      >
        Print these sheets to verify stock transfers between locations (Warehouse, Store 1, Store 2).
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>From Location</InputLabel>
          <Select
            value={filterFrom}
            label="From Location"
            onChange={(e) => {
              setFilterFrom(e.target.value);
            }}
          >
            <MenuItem value="">All Locations</MenuItem>
            <MenuItem value="warehouse">Warehouse</MenuItem>
            <MenuItem value="store">Store 1</MenuItem>
            <MenuItem value="store2">Store 2</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>To Location</InputLabel>
          <Select
            value={filterTo}
            label="To Location"
            onChange={(e) => {
              setFilterTo(e.target.value);
            }}
          >
            <MenuItem value="">All Locations</MenuItem>
            <MenuItem value="warehouse">Warehouse</MenuItem>
            <MenuItem value="store">Store 1</MenuItem>
            <MenuItem value="store2">Store 2</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => {
              setFilterStatus(e.target.value);
            }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="verified">Verified</MenuItem>
            <MenuItem value="discrepancy">Discrepancy</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Start Date"
          type="date"
          size="small"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        <TextField
          label="End Date"
          type="date"
          size="small"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        <Button
          variant="contained"
          onClick={handleFilterChange}
          startIcon={<SearchIcon />}
          disabled={loading}
        >
          Apply Filters
        </Button>

        {(filterFrom || filterTo || filterStatus || startDate || endDate) && (
          <Button
            variant="outlined"
            onClick={() => {
              setFilterFrom('');
              setFilterTo('');
              setFilterStatus('');
              setStartDate('');
              setEndDate('');
              fetchTransfers(1);
            }}
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Pagination */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button 
          variant="outlined" 
          disabled={loading || page <= 1} 
          onClick={() => fetchTransfers(page - 1)}
        >
          Previous
        </Button>
        <Typography variant="body2">
          Page {page} of {totalPages}
        </Typography>
        <Button 
          variant="outlined" 
          disabled={loading || page >= totalPages} 
          onClick={() => fetchTransfers(page + 1)}
        >
          Next
        </Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {transfers.length} transfers on this page • {totalCount} total
        </Typography>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Transfers Grid */}
      <Grid container spacing={3}>
        {!loading && transfers.map((transfer) => (
          <Grid item xs={12} sm={6} md={4} key={transfer._id}>
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
                    {new Date(transfer.date).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Chip 
                      label={`${transfer.items?.length || 0} items`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    {transfer.status && (
                      <Chip 
                        label={transfer.status === 'verified' ? 'Verified' : transfer.status === 'discrepancy' ? 'Discrepancy' : 'Pending'}
                        size="small" 
                        icon={transfer.status === 'verified' ? <CheckCircleIcon /> : transfer.status === 'discrepancy' ? <WarningIcon /> : null}
                        color={transfer.status === 'verified' ? 'success' : transfer.status === 'discrepancy' ? 'error' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>From:</strong> {transfer.from === 'warehouse' ? 'Warehouse' : transfer.from === 'store' ? 'Store 1' : 'Store 2'}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>To:</strong> {transfer.to === 'warehouse' ? 'Warehouse' : transfer.to === 'store' ? 'Store 1' : 'Store 2'}
                </Typography>

                {transfer.technician && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Technician:</strong> {transfer.technician.name}
                  </Typography>
                )}

                {transfer.workType && (
                  <Chip 
                    label={transfer.workType === 'repair' ? 'Repair' : 'Test'} 
                    size="small" 
                    color={transfer.workType === 'repair' ? 'warning' : 'info'}
                    sx={{ mt: 1 }}
                  />
                )}

                {transfer.verified && transfer.verificationNotes && (
                  <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'success.dark' }}>
                      Verification Notes:
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      {transfer.verificationNotes}
                    </Typography>
                  </Box>
                )}

                {/* Items Preview */}
                <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    Items:
                  </Typography>
                  {transfer.items?.slice(0, 3).map((item, idx) => (
                    <Typography key={idx} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      • {item.item?.name || 'Unknown'} (Qty: {item.quantity})
                    </Typography>
                  ))}
                  {transfer.items?.length > 3 && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                      + {transfer.items.length - 3} more...
                    </Typography>
                  )}
                </Box>
              </CardContent>

              <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={() => printSheet(transfer)}
                  sx={{ 
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Print Sheet
                </Button>
                {!transfer.verified && (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openVerifyDialog(transfer)}
                    sx={{ fontWeight: 600 }}
                  >
                    Verify Transfer
                  </Button>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify Transfer Sheet</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Verification Status</InputLabel>
              <Select
                value={verifyForm.status}
                label="Verification Status"
                onChange={(e) => setVerifyForm({ ...verifyForm, status: e.target.value })}
              >
                <MenuItem value="verified">✓ Verified - All Items Match</MenuItem>
                <MenuItem value="discrepancy">⚠ Discrepancy - Items Don't Match</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Verification Notes (Optional)"
              placeholder="Add any notes about the verification..."
              value={verifyForm.notes}
              onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
            />

            {currentTransfer && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  Transfer Details:
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  Date: {new Date(currentTransfer.date).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  From: {currentTransfer.from === 'warehouse' ? 'Warehouse' : currentTransfer.from === 'store' ? 'Store 1' : 'Store 2'}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  To: {currentTransfer.to === 'warehouse' ? 'Warehouse' : currentTransfer.to === 'store' ? 'Store 1' : 'Store 2'}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  Items: {currentTransfer.items?.length || 0}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleVerify} 
            variant="contained" 
            color={verifyForm.status === 'verified' ? 'success' : 'error'}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm Verification'}
          </Button>
        </DialogActions>
      </Dialog>

      {!loading && transfers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No transfer sheets found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Transfer sheets will appear here once transfers are created
          </Typography>
        </Box>
      )}
    </Box>
  );
}
