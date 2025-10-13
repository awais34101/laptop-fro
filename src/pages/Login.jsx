import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert, 
  Paper, 
  Container,
  Avatar,
  Fade,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import { 
  LaptopMac as LaptopIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Business as BusinessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../services/api';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  background: 'rgba(255, 255, 255, 0.9)',
  minWidth: 420,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  }
}));

const BackgroundBox = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff0a' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  }
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1.5),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    '&.Mui-focused': {
      backgroundColor: 'white',
    }
  }
}));

const LoginButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  fontSize: '1.1rem',
  fontWeight: 600,
  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
    boxShadow: '0 6px 25px rgba(102, 126, 234, 0.4)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0px)',
  },
  transition: 'all 0.2s ease-in-out',
}));

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/users/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      // Redirect to first allowed page based on permissions
      const perms = res.data.user.permissions || {};
      const isAdmin = res.data.user.role === 'admin';
      
      // Try to find the first page the user has access to
      if (isAdmin || perms.dashboard?.view) {
        window.location.href = '/';
      } else if (perms.items?.view) {
        window.location.href = '/items';
      } else if (perms.inventoryBoxes?.view) {
        window.location.href = '/inventory-boxes';
      } else if (perms.checklists?.view) {
        window.location.href = '/checklists';
      } else if (perms.purchases?.view) {
        window.location.href = '/purchases';
      } else if (perms.warehouse?.view) {
        window.location.href = '/warehouse';
      } else if (perms.transfers?.view) {
        window.location.href = '/transfers';
      } else if (perms.returnsStore?.view) {
        window.location.href = '/returns-store';
      } else if (perms.returnsStore2?.view) {
        window.location.href = '/returns-store2';
      } else if (perms.store?.view) {
        window.location.href = '/store';
      } else if (perms.store2?.view) {
        window.location.href = '/store2';
      } else if (perms.sales?.view) {
        window.location.href = '/sales';
      } else if (perms.salesStore2?.view) {
        window.location.href = '/sales-store2';
      } else if (perms.closingStore1?.view) {
        window.location.href = '/closing/store1';
      } else if (perms.closingStore2?.view) {
        window.location.href = '/closing/store2';
      } else if (perms.partsInventory?.view) {
        window.location.href = '/parts-inventory';
      } else if (perms.parts?.view) {
        window.location.href = '/parts-requests';
      } else if (perms.purchaseSheets?.view) {
        window.location.href = '/sheets';
      } else if (perms.documents?.view) {
        window.location.href = '/documents';
      } else if (perms.expenses?.view) {
        window.location.href = '/expenses';
      } else if (perms.time?.view) {
        window.location.href = '/time';
      } else if (perms.customers?.view) {
        window.location.href = '/customers';
      } else if (perms.technicians?.view) {
        window.location.href = '/technicians';
      } else if (perms.settings?.view) {
        window.location.href = '/settings';
      } else {
        // If user has no view permissions for any page, show error
        setError('Your account has no page access permissions. Please contact administrator.');
        setLoading(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <BackgroundBox>
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <StyledPaper elevation={0}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar 
                sx={{ 
                  mb: 2, 
                  bgcolor: 'transparent',
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  width: 64, 
                  height: 64,
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                }}
              >
                <LaptopIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center'
                }}
              >
                UAE Laptop CRM
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BusinessIcon sx={{ color: '#666', fontSize: 18 }} />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Professional Business Management
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3, opacity: 0.3 }} />

            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Fade in>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 2,
                      borderRadius: 1.5,
                      '& .MuiAlert-message': {
                        fontWeight: 500
                      }
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}
              
              <StyledTextField
                label="Email or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                required
                variant="outlined"
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <StyledTextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                required
                variant="outlined"
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        sx={{ color: '#667eea' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              
              <LoginButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !email || !password}
                size="large"
              >
                {loading ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Signing in...</span>
                  </Box>
                ) : (
                  'Sign In'
                )}
              </LoginButton>
            </Box>

            <Box mt={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                © 2025 UAE Laptop Business CRM
              </Typography>
            </Box>
          </StyledPaper>
        </Fade>
      </Container>
    </BackgroundBox>
  );
}
