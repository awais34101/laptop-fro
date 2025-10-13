import React, { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Typography, MenuItem, Select, FormControl,
  InputLabel, Chip, Alert, Grid, Card, CardContent, CardHeader, CardActions,
  Autocomplete, Divider, LinearProgress, InputAdornment, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Tooltip, Badge, Fade, Zoom, Collapse, Stack, ButtonGroup, Menu,
  Radio, RadioGroup, FormControlLabel, FormLabel
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon,
  AddBox as AddBoxIcon, ViewList as ViewListIcon, Clear as ClearIcon,
  Refresh as RefreshIcon, LocationOn as LocationIcon, Category as CategoryIcon,
  Storage as StorageIcon, AutoAwesome as AutoAwesomeIcon, Inventory2 as InventoryIcon,
  TrendingUp as TrendingUpIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon,
  FilterList as FilterIcon, Sort as SortIcon, MoreVert as MoreVertIcon,
  QrCode as QrCodeIcon, Print as PrintIcon, Download as DownloadIcon,
  Insights as InsightsIcon, Speed as SpeedIcon
} from '@mui/icons-material';
import api from '../services/api';

const InventoryBoxes = () => {
  const [boxes, setBoxes] = useState([]);
  const [items, setItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Store');
  const [openBoxDialog, setOpenBoxDialog] = useState(false);
  const [openSmartCreateDialog, setOpenSmartCreateDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openAddItemDialog, setOpenAddItemDialog] = useState(false);
  const [addItemForm, setAddItemForm] = useState({
    itemId: '',
    quantity: 0,
    notes: ''
  });
  
  // New advanced features state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'full', 'inactive'
  const [sortBy, setSortBy] = useState('number'); // 'number', 'capacity', 'utilization'
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBoxMenu, setSelectedBoxMenu] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState('createNew'); // 'createNew' or 'addToExisting'
  const [availableBoxes, setAvailableBoxes] = useState([]); // Boxes with available space
  const [selectedExistingBox, setSelectedExistingBox] = useState(null);

  const [boxForm, setBoxForm] = useState({
    boxNumber: '', location: 'Store', description: '', capacity: 50, status: 'Active'
  });

  const [smartCreateForm, setSmartCreateForm] = useState({
    itemId: '', numberOfBoxes: 1, capacity: 50
  });

  useEffect(() => {
    setError(''); // Clear errors when changing location
    fetchBoxesByLocation(selectedLocation);
    fetchAvailableInventory(selectedLocation);
    fetchStats();
    fetchItems();
  }, [selectedLocation]);

  const fetchBoxesByLocation = async (location) => {
    try {
      setLoading(true);
      const response = await api.get(`/inventory-boxes/location/${location}`);
      
      // Sort boxes numerically by boxNumber (backup sorting in case backend doesn't)
      const sortedBoxes = (response.data.boxes || []).sort((a, b) => {
        const numA = parseInt(a.boxNumber) || 0;
        const numB = parseInt(b.boxNumber) || 0;
        return numA - numB;
      });
      
      setBoxes(sortedBoxes);
      
      // Get boxes with available space
      const boxesWithSpace = sortedBoxes.filter(box => {
        const totalItems = box.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        return totalItems < box.capacity && box.status !== 'Inactive';
      }).map(box => {
        const totalItems = box.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        return {
          ...box,
          availableSpace: box.capacity - totalItems
        };
      });
      setAvailableBoxes(boxesWithSpace);
      
      // Don't clear error here - let other functions manage their own errors
    } catch (err) {
      console.error(`Failed to fetch boxes for ${location}:`, err);
      setError(err.response?.data?.error || `Failed to fetch boxes for ${location}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableInventory = async (location) => {
    try {
      setLoadingItems(true);
      setError(''); // Clear any previous errors before starting
      const response = await api.get(`/inventory-boxes/location/${location}/available`);
      console.log(`Available items for ${location}:`, response.data);
      setAvailableItems(response.data || []);
      if (!response.data || response.data.length === 0) {
        console.warn(`No available items for boxing in ${location}`);
      }
    } catch (err) {
      console.error('Failed to fetch available inventory:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load available items';
      setError(`Failed to load items for ${location}: ${errorMsg}`);
      setAvailableItems([]); // Clear items on error
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/items');
      setItems(response.data || []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/inventory-boxes/stats');
      setStats(response.data || {});
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleCreateBox = async () => {
    try {
      setLoading(true);
      await api.post('/inventory-boxes', { ...boxForm, location: selectedLocation });
      setSuccess('Box created successfully!');
      setOpenBoxDialog(false);
      resetBoxForm();
      fetchBoxesByLocation(selectedLocation);
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create box');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBox = async () => {
    try {
      setLoading(true);
      await api.put(`/inventory-boxes/${selectedBox._id}`, boxForm);
      setSuccess('Box updated successfully!');
      setOpenBoxDialog(false);
      setSelectedBox(null);
      resetBoxForm();
      fetchBoxesByLocation(selectedLocation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update box');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBox = async (boxId) => {
    if (!window.confirm('Are you sure you want to delete this box?')) return;
    try {
      setLoading(true);
      // Save scroll position before deletion
      const scrollPosition = window.scrollY || window.pageYOffset;
      
      await api.delete(`/inventory-boxes/${boxId}`);
      setSuccess('Box deleted successfully!');
      await fetchBoxesByLocation(selectedLocation);
      fetchStats();
      
      // Restore scroll position after data is loaded
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete box');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartCreateBoxes = async () => {
    try {
      setLoading(true);
      
      if (assignmentMode === 'addToExisting') {
        // Add items to existing box
        if (!selectedExistingBox) {
          setError('Please select a box to add items to');
          setLoading(false);
          return;
        }
        
        const quantityToAdd = parseInt(smartCreateForm.capacity);
        
        if (!quantityToAdd || quantityToAdd <= 0) {
          setError('Please enter a valid quantity to add');
          setLoading(false);
          return;
        }
        
        if (quantityToAdd > selectedExistingBox.availableSpace) {
          setError(`Cannot add ${quantityToAdd} items. Only ${selectedExistingBox.availableSpace} spaces available.`);
          setLoading(false);
          return;
        }
        
        await api.post(`/inventory-boxes/${selectedExistingBox._id}/items`, {
          itemId: smartCreateForm.itemId,
          quantity: quantityToAdd,
          notes: `Added via Smart Assign on ${new Date().toLocaleDateString()}`
        });
        
        setSuccess(`Successfully added ${quantityToAdd} items to Box #${selectedExistingBox.boxNumber}!`);
      } else {
        // Create new boxes
        const numberOfBoxes = parseInt(smartCreateForm.numberOfBoxes);
        const capacity = parseInt(smartCreateForm.capacity);
        
        if (!numberOfBoxes || numberOfBoxes <= 0) {
          setError('Please enter a valid number of boxes to create');
          setLoading(false);
          return;
        }
        
        if (!capacity || capacity <= 0) {
          setError('Please enter a valid capacity per box');
          setLoading(false);
          return;
        }
        
        const response = await api.post('/inventory-boxes/smart-create', {
          location: selectedLocation,
          itemId: smartCreateForm.itemId,
          numberOfBoxes: numberOfBoxes,
          capacity: capacity
        });
        setSuccess(response.data.message || 'Boxes created successfully!');
      }
      
      setOpenSmartCreateDialog(false);
      resetSmartCreateForm();
      setAssignmentMode('createNew');
      setSelectedExistingBox(null);
      fetchBoxesByLocation(selectedLocation);
      fetchAvailableInventory(selectedLocation);
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchBoxesByLocation(selectedLocation);
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/inventory-boxes/search?query=${searchQuery}`);
      const filtered = response.data.filter(box => box.location === selectedLocation);
      setBoxes(filtered);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBox = (box) => {
    setSelectedBox(box);
    setOpenViewDialog(true);
  };

  const openEditDialog = (box) => {
    setSelectedBox(box);
    setBoxForm({
      boxNumber: box.boxNumber, location: box.location, description: box.description || '',
      capacity: box.capacity, status: box.status
    });
    setOpenBoxDialog(true);
  };

  const resetBoxForm = () => {
    setBoxForm({ boxNumber: '', location: selectedLocation, description: '', capacity: 50, status: 'Active' });
  };

  const resetSmartCreateForm = () => {
    setSmartCreateForm({ itemId: '', numberOfBoxes: 1, capacity: 50 });
    setSelectedItem(null);
  };

  // Advanced filtering and sorting
  const getFilteredAndSortedBoxes = () => {
    let filtered = [...boxes];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(box => box.status.toLowerCase() === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return (parseInt(a.boxNumber) || 0) - (parseInt(b.boxNumber) || 0);
        case 'capacity':
          return b.capacity - a.capacity;
        case 'utilization':
          return calculateUtilization(b) - calculateUtilization(a);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleMenuOpen = (event, box) => {
    setAnchorEl(event.currentTarget);
    setSelectedBoxMenu(box);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBoxMenu(null);
  };

  const handleAddItemToBox = async () => {
    try {
      setLoading(true);
      // Save scroll position before adding item
      const scrollPosition = window.scrollY || window.pageYOffset;
      
      await api.post(`/inventory-boxes/${selectedBox._id}/items`, addItemForm);
      setSuccess('Item added to box successfully!');
      setOpenAddItemDialog(false);
      setAddItemForm({ itemId: '', quantity: 0, notes: '' });
      
      // Refresh the box details
      const response = await api.get(`/inventory-boxes/${selectedBox._id}`);
      setSelectedBox(response.data);
      await fetchBoxesByLocation(selectedLocation);
      fetchAvailableInventory(selectedLocation);
      
      // Restore scroll position after data is loaded
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item to box');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItemFromBox = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item from the box?')) return;
    
    try {
      setLoading(true);
      // Save scroll position before removal
      const scrollPosition = window.scrollY || window.pageYOffset;
      
      await api.delete(`/inventory-boxes/${selectedBox._id}/items/${itemId}`);
      setSuccess('Item removed from box successfully!');
      
      // Refresh the box details
      const response = await api.get(`/inventory-boxes/${selectedBox._id}`);
      setSelectedBox(response.data);
      await fetchBoxesByLocation(selectedLocation);
      fetchAvailableInventory(selectedLocation);
      
      // Restore scroll position after data is loaded
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove item from box');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemQuantity = async (itemId, newQuantity) => {
    try {
      setLoading(true);
      // Save scroll position before updating
      const scrollPosition = window.scrollY || window.pageYOffset;
      
      await api.put(`/inventory-boxes/${selectedBox._id}/items/${itemId}`, {
        quantity: parseInt(newQuantity)
      });
      setSuccess('Item quantity updated successfully!');
      
      // Refresh the box details
      const response = await api.get(`/inventory-boxes/${selectedBox._id}`);
      setSelectedBox(response.data);
      await fetchBoxesByLocation(selectedLocation);
      
      // Restore scroll position after data is loaded
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update item quantity');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Full': return 'warning';
      case 'Inactive': return 'error';
      default: return 'default';
    }
  };

  const calculateUtilization = (box) => {
    const total = box.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    return box.capacity > 0 ? ((total / box.capacity) * 100).toFixed(1) : 0;
  };

  const getUtilizationColor = (utilization) => {
    if (utilization >= 100) return 'error';
    if (utilization >= 80) return 'warning';
    return 'success';
  };

  const isOverfilled = (box) => {
    const total = box.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    return total > box.capacity;
  };

  const getOverfillAmount = (box) => {
    const total = box.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    return total - box.capacity;
  };

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      {/* Header Section with Glass Morphism */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3, 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <StorageIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Inventory Box Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Organize and track your inventory efficiently
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Create Single Box">
              <Button 
                variant="contained" 
                startIcon={<AddBoxIcon />} 
                onClick={() => { resetBoxForm(); setSelectedBox(null); setOpenBoxDialog(true); }}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Create Box
              </Button>
            </Tooltip>
            <Tooltip title="Smart Bulk Creation">
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<AutoAwesomeIcon />} 
                onClick={() => { 
                  resetSmartCreateForm(); 
                  fetchAvailableInventory(selectedLocation);
                  setOpenSmartCreateDialog(true); 
                }}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  boxShadow: '0 4px 20px 0 rgba(76, 175, 80, 0.4)'
                }}
              >
                Smart Create
              </Button>
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

      {/* Stats Cards with Modern Design */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in timeout={300}>
            <Card 
              elevation={0}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Total Boxes</Typography>
                    <Typography variant="h3" fontWeight="bold">{stats.totalBoxes || 0}</Typography>
                  </Box>
                  <InventoryIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in timeout={400}>
            <Card 
              elevation={0}
              sx={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Active Boxes</Typography>
                    <Typography variant="h3" fontWeight="bold">{stats.activeBoxes || 0}</Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in timeout={500}>
            <Card 
              elevation={0}
              sx={{ 
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Full Boxes</Typography>
                    <Typography variant="h3" fontWeight="bold">{stats.fullBoxes || 0}</Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in timeout={600}>
            <Card 
              elevation={0}
              sx={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Total Items</Typography>
                    <Typography variant="h3" fontWeight="bold">{stats.totalItems || 0}</Typography>
                  </Box>
                  <CategoryIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Location Tabs with Modern Style */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Tabs 
          value={selectedLocation} 
          onChange={(e, newValue) => setSelectedLocation(newValue)} 
          indicatorColor="primary" 
          textColor="primary"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem'
            }
          }}
        >
          <Tab icon={<LocationIcon />} label="Store" value="Store" />
          <Tab icon={<LocationIcon />} label="Store 2" value="Store2" />
          <Tab icon={<LocationIcon />} label="Warehouse" value="Warehouse" />
        </Tabs>
      </Paper>

      {/* Search and Filter Bar */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              placeholder="Search by box number, item name..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchQuery(''); fetchBoxesByLocation(selectedLocation); }}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Filter by Status">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    startAdornment={<FilterIcon sx={{ ml: 1, mr: -0.5 }} fontSize="small" />}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="full">Full</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>

              <Tooltip title="Sort Boxes">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    startAdornment={<SortIcon sx={{ ml: 1, mr: -0.5 }} fontSize="small" />}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="number">Box Number</MenuItem>
                    <MenuItem value="capacity">Capacity</MenuItem>
                    <MenuItem value="utilization">Utilization</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>

              <ButtonGroup variant="outlined" sx={{ borderRadius: 2 }}>
                <Tooltip title="Grid View">
                  <IconButton 
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                  >
                    <AddBoxIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton 
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                  >
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>

              <Tooltip title="Search">
                <Button variant="contained" onClick={handleSearch} sx={{ borderRadius: 2 }}>
                  <SearchIcon />
                </Button>
              </Tooltip>

              <Tooltip title="Refresh">
                <Button variant="outlined" onClick={() => fetchBoxesByLocation(selectedLocation)} sx={{ borderRadius: 2 }}>
                  <RefreshIcon />
                </Button>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {availableItems.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom><strong>{availableItems.length} items available for boxing in {selectedLocation}</strong></Typography>
          <Typography variant="body2">Total available quantity: {availableItems.reduce((sum, item) => sum + item.availableForBoxing, 0)} units</Typography>
        </Alert>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">Loading boxes...</Typography>
        </Box>
      ) : getFilteredAndSortedBoxes().length === 0 ? (
        <Fade in>
          <Paper 
            elevation={0}
            sx={{ 
              p: 6, 
              textAlign: 'center', 
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.light' }}>
              <StorageIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              No boxes found in {selectedLocation}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Create your first box to start organizing your inventory efficiently
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<AddIcon />} 
              onClick={() => { resetBoxForm(); setSelectedBox(null); setOpenBoxDialog(true); }}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Create First Box
            </Button>
          </Paper>
        </Fade>
      ) : (
        <Grid container spacing={3}>
          {getFilteredAndSortedBoxes().map((box, index) => {
            const utilization = calculateUtilization(box);
            const totalItems = box.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const uniqueItems = box.items?.length || 0;
            const overfilled = isOverfilled(box);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={box._id}>
                <Zoom in timeout={300 + (index * 50)}>
                  <Card 
                    elevation={3}
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: 2,
                      borderColor: overfilled ? 'error.main' : (box.status === 'Full' ? 'warning.main' : 'primary.light'),
                      transition: 'all 0.3s',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                      },
                      background: overfilled ? 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)' : 'white'
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Badge 
                          badgeContent={uniqueItems} 
                          color="primary"
                          sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }}
                        >
                          <Avatar 
                            sx={{ 
                              bgcolor: overfilled ? 'error.main' : 'primary.main',
                              width: 48,
                              height: 48
                            }}
                          >
                            <StorageIcon />
                          </Avatar>
                        </Badge>
                      }
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" fontWeight="bold">
                            Box #{box.boxNumber}
                          </Typography>
                          {overfilled && (
                            <Tooltip title={`Overfilled by ${getOverfillAmount(box)} items`}>
                              <Chip 
                                icon={<WarningIcon />}
                                label="OVERFILL" 
                                size="small" 
                                color="error"
                                sx={{ fontWeight: 'bold' }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      }
                      subheader={
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip label={box.status} size="small" color={getStatusColor(box.status)} />
                          <Chip label={box.location} size="small" variant="outlined" />
                        </Stack>
                      }
                      action={
                        <IconButton onClick={(e) => handleMenuOpen(e, box)}>
                          <MoreVertIcon />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      {overfilled && (
                        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                          <Typography variant="caption" fontWeight="bold">
                            ⚠️ OVERFILLED: {totalItems}/{box.capacity} items (+{getOverfillAmount(box)})
                          </Typography>
                        </Alert>
                      )}

                      {box.description && (
                        <Typography 
                          variant="body2" 
                          color="textSecondary" 
                          sx={{ 
                            mb: 2, 
                            fontStyle: 'italic',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {box.description}
                        </Typography>
                      )}

                      <Divider sx={{ my: 2 }} />

                      {/* Capacity Utilization */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight="600" color="text.secondary">
                            <SpeedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            Capacity
                          </Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight="bold" 
                            color={`${getUtilizationColor(utilization)}.main`}
                          >
                            {utilization}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(utilization, 100)} 
                          color={getUtilizationColor(utilization)}
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            bgcolor: 'grey.200'
                          }} 
                        />
                        <Typography 
                          variant="caption" 
                          color={overfilled ? 'error.main' : 'textSecondary'}
                          sx={{ mt: 0.5, display: 'block', fontWeight: overfilled ? 'bold' : 'normal' }}
                        >
                          {totalItems} / {box.capacity} items
                        </Typography>
                      </Box>

                      {/* Items Preview */}
                      {box.items && box.items.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" fontWeight="600" gutterBottom color="text.secondary">
                            <CategoryIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            Items ({uniqueItems})
                          </Typography>
                          <List dense sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1 }}>
                            {box.items.slice(0, 2).map((item, idx) => (
                              <ListItem key={idx} sx={{ px: 1, borderRadius: 1 }}>
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                                    <CategoryIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                  primary={
                                    <Typography variant="body2" fontWeight="500" noWrap>
                                      {item.itemName || item.itemId?.name || 'Unknown'}
                                    </Typography>
                                  }
                                  secondary={
                                    <Chip 
                                      label={`${item.quantity} ${item.itemId?.unit || 'pcs'}`}
                                      size="small"
                                      sx={{ height: 18, fontSize: 10 }}
                                    />
                                  }
                                />
                              </ListItem>
                            ))}
                            {box.items.length > 2 && (
                              <Typography 
                                variant="caption" 
                                color="primary" 
                                sx={{ pl: 1, cursor: 'pointer', fontWeight: 600 }}
                                onClick={() => handleViewBox(box)}
                              >
                                +{box.items.length - 2} more items
                              </Typography>
                            )}
                          </List>
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        onClick={() => handleViewBox(box)} 
                        startIcon={<ViewListIcon />}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Zoom>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 180 }
        }}
      >
        <MenuItem onClick={() => { handleViewBox(selectedBoxMenu); handleMenuClose(); }}>
          <ViewListIcon fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => { openEditDialog(selectedBoxMenu); handleMenuClose(); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit Box
        </MenuItem>
        <MenuItem onClick={() => { setOpenAddItemDialog(true); setSelectedBox(selectedBoxMenu); handleMenuClose(); }}>
          <AddIcon fontSize="small" sx={{ mr: 1 }} /> Add Item
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleDeleteBox(selectedBoxMenu?._id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete Box
        </MenuItem>
      </Menu>

      <Dialog open={openBoxDialog} onClose={() => setOpenBoxDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedBox ? 'Edit Box' : 'Create New Box'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField label="Box Number" value={boxForm.boxNumber} onChange={(e) => setBoxForm({ ...boxForm, boxNumber: e.target.value })} required fullWidth />
            <TextField label="Description" value={boxForm.description} onChange={(e) => setBoxForm({ ...boxForm, description: e.target.value })} multiline rows={2} fullWidth />
            <TextField label="Capacity" type="number" value={boxForm.capacity} onChange={(e) => setBoxForm({ ...boxForm, capacity: parseInt(e.target.value) || 50 })} required fullWidth InputProps={{ inputProps: { min: 1 } }} />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={boxForm.status} label="Status" onChange={(e) => setBoxForm({ ...boxForm, status: e.target.value })}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Full">Full</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBoxDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={selectedBox ? handleUpdateBox : handleCreateBox} disabled={!boxForm.boxNumber || loading}>{selectedBox ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSmartCreateDialog} onClose={() => setOpenSmartCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Smart Create Boxes with Auto-Assignment
          <IconButton onClick={() => fetchAvailableInventory(selectedLocation)} size="small" color="primary">
            <RefreshIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Alert severity="info">
              Choose to create new boxes or add items to existing boxes with available space.
              System will optimize item distribution based on your selection.
            </Alert>

            {availableItems.length === 0 && !loadingItems && (
              <Alert severity="warning">
                No items available for boxing in <strong>{selectedLocation}</strong>. 
                Either all items are already in boxes, or there are no items in this location's inventory. 
                <br />
                Click the refresh button above to reload, or check your inventory first.
              </Alert>
            )}

            {/* Assignment Mode Selection */}
            <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ color: 'inherit', fontWeight: 'bold', mb: 1 }}>
                  How do you want to assign items?
                </FormLabel>
                <RadioGroup
                  value={assignmentMode}
                  onChange={(e) => setAssignmentMode(e.target.value)}
                >
                  <FormControlLabel 
                    value="createNew" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="600">Create New Boxes</Typography>
                        <Typography variant="caption">Create fresh boxes and auto-assign items</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="addToExisting" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="600">Add to Existing Box</Typography>
                        <Typography variant="caption">
                          Add items to a box with available space ({availableBoxes.length} boxes available)
                        </Typography>
                      </Box>
                    }
                    disabled={availableBoxes.length === 0}
                  />
                </RadioGroup>
              </FormControl>
            </Paper>

            <Autocomplete
              options={availableItems}
              loading={loadingItems}
              getOptionLabel={(option) => 
                `${option.itemName} - Available: ${option.availableForBoxing} ${option.unit || 'pcs'}`
              }
              onChange={(e, value) => {
                setSmartCreateForm({ ...smartCreateForm, itemId: value?.itemId || '' });
                setSelectedItem(value);
              }}
              noOptionsText={loadingItems ? "Loading items..." : "No items available for boxing"}
              renderInput={(params) => (
                <TextField {...params} label="Select Item to Assign" required />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">{option.itemName}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Available: {option.availableForBoxing} {option.unit || 'pcs'} | 
                      Total in {selectedLocation}: {option.totalQuantity} | 
                      In boxes: {option.quantityInBoxes}
                    </Typography>
                  </Box>
                </li>
              )}
            />

            {selectedItem && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>{selectedItem.itemName}</strong>
                </Typography>
                <Typography variant="caption">
                  Available for boxing: <strong>{selectedItem.availableForBoxing} {selectedItem.unit || 'pcs'}</strong>
                </Typography>
              </Alert>
            )}

            {/* Conditional Fields Based on Assignment Mode */}
            {assignmentMode === 'createNew' ? (
              <>
                <TextField
                  label="Number of Boxes to Create"
                  type="number"
                  value={smartCreateForm.numberOfBoxes}
                  onChange={(e) => setSmartCreateForm({ ...smartCreateForm, numberOfBoxes: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  required
                  fullWidth
                  InputProps={{ inputProps: { min: 1, max: 20 } }}
                  helperText="How many boxes do you want to create?"
                />

                <TextField
                  label="Capacity per Box"
                  type="number"
                  value={smartCreateForm.capacity}
                  onChange={(e) => setSmartCreateForm({ ...smartCreateForm, capacity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  required
                  fullWidth
                  InputProps={{ inputProps: { min: 1 } }}
                  helperText="Default: 50 pieces per box"
                />
              </>
            ) : (
              <>
                <Autocomplete
                  options={availableBoxes}
                  getOptionLabel={(option) => 
                    `Box #${option.boxNumber} - ${option.availableSpace} spaces available (${option.capacity - option.availableSpace}/${option.capacity} used)`
                  }
                  onChange={(e, value) => setSelectedExistingBox(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Box to Add Items" required />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight="bold">Box #{option.boxNumber}</Typography>
                          <Chip 
                            label={`${option.availableSpace} available`} 
                            color="success" 
                            size="small" 
                          />
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          Capacity: {option.capacity - option.availableSpace}/{option.capacity} used • 
                          Status: {option.status}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />

                {selectedExistingBox && (
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Box #{selectedExistingBox.boxNumber}</strong> has <strong>{selectedExistingBox.availableSpace}</strong> spaces available
                    </Typography>
                    <Typography variant="caption">
                      Current: {selectedExistingBox.capacity - selectedExistingBox.availableSpace}/{selectedExistingBox.capacity} items
                    </Typography>
                  </Alert>
                )}

                <TextField
                  label="Quantity to Add"
                  type="number"
                  value={smartCreateForm.capacity}
                  onChange={(e) => setSmartCreateForm({ ...smartCreateForm, capacity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  required
                  fullWidth
                  InputProps={{ 
                    inputProps: { 
                      min: 1, 
                      max: selectedExistingBox?.availableSpace || 1000 
                    } 
                  }}
                  helperText={`Maximum: ${selectedExistingBox?.availableSpace || 0} items can fit`}
                />
              </>
            )}

            {selectedItem && smartCreateForm.numberOfBoxes > 0 && smartCreateForm.capacity > 0 && assignmentMode === 'createNew' && (
              <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  📦 Distribution Preview:
                </Typography>
                <Divider sx={{ my: 1 }} />
                {(() => {
                  const totalCapacity = smartCreateForm.numberOfBoxes * smartCreateForm.capacity;
                  const available = selectedItem.availableForBoxing;
                  let remaining = available;
                  const boxes = [];
                  
                  for (let i = 0; i < smartCreateForm.numberOfBoxes; i++) {
                    const qtyForBox = Math.min(remaining, smartCreateForm.capacity);
                    boxes.push({ boxNum: i + 1, qty: qtyForBox });
                    remaining -= qtyForBox;
                  }

                  return (
                    <>
                      {boxes.map((box, idx) => (
                        <Box key={idx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" sx={{ minWidth: 80 }}>
                            <strong>Box {box.boxNum}:</strong>
                          </Typography>
                          <Chip 
                            label={`${box.qty} / ${smartCreateForm.capacity}`}
                            color={box.qty > smartCreateForm.capacity ? 'error' : (box.qty === smartCreateForm.capacity ? 'warning' : 'success')}
                            size="small"
                          />
                          {box.qty > smartCreateForm.capacity && (
                            <Chip label={`⚠️ OVERFILL +${box.qty - smartCreateForm.capacity}`} color="error" size="small" />
                          )}
                        </Box>
                      ))}
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="textSecondary">
                        Total capacity: {totalCapacity} | Available: {available} | 
                        {available > totalCapacity && (
                          <span style={{ color: 'red', fontWeight: 'bold' }}>
                            {' '}⚠️ OVERFILL: +{available - totalCapacity} items exceed capacity!
                          </span>
                        )}
                        {available <= totalCapacity && (
                          <span style={{ color: 'green' }}>
                            {' '}✓ Fits perfectly with {totalCapacity - available} spare capacity
                          </span>
                        )}
                      </Typography>
                    </>
                  );
                })()}
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSmartCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSmartCreateBoxes}
            disabled={
              !smartCreateForm.itemId || 
              (assignmentMode === 'createNew' && !smartCreateForm.numberOfBoxes) ||
              (assignmentMode === 'addToExisting' && !selectedExistingBox) ||
              loading
            }
            startIcon={<AutoAwesomeIcon />}
          >
            {assignmentMode === 'createNew' 
              ? `Create ${smartCreateForm.numberOfBoxes} Box(es)` 
              : 'Add to Box'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Box #{selectedBox?.boxNumber} - Items</span>
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<AddIcon />}
            onClick={() => setOpenAddItemDialog(true)}
          >
            Add Item
          </Button>
        </DialogTitle>
        <DialogContent>
          {selectedBox && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Location</Typography><Typography variant="body1" fontWeight="bold">{selectedBox.location}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Status</Typography><Chip label={selectedBox.status} size="small" color={getStatusColor(selectedBox.status)} /></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Capacity</Typography><Typography variant="body1" fontWeight="bold">{selectedBox.capacity} pcs</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Utilization</Typography><Typography variant="body1" fontWeight="bold" color={`${getUtilizationColor(calculateUtilization(selectedBox))}.main`}>{calculateUtilization(selectedBox)}%</Typography></Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Items in Box</Typography>
              {selectedBox.items && selectedBox.items.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Item Name</strong></TableCell>
                        <TableCell><strong>Quantity</strong></TableCell>
                        <TableCell><strong>Unit</strong></TableCell>
                        <TableCell><strong>Notes</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedBox.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.itemName || item.itemId?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(item.itemId._id || item.itemId, e.target.value)}
                              sx={{ width: '80px' }}
                              InputProps={{ inputProps: { min: 0 } }}
                            />
                          </TableCell>
                          <TableCell>{item.itemId?.unit || 'pcs'}</TableCell>
                          <TableCell>{item.notes || '-'}</TableCell>
                          <TableCell align="center">
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleRemoveItemFromBox(item.itemId._id || item.itemId)}
                              title="Remove item from box"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : <Alert severity="info">No items in this box</Alert>}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenViewDialog(false)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={openAddItemDialog} onClose={() => setOpenAddItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Item to Box #{selectedBox?.boxNumber}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={items}
              getOptionLabel={(option) => `${option.name} (${option.unit || 'pcs'})`}
              onChange={(e, value) => setAddItemForm({ ...addItemForm, itemId: value?._id || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Select Item" required />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Category: {option.category} | Unit: {option.unit || 'pcs'}
                    </Typography>
                  </Box>
                </li>
              )}
            />

            <TextField
              label="Quantity"
              type="number"
              value={addItemForm.quantity}
              onChange={(e) => setAddItemForm({ ...addItemForm, quantity: parseInt(e.target.value) || 0 })}
              required
              fullWidth
              InputProps={{ inputProps: { min: 0 } }}
            />

            <TextField
              label="Notes (Optional)"
              value={addItemForm.notes}
              onChange={(e) => setAddItemForm({ ...addItemForm, notes: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />

            <Alert severity="info">
              Current box capacity: {selectedBox?.capacity} pcs<br />
              Current items: {selectedBox?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} pcs<br />
              Available space: {(selectedBox?.capacity || 0) - (selectedBox?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0)} pcs
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddItemDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddItemToBox} 
            disabled={!addItemForm.itemId || addItemForm.quantity <= 0 || loading}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryBoxes;
