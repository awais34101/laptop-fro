import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Alert, MenuItem, Grid, Card, CardContent,
  Chip, Avatar, Stack, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Collapse, Tooltip, Badge, LinearProgress, Divider, Select, FormControl, InputLabel,
  TablePagination, Fade, Zoom, InputAdornment
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  ExitToApp as ClockOutIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Assessment as ReportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { clockIn, clockOut, listTimeEntries, updateEntry, deleteEntry } from '../services/timeApi';

export default function Time() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = ['admin','manager'].includes(user.role);

  // State management
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userId, setUserId] = useState('');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    clockIn: '',
    clockOut: '',
    notes: ''
  });

  // Stats
  const [stats, setStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    totalEntries: 0,
    avgDailyHours: 0
  });

  // Load data
  const load = async (p = page) => {
    try {
      setLoading(true);
      const res = await listTimeEntries({ 
        from, 
        to, 
        userId: isManager ? userId : user._id, 
        page: p, 
        limit: 20 
      });
      setData(res.data || []);
      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
      
      // Check if currently clocked in
      const openEntry = (res.data || []).find(e => !e.clockOut);
      setClockedIn(!!openEntry);
      setCurrentEntry(openEntry || null);
      
      // Calculate stats
      calculateStats(res.data || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (entries) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;

    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const duration = entry.durationMinutes || 0;

      if (entryDate >= todayStart) todayMinutes += duration;
      if (entryDate >= weekStart) weekMinutes += duration;
      if (entryDate >= monthStart) monthMinutes += duration;
    });

    setStats({
      todayHours: (todayMinutes / 60).toFixed(1),
      weekHours: (weekMinutes / 60).toFixed(1),
      monthHours: (monthMinutes / 60).toFixed(1),
      totalEntries: entries.length,
      avgDailyHours: entries.length > 0 ? ((monthMinutes / 60) / 30).toFixed(1) : 0
    });
  };

  // Timer effect for elapsed time
  useEffect(() => {
    let interval;
    if (clockedIn && currentEntry) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date() - new Date(currentEntry.clockIn)) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn, currentEntry]);

  useEffect(() => { load(1); }, []);

  const doClockIn = async () => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await clockIn();
      setSuccess('✓ Clocked in successfully');
      load(1);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const doClockOut = async () => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await clockOut();
      setSuccess('✓ Clocked out successfully');
      load(1);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      clockIn: entry.clockIn ? new Date(entry.clockIn).toISOString().slice(0, 16) : '',
      clockOut: entry.clockOut ? new Date(entry.clockOut).toISOString().slice(0, 16) : '',
      notes: entry.notes || ''
    });
    setEditDialog(true);
  };

  const handleEditSave = async () => {
    try {
      setLoading(true);
      await updateEntry(editingEntry._id, {
        clockIn: editForm.clockIn ? new Date(editForm.clockIn) : undefined,
        clockOut: editForm.clockOut ? new Date(editForm.clockOut) : undefined,
        notes: editForm.notes
      });
      setSuccess('✓ Entry updated successfully');
      setEditDialog(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      setLoading(true);
      await deleteEntry(id);
      setSuccess('✓ Entry deleted successfully');
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Role', 'Clock In', 'Clock Out', 'Duration (minutes)', 'Notes'];
    const rows = data.map(row => [
      new Date(row.date).toLocaleDateString(),
      row.staffName,
      row.role,
      new Date(row.clockIn).toLocaleString(),
      row.clockOut ? new Date(row.clockOut).toLocaleString() : 'Active',
      row.durationMinutes || 0,
      row.notes || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      {/* Header with Glass Morphism */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <TimerIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Time Tracking System
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track work hours, manage attendance, and generate reports
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => load(page)} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to CSV">
              <IconButton onClick={exportToCSV} disabled={!data.length}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      {/* Alerts */}
      <Collapse in={!!error}>
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
      </Collapse>
      <Collapse in={!!success}>
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>
      </Collapse>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Zoom in timeout={300}>
            <Card elevation={0} sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Today's Hours</Typography>
                    <Typography variant="h4" fontWeight="bold">{stats.todayHours}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                    <CalendarIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} md={3}>
          <Zoom in timeout={400}>
            <Card elevation={0} sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>This Week</Typography>
                    <Typography variant="h4" fontWeight="bold">{stats.weekHours}h</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                    <TrendingIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} md={3}>
          <Zoom in timeout={500}>
            <Card elevation={0} sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>This Month</Typography>
                    <Typography variant="h4" fontWeight="bold">{stats.monthHours}h</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                    <ReportIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} md={3}>
          <Zoom in timeout={600}>
            <Card elevation={0} sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              borderRadius: 3,
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Total Entries</Typography>
                    <Typography variant="h4" fontWeight="bold">{total}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                    <PersonIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Clock In/Out Section */}
      <Paper elevation={0} sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Current Status
            </Typography>
            {clockedIn ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={<PlayIcon />}
                  label="CLOCKED IN"
                  color="success"
                  sx={{ fontWeight: 'bold', fontSize: '1rem', px: 1 }}
                />
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {formatElapsedTime(elapsedTime)}
                </Typography>
              </Box>
            ) : (
              <Chip
                icon={<StopIcon />}
                label="CLOCKED OUT"
                color="default"
                sx={{ fontWeight: 'bold', fontSize: '1rem', px: 1 }}
              />
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayIcon />}
              onClick={doClockIn}
              disabled={clockedIn || loading}
              sx={{
                background: 'linear-gradient(45deg, #43e97b 30%, #38f9d7 90%)',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(45deg, #38f9d7 30%, #43e97b 90%)'
                }
              }}
            >
              Clock In
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<StopIcon />}
              onClick={doClockOut}
              disabled={!clockedIn || loading}
              sx={{
                background: 'linear-gradient(45deg, #f093fb 30%, #f5576c 90%)',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(45deg, #f5576c 30%, #f093fb 90%)'
                }
              }}
            >
              Clock Out
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper elevation={0} sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.95)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Filters</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Grid>
          {isManager && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="User ID (Optional)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Leave empty for all users"
              />
            </Grid>
          )}
          <Grid item xs={12} sm={6} md={isManager ? 3 : 6}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<FilterIcon />}
              onClick={() => load(1)}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Time Entries Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" fontWeight="bold">
            Time Entries ({total} total)
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Clock In</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Clock Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                {isManager && <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isManager ? 9 : 8} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1" color="text.secondary">
                      No time entries found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <Fade in timeout={300 + index * 50} key={row._id}>
                    <TableRow hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                            {row.staffName?.charAt(0) || 'U'}
                          </Avatar>
                          {row.staffName}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.role} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{new Date(row.clockIn).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        {row.clockOut ? (
                          new Date(row.clockOut).toLocaleTimeString()
                        ) : (
                          <Chip label="Active" size="small" color="success" icon={<PlayIcon />} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" color="primary.main">
                          {formatDuration(row.durationMinutes)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.clockOut ? (
                          <Chip icon={<CheckIcon />} label="Complete" size="small" color="success" />
                        ) : (
                          <Chip icon={<TimerIcon />} label="In Progress" size="small" color="warning" />
                        )}
                      </TableCell>
                      <TableCell>{row.notes || '-'}</TableCell>
                      {isManager && (
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Edit Entry">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditOpen(row)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Entry">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(row._id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  </Fade>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(e, newPage) => load(newPage + 1)}
          rowsPerPage={20}
          rowsPerPageOptions={[20]}
        />
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">Edit Time Entry</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Clock In"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={editForm.clockIn}
              onChange={(e) => setEditForm({ ...editForm, clockIn: e.target.value })}
            />
            <TextField
              fullWidth
              label="Clock Out"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={editForm.clockOut}
              onChange={(e) => setEditForm({ ...editForm, clockOut: e.target.value })}
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Add notes about this time entry..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={loading}
            startIcon={<CheckIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
