import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, List, ListItem, ListItemIcon, ListItemText,
  Chip, CircularProgress, FormControl, InputLabel, Select, MenuItem, Grid, Divider,
  Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Collapse, Button, ButtonGroup, LinearProgress, Snackbar, Tooltip
} from '@mui/material';
import {
  CheckCircle, Cancel, CalendarToday, ExpandMore, ExpandLess,
  Assessment as AssessmentIcon, TrendingUp, Download as DownloadIcon,
  Store as StoreIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../services/api';

function ChecklistReports() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [storeFilter, setStoreFilter] = useState('');
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [days, storeFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      let url = `/checklists/history?days=${days}`;
      if (storeFilter) url += `&store=${storeFilter}`;
      
      const response = await api.get(url);
      setHistory(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Failed to load checklist history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let url = `/checklists/stats?days=${days}`;
      if (storeFilter) url += `&store=${storeFilter}`;
      
      const response = await api.get(url);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getCompletionRate = (items) => {
    if (!items || items.length === 0) return 0;
    const completed = items.filter(item => item.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteRecord = async (id, checklistName) => {
    if (!window.confirm(`Are you sure you want to delete this checklist completion record for "${checklistName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/checklists/completions/${id}`);
      setSuccessMessage('Checklist record deleted successfully');
      setSnackbarOpen(true);
      
      // Refresh the data
      fetchHistory();
      fetchStats();
    } catch (error) {
      console.error('Error deleting checklist record:', error);
      setError(error.response?.data?.message || 'Failed to delete checklist record');
    }
  };

  const exportToCSV = () => {
    const headers = ['Checklist', 'Category', 'Completed By', 'Date', 'Completion %', 'Store'];
    const rows = history.map(record => [
      record.templateId?.name || 'Unknown',
      record.templateId?.category?.name || '-',
      record.completedBy?.username || 'Unknown',
      formatDate(record.completedAt),
      getCompletionRate(record.items) + '%',
      record.store || '-'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Checklist Reports & History
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Store</InputLabel>
            <Select
              value={storeFilter}
              label="Store"
              onChange={(e) => setStoreFilter(e.target.value)}
            >
              <MenuItem value="">All Stores</MenuItem>
              <MenuItem value="store1">Store 1</MenuItem>
              <MenuItem value="store2">Store 2</MenuItem>
              <MenuItem value="warehouse">Warehouse</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={days}
              label="Time Period"
              onChange={(e) => setDays(e.target.value)}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={60}>Last 60 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
              <MenuItem value={180}>Last 6 months</MenuItem>
              <MenuItem value={365}>Last year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
            disabled={history.length === 0}
          >
            Export
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Summary Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                {stats?.overall?.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Checklists
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                {stats?.overall?.completed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed (100%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                {Math.round(stats?.overall?.avgCompletionRate || 0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f3e5f5' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0' }}>
                {Math.round(stats?.overall?.avgDuration || 0)} min
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Duration
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Templates */}
      {stats?.byTemplate && stats.byTemplate.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1 }} />
              Most Used Checklists
            </Typography>
            <Grid container spacing={2}>
              {stats.byTemplate.slice(0, 4).map((item, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Paper sx={{ p: 2, bgcolor: '#fafafa' }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {item._id?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed: {item.count} times
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={item.avgCompletionRate || 0} 
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(item.avgCompletionRate || 0)}% avg completion
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 1 }} />
            Checklist History
          </Typography>

          {history.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f5f5' }}>
              <Typography color="text.secondary">
                No checklist completions found for the selected period.
              </Typography>
            </Paper>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell width={50}></TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Checklist</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Completed By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Completion</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} width={80}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((record) => {
                    const completionRate = getCompletionRate(record.items);
                    const isExpanded = expandedRows[record._id];
                    
                    return (
                      <React.Fragment key={record._id}>
                        <TableRow hover>
                          <TableCell>
                            <IconButton size="small" onClick={() => toggleRow(record._id)}>
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {record.templateId?.name || 'Unknown Checklist'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {record.templateId?.category ? (
                              <Chip 
                                label={record.templateId.category.name} 
                                size="small" 
                                color="primary"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {record.completedBy?.username || 'Unknown'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                              {formatDate(record.completedAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={`${completionRate}%`}
                                size="small"
                                color={
                                  completionRate === 100 ? 'success' :
                                  completionRate > 0 ? 'warning' : 'error'
                                }
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Delete Record">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRecord(record._id, record.templateId?.name || 'Unknown')}
                                sx={{
                                  bgcolor: 'error.50',
                                  '&:hover': {
                                    bgcolor: 'error.100',
                                    color: 'error.main',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s'
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expandable Row Details */}
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 3, bgcolor: '#fafafa' }}>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                  Checklist Items:
                                </Typography>
                                <List dense>
                                  {record.items?.map((item, idx) => (
                                    <ListItem key={idx} sx={{ py: 0.5 }}>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        {item.completed ? (
                                          <CheckCircle color="success" fontSize="small" />
                                        ) : (
                                          <Cancel color="error" fontSize="small" />
                                        )}
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={item.text}
                                        secondary={
                                          <Box>
                                            {item.required && (
                                              <Chip label="Required" size="small" sx={{ mr: 1, height: 20 }} />
                                            )}
                                            {item.notes && (
                                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                                Notes: {item.notes}
                                              </Typography>
                                            )}
                                          </Box>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                                {record.notes && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                      Overall Notes:
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: 'white' }}>
                                      <Typography variant="body2">{record.notes}</Typography>
                                    </Paper>
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
          )}
        </CardContent>
      </Card>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ChecklistReports;
