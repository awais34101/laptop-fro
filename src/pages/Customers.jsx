import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Button, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, Alert, Collapse, IconButton, Chip,
  Grid, Card, CardContent, InputAdornment, Divider
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, 
  Warning as WarningIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { hasPerm } from '../utils/permissions';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchCustomers = () => api.get('/customers').then(r => {
    setCustomers(r.data);
    setFilteredCustomers(r.data);
  });
  const fetchInactiveCustomers = () => api.get('/customers/inactive').then(r => setInactiveCustomers(r.data.customers || []));

  useEffect(() => { 
    fetchCustomers(); 
    fetchInactiveCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const handleOpen = (customer) => {
    if (customer) {
      setForm({ name: customer.name, phone: customer.phone, email: customer.email });
      setEditId(customer._id);
    } else {
      setForm({ name: '', phone: '', email: '' });
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
        await api.put(`/customers/${editId}`, form);
        setSuccess('Customer updated successfully!');
      } else {
        await api.post('/customers', form);
        setSuccess('Customer added successfully!');
      }
      fetchCustomers();
      fetchInactiveCustomers();
      setTimeout(() => {
        setOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setSuccess('Customer deleted successfully!');
      fetchCustomers();
      fetchInactiveCustomers();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Delete failed');
    }
  };

  const activeCustomers = customers.length - inactiveCustomers.length;

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            fontSize: { xs: '2rem', md: '3rem' }
          }}
        >
          Customer Management
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#64748b', fontSize: '1.1rem' }}>
          Manage and track all your customers in one place
        </Typography>
      </Box>

      {/* Global Success/Error Messages */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, fontSize: '1.05rem', fontWeight: 600 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, fontSize: '1.05rem', fontWeight: 600 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-8px)' }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    {customers.length}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Total Customers
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(17, 153, 142, 0.4)',
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-8px)' }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    {activeCustomers}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Active Customers
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)',
              transition: 'transform 0.3s',
              '&:hover': { transform: 'translateY(-8px)' }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    {inactiveCustomers.length}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Inactive Customers
                  </Typography>
                </Box>
                <AccessTimeIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Inactive Customers Alert */}
      {inactiveCustomers.length > 0 && (
        <Paper 
          sx={{ 
            p: 3, 
            mb: 4, 
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '3px solid #ef4444',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WarningIcon sx={{ color: '#dc2626', fontSize: 40 }} />
              <Box>
                <Typography variant="h5" sx={{ color: '#dc2626', fontWeight: 800 }}>
                  ⚠️ Inactive Customers Alert
                </Typography>
                <Typography variant="body1" sx={{ color: '#991b1b', fontWeight: 600, mt: 0.5 }}>
                  {inactiveCustomers.length} customers need follow-up
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setShowInactive(!showInactive)}
              sx={{ 
                transform: showInactive ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                background: 'white',
                '&:hover': { background: '#fef2f2' }
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 32, color: '#dc2626' }} />
            </IconButton>
          </Box>

          <Collapse in={showInactive}>
            <TableContainer 
              sx={{ 
                background: 'white', 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                mt: 2
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                    <TableCell sx={{ fontWeight: 800, color: '#991b1b', fontSize: '1.05rem' }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#991b1b', fontSize: '1.05rem' }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#991b1b', fontSize: '1.05rem' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#991b1b', fontSize: '1.05rem' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inactiveCustomers.map((c, idx) => (
                    <TableRow 
                      key={c._id} 
                      sx={{ 
                        '&:hover': { background: '#fef2f2' },
                        background: idx % 2 === 0 ? '#ffffff' : '#fef2f2',
                        transition: 'background 0.2s'
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{c.name}</TableCell>
                      <TableCell sx={{ fontSize: '1.05rem' }}>{c.phone || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: '1.05rem' }}>{c.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={c.message}
                          size="medium"
                          sx={{ 
                            background: '#dc2626',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            px: 1
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Paper>
      )}

      {/* Action Bar with Search and Add Button */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          background: 'white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Search customers by name, phone, or email..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              flex: 1,
              minWidth: '300px',
              '& .MuiOutlinedInput-root': {
                fontSize: '1.05rem',
                '&:hover fieldset': { borderColor: '#667eea' },
                '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#667eea', fontSize: 28 }} />
                </InputAdornment>
              )
            }}
          />
          {hasPerm('customers', 'create') && (
            <Button 
              variant="contained" 
              onClick={() => handleOpen()}
              startIcon={<PersonAddIcon />}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1.05rem',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)'
                },
                transition: 'all 0.3s'
              }}
            >
              Add Customer
            </Button>
          )}
        </Box>
        
        <Typography variant="body2" sx={{ mt: 2, color: '#64748b', fontSize: '1rem' }}>
          Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
        </Typography>
      </Paper>

      {/* Customers Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', py: 2.5 }}>Customer Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', py: 2.5 }}>Phone</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', py: 2.5 }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', py: 2.5 }}>Created Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', py: 2.5, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                  <PeopleIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                    {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c, idx) => (
                <TableRow 
                  key={c._id}
                  sx={{ 
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #f0f4ff 0%, #e5e7ff 100%)',
                      transform: 'scale(1.01)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, fontSize: '1.05rem', py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '1.2rem'
                        }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </Box>
                      {c.name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '1.05rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ color: '#667eea', fontSize: 20 }} />
                      {c.phone || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '1.05rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon sx={{ color: '#667eea', fontSize: 20 }} />
                      {c.email || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '1.05rem', color: '#64748b' }}>
                    {new Date(c.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {hasPerm('customers','edit') && (
                        <Button 
                          size="medium"
                          variant="contained"
                          onClick={() => handleOpen(c)}
                          startIcon={<EditIcon />}
                          sx={{ 
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(17, 153, 142, 0.4)'
                            },
                            transition: 'all 0.3s'
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      {hasPerm('customers','delete') && (
                        <Button 
                          size="medium"
                          variant="contained"
                          color="error"
                          onClick={() => handleDelete(c._id)}
                          startIcon={<DeleteIcon />}
                          sx={{ 
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(245, 87, 108, 0.4)'
                            },
                            transition: 'all 0.3s'
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Add/Edit Customer Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 800,
            py: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonAddIcon sx={{ fontSize: 32 }} />
            {editId ? 'Edit Customer' : 'Add New Customer'}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, fontSize: '1.05rem', fontWeight: 600 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 3, fontSize: '1.05rem', fontWeight: 600 }}
            >
              {success}
            </Alert>
          )}
          
          <TextField 
            margin="dense" 
            label="Customer Name" 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            fullWidth 
            required
            sx={{ 
              mb: 2.5,
              '& .MuiInputLabel-root': { fontSize: '1.1rem', fontWeight: 600 },
              '& .MuiOutlinedInput-root': {
                fontSize: '1.05rem',
                '&:hover fieldset': { borderColor: '#667eea' },
                '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 }
              }
            }}
          />
          
          <Divider sx={{ my: 2 }}>
            <Chip 
              label="Optional Information" 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.95rem'
              }} 
            />
          </Divider>
          
          <TextField 
            margin="dense" 
            label="Phone Number (Optional)" 
            name="phone" 
            value={form.phone} 
            onChange={handleChange} 
            fullWidth
            sx={{ 
              mb: 2.5,
              '& .MuiInputLabel-root': { fontSize: '1.1rem', fontWeight: 600 },
              '& .MuiOutlinedInput-root': {
                fontSize: '1.05rem',
                '&:hover fieldset': { borderColor: '#667eea' },
                '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon sx={{ color: '#667eea' }} />
                </InputAdornment>
              )
            }}
            helperText="You can add this later if not available now"
          />
          
          <TextField 
            margin="dense" 
            label="Email Address (Optional)" 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            fullWidth
            type="email"
            sx={{ 
              '& .MuiInputLabel-root': { fontSize: '1.1rem', fontWeight: 600 },
              '& .MuiOutlinedInput-root': {
                fontSize: '1.05rem',
                '&:hover fieldset': { borderColor: '#667eea' },
                '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#667eea' }} />
                </InputAdornment>
              )
            }}
            helperText="You can add this later if not available now"
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#64748b',
              px: 3,
              '&:hover': {
                background: '#f1f5f9'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!form.name.trim()}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontSize: '1.05rem',
              fontWeight: 700,
              px: 4,
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)'
              },
              '&:disabled': {
                background: '#cbd5e1',
                color: '#94a3b8'
              },
              transition: 'all 0.3s'
            }}
          >
            {editId ? 'Update Customer' : 'Add Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
