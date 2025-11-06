import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Card, CardContent, Avatar, Alert,
  Slide, Zoom, CircularProgress, Stack, Chip, IconButton
} from '@mui/material';
import {
  Fingerprint as FingerprintIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  AccessTime as TimeIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import api from '../services/api';

export default function BiometricKiosk() {
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanProgress, setScanProgress] = useState(0);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate fingerprint scanning
  // In production, this would integrate with actual fingerprint hardware
  const simulateFingerprintScan = async (onProgress) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        if (onProgress) onProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          const mockTemplate = `FINGERPRINT_${Date.now()}_${Math.random().toString(36)}`;
          resolve(mockTemplate);
        }
      }, 40); // Update every 40ms for smooth animation (100/2 * 40 = 2000ms total)
    });
  };

  const handleScan = async () => {
    try {
      setStatus('scanning');
      setMessage('Please place your finger on the scanner...');
      setLoading(true);
      setUser(null);
      setScanProgress(0);

      // Get fingerprint template
      const fingerprintTemplate = await simulateFingerprintScan((progress) => {
        setScanProgress(progress);
      });

      // Verify fingerprint with backend
      const response = await api.post('/biometric/verify', { fingerprintTemplate });

      if (response.data.success) {
        setUser(response.data.user);
        setClockedIn(response.data.user.currentlyClockedIn);
        setStatus('verified');
        setMessage(`Welcome, ${response.data.user.name}!`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Fingerprint not recognized. Please try again.');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
        setScanProgress(0);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      setStatus('scanning');
      setMessage('Scanning for clock in...');
      setScanProgress(0);

      const fingerprintTemplate = await simulateFingerprintScan((progress) => {
        setScanProgress(progress);
      });
      const response = await api.post('/biometric/clock-in', { fingerprintTemplate });

      setStatus('success');
      setMessage(response.data.message);
      setClockedIn(true);

      setTimeout(() => {
        setStatus('idle');
        setUser(null);
        setMessage('');
        setScanProgress(0);
      }, 4000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Clock in failed. Please try again.');
      setTimeout(() => {
        setStatus('idle');
        setUser(null);
        setMessage('');
        setScanProgress(0);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      setStatus('scanning');
      setMessage('Scanning for clock out...');
      setScanProgress(0);

      const fingerprintTemplate = await simulateFingerprintScan((progress) => {
        setScanProgress(progress);
      });
      const response = await api.post('/biometric/clock-out', { fingerprintTemplate });

      setStatus('success');
      setMessage(response.data.message);
      setClockedIn(false);

      setTimeout(() => {
        setStatus('idle');
        setUser(null);
        setMessage('');
        setScanProgress(0);
      }, 4000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Clock out failed. Please try again.');
      setTimeout(() => {
        setStatus('idle');
        setUser(null);
        setMessage('');
        setScanProgress(0);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStatus('idle');
    setUser(null);
    setMessage('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      {/* Time Display */}
      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          p: 2,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TimeIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            {currentTime.toLocaleTimeString()}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
      </Paper>

      {/* Main Content */}
      <Box sx={{ maxWidth: 600, width: '100%' }}>
        {/* Logo/Header */}
        <Zoom in timeout={500}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4
            }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                margin: '0 auto 20px',
                bgcolor: 'primary.main'
              }}
            >
              <FingerprintIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold" gutterBottom sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              PRO CRM
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Biometric Time Tracking
            </Typography>
          </Paper>
        </Zoom>

        {/* Status Card */}
        <Slide direction="up" in timeout={700}>
          <Card
            elevation={3}
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              overflow: 'visible'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Idle State */}
              {status === 'idle' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    Ready to Clock In/Out
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Place your finger on the scanner to begin
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<FingerprintIcon />}
                    onClick={handleScan}
                    disabled={loading}
                    sx={{
                      py: 2,
                      px: 6,
                      fontSize: '1.2rem',
                      borderRadius: 3,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)'
                      }
                    }}
                  >
                    Scan Fingerprint
                  </Button>
                </Box>
              )}

              {/* Scanning State */}
              {status === 'scanning' && (
                <Box sx={{ textAlign: 'center' }}>
                  {/* iPhone-style Fingerprint Animation */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: 200,
                      height: 200,
                      margin: '0 auto 32px',
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
                        borderColor: 'grey.300',
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
                          #667eea ${scanProgress * 3.6}deg,
                          transparent ${scanProgress * 3.6}deg
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
                        fontSize: 120,
                        color: 'primary.main',
                        zIndex: 1,
                        animation: 'pulse 1.5s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                          '50%': { transform: 'scale(1.05)', opacity: 0.8 }
                        }
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
                        px: 2.5,
                        py: 0.5,
                        borderRadius: 2,
                        border: '3px solid',
                        borderColor: 'primary.main',
                        boxShadow: 2
                      }}
                    >
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {Math.round(scanProgress)}%
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Scanning Fingerprint...
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {message}
                  </Typography>
                </Box>
              )}

              {/* User Verified State */}
              {status === 'verified' && user && (
                <Zoom in>
                  <Box>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      {user.photoUrl ? (
                        <Avatar
                          src={user.photoUrl}
                          sx={{ width: 120, height: 120, margin: '0 auto 16px' }}
                        />
                      ) : (
                        <Avatar
                          sx={{
                            width: 120,
                            height: 120,
                            margin: '0 auto 16px',
                            bgcolor: 'primary.main',
                            fontSize: '3rem'
                          }}
                        >
                          {user.name?.charAt(0)}
                        </Avatar>
                      )}
                      <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {user.name}
                      </Typography>
                      <Chip
                        label={user.role}
                        color="primary"
                        sx={{ mb: 1, textTransform: 'capitalize' }}
                      />
                      {user.employeeId && (
                        <Typography variant="body2" color="text.secondary">
                          Employee ID: {user.employeeId}
                        </Typography>
                      )}
                      
                      {clockedIn && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          You are currently clocked in
                        </Alert>
                      )}
                    </Box>

                    <Stack spacing={2}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        color="success"
                        startIcon={<LoginIcon />}
                        onClick={handleClockIn}
                        disabled={clockedIn || loading}
                        sx={{ py: 2, borderRadius: 2 }}
                      >
                        Clock In
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        color="error"
                        startIcon={<LogoutIcon />}
                        onClick={handleClockOut}
                        disabled={!clockedIn || loading}
                        sx={{ py: 2, borderRadius: 2 }}
                      >
                        Clock Out
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        startIcon={<HomeIcon />}
                        onClick={handleCancel}
                        disabled={loading}
                        sx={{ py: 2, borderRadius: 2 }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Box>
                </Zoom>
              )}

              {/* Success State */}
              {status === 'success' && (
                <Zoom in>
                  <Box sx={{ textAlign: 'center' }}>
                    <CheckIcon sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Success!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {message}
                    </Typography>
                  </Box>
                </Zoom>
              )}

              {/* Error State */}
              {status === 'error' && (
                <Zoom in>
                  <Box sx={{ textAlign: 'center' }}>
                    <ErrorIcon sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Error
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {message}
                    </Typography>
                  </Box>
                </Zoom>
              )}
            </CardContent>
          </Card>
        </Slide>

        {/* Instructions */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 3,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Instructions:
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Place your enrolled finger on the scanner
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            2. Wait for your identity to be verified
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            3. Select Clock In or Clock Out
          </Typography>
          <Typography variant="body2" color="text.secondary">
            4. Wait for confirmation before leaving
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
