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
    scanning: false,
    scanProgress: 0,
    scanStage: 'idle' // idle, scanning, complete
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
      const response = await api.get('/users/list');
      setAllUsers(response.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const simulateFingerprintScan = async (onProgress) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        if (onProgress) onProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          const mockTemplate = `FINGERPRINT_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          resolve(mockTemplate);
        }
      }, 40); // Update every 40ms for smooth animation (100/2 * 40 = 2000ms total)
    });
  };

  const handleEnrollOpen = (user) => {
    setSelectedUser(user);
    setEnrollForm({
      employeeId: user.employeeId || `EMP${Date.now().toString().slice(-6)}`,
      scanning: false,
      scanProgress: 0,
      scanStage: 'idle'
    });
    setEnrollDialog(true);
  };

  const handleEnrollFingerprint = async () => {
    try {
      setEnrollForm(prev => ({ ...prev, scanning: true, scanProgress: 0, scanStage: 'scanning' }));
      setError('');
      setSuccess('');

      const fingerprintTemplate = await simulateFingerprintScan((progress) => {
        setEnrollForm(prev => ({ ...prev, scanProgress: progress }));
      });

      setEnrollForm(prev => ({ ...prev, scanStage: 'complete' }));

      const response = await api.post('/biometric/enroll', {
        userId: selectedUser._id,
        fingerprintTemplate,
        employeeId: enrollForm.employeeId
      });

      setSuccess(`Fingerprint enrolled successfully for ${selectedUser.name}`);
      
      // Keep dialog open for a moment to show success animation
      setTimeout(() => {
        setEnrollDialog(false);
        loadEnrolledStaff();
        loadAllUsers();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to enroll fingerprint');
      setEnrollForm(prev => ({ ...prev, scanning: false, scanStage: 'idle', scanProgress: 0 }));
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

              {enrollForm.scanning || enrollForm.scanStage !== 'idle' ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  {/* iPhone-style Fingerprint Animation */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: 180,
                      height: 180,
                      margin: '0 auto 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Background Circle */}
                    <Box
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '4px solid',
                        borderColor: enrollForm.scanStage === 'complete' ? 'success.main' : 'grey.300',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    
                    {/* Progress Circle */}
                    <Box
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: `conic-gradient(
                          ${enrollForm.scanStage === 'complete' ? '#4caf50' : '#1976d2'} ${enrollForm.scanProgress * 3.6}deg,
                          transparent ${enrollForm.scanProgress * 3.6}deg
                        )`,
                        transition: 'background 0.1s linear',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: 8,
                          borderRadius: '50%',
                          bgcolor: 'background.paper'
                        }
                      }}
                    />

                    {/* Fingerprint Icon */}
                    <FingerprintIcon
                      sx={{
                        fontSize: 100,
                        color: enrollForm.scanStage === 'complete' ? 'success.main' : 'primary.main',
                        zIndex: 1,
                        animation: enrollForm.scanStage === 'scanning' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                        '@keyframes pulse': {
                          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                          '50%': { transform: 'scale(1.05)', opacity: 0.8 }
                        },
                        transition: 'color 0.3s ease'
                      }}
                    />
                    
                    {/* Progress Percentage */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: 'background.paper',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: enrollForm.scanStage === 'complete' ? 'success.main' : 'primary.main'
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" color={enrollForm.scanStage === 'complete' ? 'success.main' : 'primary.main'}>
                        {Math.round(enrollForm.scanProgress)}%
                      </Typography>
                    </Box>

                    {/* Success Checkmark */}
                    {enrollForm.scanStage === 'complete' && (
                      <CheckIcon
                        sx={{
                          position: 'absolute',
                          top: -12,
                          right: -12,
                          fontSize: 48,
                          color: 'success.main',
                          bgcolor: 'background.paper',
                          borderRadius: '50%',
                          animation: 'scaleIn 0.3s ease-out',
                          '@keyframes scaleIn': {
                            '0%': { transform: 'scale(0)', opacity: 0 },
                            '100%': { transform: 'scale(1)', opacity: 1 }
                          }
                        }}
                      />
                    )}
                  </Box>

                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {enrollForm.scanStage === 'complete' ? 'Scan Complete!' : 'Scanning Fingerprint...'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {enrollForm.scanStage === 'complete' 
                      ? 'Fingerprint captured successfully!' 
                      : 'Keep your finger steady on the scanner'}
                  </Typography>
                  
                  {/* Scanning Tips */}
                  {enrollForm.scanStage === 'scanning' && (
                    <Box sx={{ mt: 3, textAlign: 'left', maxWidth: 300, mx: 'auto' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        💡 <strong>Tips:</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        • Keep finger flat and still
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        • Cover entire sensor area
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        • Apply gentle pressure
                      </Typography>
                    </Box>
                  )}
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
