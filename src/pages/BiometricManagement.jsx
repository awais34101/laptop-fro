import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert, Collapse,
  IconButton, Tooltip, Grid, Card, CardContent, LinearProgress
} from '@mui/material';
import {
  Fingerprint as FingerprintIcon,
  PersonAdd as EnrollIcon,
  Delete as DeleteIcon,
  Photo as PhotoIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../services/api';

export default function BiometricManagement() {
  const [enrolledStaff, setEnrolledStaff] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [enrollDialog, setEnrollDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [enrollForm, setEnrollForm] = useState({
    employeeId: '',
    scanning: false
  });

  useEffect(() => {
    loadEnrolledStaff();
    loadAllUsers();
  }, []);

  const loadEnrolledStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/biometric/enrolled');
      setEnrolledStaff(response.data.staff || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load enrolled staff');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await api.get('/users');
      setAllUsers(response.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const simulateFingerprintScan = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockTemplate = `FINGERPRINT_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        resolve(mockTemplate);
      }, 2000);
    });
  };

  const handleEnrollOpen = (user) => {
    setSelectedUser(user);
    setEnrollForm({
      employeeId: user.employeeId || `EMP${Date.now().toString().slice(-6)}`,
      scanning: false
    });
    setEnrollDialog(true);
  };

  const handleEnrollFingerprint = async () => {
    try {
      setEnrollForm(prev => ({ ...prev, scanning: true }));
      setError('');
      setSuccess('');

      const fingerprintTemplate = await simulateFingerprintScan();

      const response = await api.post('/biometric/enroll', {
        userId: selectedUser._id,
        fingerprintTemplate,
        employeeId: enrollForm.employeeId
      });

      setSuccess(`Fingerprint enrolled successfully for ${selectedUser.name}`);
      setEnrollDialog(false);
      loadEnrolledStaff();
      loadAllUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to enroll fingerprint');
    } finally {
      setEnrollForm(prev => ({ ...prev, scanning: false }));
    }
  };

  const handleRemoveFingerprint = async (userId, userName) => {
    if (!window.confirm(`Remove fingerprint enrollment for ${userName}?`)) return;

    try {
      setLoading(true);
      await api.delete(`/biometric/remove/${userId}`);
      setSuccess(`Fingerprint removed for ${userName}`);
      loadEnrolledStaff();
      loadAllUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove fingerprint');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async (userId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          setLoading(true);
          await api.post('/biometric/upload-photo', {
            userId,
            photoBase64: event.target.result
          });
          setSuccess('Photo uploaded successfully');
          loadEnrolledStaff();
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to upload photo');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  };

  const unenrolledUsers = allUsers.filter(
    user => !enrolledStaff.some(enrolled => enrolled.id === user._id)
  );

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <FingerprintIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Biometric Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage fingerprint enrollment for staff time tracking
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => { loadEnrolledStaff(); loadAllUsers(); }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Alerts */}
      <Collapse in={!!error}>
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
      </Collapse>
      <Collapse in={!!success}>
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>
      </Collapse>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Enrolled Staff</Typography>
              <Typography variant="h3" fontWeight="bold">{enrolledStaff.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pending Enrollment</Typography>
              <Typography variant="h3" fontWeight="bold">{unenrolledUsers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Users</Typography>
              <Typography variant="h3" fontWeight="bold">{allUsers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enrolled Staff Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" fontWeight="bold">
            Enrolled Staff ({enrolledStaff.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Staff</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Employee ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Enrolled Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Last Used</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrolledStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No staff enrolled yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                enrolledStaff.map((staff) => (
                  <TableRow key={staff.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={staff.photoUrl} sx={{ bgcolor: 'primary.main' }}>
                          {staff.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="bold">{staff.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {staff.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{staff.employeeId || '-'}</TableCell>
                    <TableCell>
                      <Chip label={staff.role} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {staff.fingerprintEnrolledAt
                        ? new Date(staff.fingerprintEnrolledAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {staff.fingerprintLastUsed
                        ? new Date(staff.fingerprintLastUsed).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {staff.biometricEnabled ? (
                        <Chip icon={<CheckIcon />} label="Active" size="small" color="success" />
                      ) : (
                        <Chip label="Inactive" size="small" color="default" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Upload Photo">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleUploadPhoto(staff.id)}
                          >
                            <PhotoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Fingerprint">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFingerprint(staff.id, staff.name)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Unenrolled Users Table */}
      {unenrolledUsers.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: 'warning.main', color: 'white' }}>
            <Typography variant="h6" fontWeight="bold">
              Pending Enrollment ({unenrolledUsers.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unenrolledUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'grey.400' }}>
                          {user.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="bold">{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={user.role} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label="Not Enrolled" size="small" color="warning" />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<EnrollIcon />}
                        onClick={() => handleEnrollOpen(user)}
                      >
                        Enroll
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Enrollment Dialog */}
      <Dialog open={enrollDialog} onClose={() => setEnrollDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FingerprintIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Enroll Fingerprint
              </Typography>
            </Box>
            <IconButton onClick={() => setEnrollDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 80, height: 80, margin: '0 auto 16px', bgcolor: 'primary.main' }}
                >
                  {selectedUser.name?.charAt(0)}
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  {selectedUser.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser.email}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Employee ID"
                value={enrollForm.employeeId}
                onChange={(e) => setEnrollForm({ ...enrollForm, employeeId: e.target.value })}
                sx={{ mb: 3 }}
                helperText="Unique identifier for this employee"
              />

              {enrollForm.scanning ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <FingerprintIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Scanning Fingerprint...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please place finger on the scanner
                  </Typography>
                  <LinearProgress sx={{ mt: 2 }} />
                </Box>
              ) : (
                <Alert severity="info">
                  Click "Start Enrollment" and ask the staff member to place their finger on the scanner.
                  The fingerprint will be securely stored in the database.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEnrollDialog(false)} disabled={enrollForm.scanning}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEnrollFingerprint}
            disabled={enrollForm.scanning || !enrollForm.employeeId}
            startIcon={<FingerprintIcon />}
          >
            {enrollForm.scanning ? 'Scanning...' : 'Start Enrollment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
