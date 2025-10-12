import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Autocomplete,
  Tooltip,
  Divider,
  LinearProgress,
  Badge,
  InputAdornment,
  Menu,
  ButtonGroup,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fade,
  Zoom,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  AddBox as AddBoxIcon,
  ViewList as ViewListIcon,
  MoreVert as MoreVertIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import api from '../services/api';

const InventoryBoxes = () => {
  const [boxes, setBoxes] = useState([]);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState({});
  const [openBoxDialog, setOpenBoxDialog] = useState(false);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openViewItemsDialog, setOpenViewItemsDialog] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('boxNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBoxForMenu, setSelectedBoxForMenu] = useState(null);

  // Form states
  const [boxForm, setBoxForm] = useState({
    boxNumber: '',
    location: 'Showroom',
    description: '',
    capacity: 50,
    status: 'Active'
  });

  const [itemForm, setItemForm] = useState({
    itemId: '',
    quantity: 0,
    notes: ''
  });

  useEffect(() => {
    fetchBoxes();
    fetchItems();
    fetchStats();
  }, []);

  const fetchBoxes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory-boxes');
      setBoxes(res.data);
    } catch (err) {
      setError('Failed to fetch boxes');
      console.error('Fetch boxes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {
      setError('Failed to fetch items');
      console.error('Fetch items error:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/inventory-boxes/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/inventory-boxes/search?query=${searchQuery}`);
      setSearchResults(res.data);
      setSuccess(`Found ${res.data.length} result(s)`);
    } catch (err) {
      setError('Search failed');
      console.error('Search error:', err);
    }
  };

  const handleCreateBox = async () => {
    try {
      await api.post('/inventory-boxes', boxForm);
      setSuccess('Box created successfully');
      setOpenBoxDialog(false);
      resetBoxForm();
      fetchBoxes();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create box');
    }
  };

  const handleUpdateBox = async () => {
    try {
      await api.put(`/inventory-boxes/${selectedBox._id}`, boxForm);
      setSuccess('Box updated successfully');
      setOpenBoxDialog(false);
      resetBoxForm();
      fetchBoxes();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update box');
    }
  };

  const handleDeleteBox = async (id) => {
    if (!window.confirm('Are you sure you want to delete this box?')) return;
    try {
      await api.delete(`/inventory-boxes/${id}`);
      setSuccess('Box deleted successfully');
      fetchBoxes();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete box');
    }
  };

  const handleAddItemToBox = async () => {
    if (!itemForm.itemId) {
      setError('Please select an item');
      return;
    }
    try {
      await api.post(`/inventory-boxes/${selectedBox._id}/items`, itemForm);
      setSuccess('Item added to box successfully');
      setOpenItemDialog(false);
      resetItemForm();
      fetchBoxes();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item');
    }
  };

  const handleRemoveItem = async (boxId, itemId) => {
    if (!window.confirm('Remove this item from the box?')) return;
    try {
      const id = typeof itemId === 'object' && itemId._id ? itemId._id : itemId;
      await api.delete(`/inventory-boxes/${boxId}/items/${id}`);
      setSuccess('Item removed from box');
      fetchBoxes();
      fetchStats();
    } catch (err) {
      setError('Failed to remove item');
      console.error('Remove item error:', err);
    }
  };

  const openEditBox = (box) => {
    setSelectedBox(box);
    setBoxForm({
      boxNumber: box.boxNumber,
      location: box.location,
      description: box.description || '',
      capacity: box.capacity,
      status: box.status
    });
    setOpenBoxDialog(true);
  };

  const openAddItemDialog = (box) => {
    setSelectedBox(box);
    setOpenItemDialog(true);
  };

  const openViewItems = (box) => {
    setSelectedBox(box);
    setOpenViewItemsDialog(true);
  };

  const resetBoxForm = () => {
    setBoxForm({
      boxNumber: '',
      location: 'Showroom',
      description: '',
      capacity: 50,
      status: 'Active'
    });
    setSelectedBox(null);
  };

  const resetItemForm = () => {
    setItemForm({
      itemId: '',
      quantity: 0,
      notes: ''
    });
  };

  const handleMenuOpen = (event, box) => {
    setAnchorEl(event.currentTarget);
    setSelectedBoxForMenu(box);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBoxForMenu(null);
  };

  // Get unique locations for filter
  const uniqueLocations = [...new Set(boxes.map(box => box.location))];

  // Apply filters and sorting
  const getFilteredAndSortedBoxes = () => {
    let filtered = searchResults.length > 0 ? searchResults : boxes;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(box => box.status === statusFilter);
    }

    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(box => box.location === locationFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'boxNumber':
          aVal = a.boxNumber.toLowerCase();
          bVal = b.boxNumber.toLowerCase();
          break;
        case 'location':
          aVal = a.location.toLowerCase();
          bVal = b.location.toLowerCase();
          break;
        case 'itemCount':
          aVal = a.items?.length || 0;
          bVal = b.items?.length || 0;
          break;
        case 'capacity':
          aVal = a.capacity;
          bVal = b.capacity;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const displayBoxes = getFilteredAndSortedBoxes();

  // Calculate capacity percentage
  const getCapacityPercentage = (box) => {
    const itemCount = box.items?.length || 0;
    return (itemCount / box.capacity) * 100;
  };

  // Get capacity color
  const getCapacityColor = (percentage) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Full': return 'warning';
      case 'Inactive': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <InventoryIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="primary">
                Inventory Box Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Organize and track your inventory across physical locations
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => { fetchBoxes(); fetchStats(); }} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddBoxIcon />}
              onClick={() => {
                resetBoxForm();
                setOpenBoxDialog(true);
              }}
              size="large"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3
              }}
            >
              Create New Box
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Zoom in={!!error}>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Zoom>
      )}
      {success && (
        <Zoom in={!!success}>
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Zoom>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Boxes
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="primary">
                    {stats.totalBoxes || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                  <AddBoxIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Active Boxes
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {stats.activeBoxes || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Items Stored
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="info.main">
                    {stats.totalItems || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', width: 56, height: 56 }}>
                  <InventoryIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Avg Items/Box
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="warning.main">
                    {stats.averageItemsPerBox || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                  <CategoryIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters Card */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search boxes or items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ bgcolor: 'white', borderRadius: 1 }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Full">Full</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Location Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  label="Location"
                  onChange={(e) => setLocationFilter(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  {uniqueLocations.map((loc) => (
                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sort By */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="boxNumber">Box Number</MenuItem>
                  <MenuItem value="location">Location</MenuItem>
                  <MenuItem value="itemCount">Item Count</MenuItem>
                  <MenuItem value="capacity">Capacity</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sort Order */}
            <Grid item xs={12} sm={6} md={2}>
              <ButtonGroup fullWidth variant="outlined">
                <Button
                  variant={sortOrder === 'asc' ? 'contained' : 'outlined'}
                  onClick={() => setSortOrder('asc')}
                >
                  ASC
                </Button>
                <Button
                  variant={sortOrder === 'desc' ? 'contained' : 'outlined'}
                  onClick={() => setSortOrder('desc')}
                >
                  DESC
                </Button>
              </ButtonGroup>
            </Grid>
          </Grid>

          {searchResults.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Showing {searchResults.length} search result(s).{' '}
              <Button size="small" onClick={() => { setSearchResults([]); setSearchQuery(''); }}>
                Clear Search
              </Button>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Boxes Grid */}
      <Grid container spacing={3}>
        {displayBoxes.map((box) => {
          const capacityPercentage = getCapacityPercentage(box);
          const capacityColor = getCapacityColor(capacityPercentage);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={box._id}>
              <Fade in={true}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    boxShadow: 3,
                    transition: 'all 0.3s',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    },
                    border: capacityPercentage >= 90 ? '2px solid' : 'none',
                    borderColor: capacityPercentage >= 90 ? 'error.main' : 'transparent'
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AddBoxIcon />
                      </Avatar>
                    }
                    action={
                      <IconButton onClick={(e) => handleMenuOpen(e, box)}>
                        <MoreVertIcon />
                      </IconButton>
                    }
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="h6" fontWeight="bold">
                          {box.boxNumber}
                        </Typography>
                        <Chip 
                          label={box.status} 
                          size="small"
                          color={getStatusColor(box.status)}
                        />
                      </Box>
                    }
                    subheader={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {box.location}
                        </Typography>
                      </Box>
                    }
                  />

                  <CardContent>
                    {/* Description */}
                    {box.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {box.description}
                      </Typography>
                    )}

                    {/* Capacity Progress */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Capacity
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {box.items?.length || 0} / {box.capacity}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={capacityPercentage > 100 ? 100 : capacityPercentage}
                        color={capacityColor}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {capacityPercentage.toFixed(0)}% filled
                      </Typography>
                    </Box>

                    {/* Items Badge */}
                    <Box sx={{ mb: 2 }}>
                      <Badge 
                        badgeContent={box.items?.length || 0} 
                        color="primary"
                        max={999}
                      >
                        <Chip
                          icon={<ViewListIcon />}
                          label="Items in Box"
                          variant="outlined"
                          onClick={() => openViewItems(box)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Badge>
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Add Item">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => openAddItemDialog(box)}
                          fullWidth
                        >
                          Add Item
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit Box">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openEditBox(box)}
                          sx={{ border: '1px solid', borderColor: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Box">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteBox(box._id)}
                          sx={{ border: '1px solid', borderColor: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          );
        })}

        {displayBoxes.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
              <AddBoxIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No boxes found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first box to start organizing your inventory
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddBoxIcon />}
                onClick={() => {
                  resetBoxForm();
                  setOpenBoxDialog(true);
                }}
              >
                Create First Box
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Box Dialog (Create/Edit) */}
      <Dialog 
        open={openBoxDialog} 
        onClose={() => { setOpenBoxDialog(false); resetBoxForm(); }} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <AddBoxIcon />
            </Avatar>
            <Typography variant="h6">
              {selectedBox ? 'Edit Box' : 'Create New Box'}
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Box Number"
              value={boxForm.boxNumber}
              onChange={(e) => setBoxForm({ ...boxForm, boxNumber: e.target.value })}
              required
              fullWidth
              placeholder="e.g., BOX-001, SHELF-A-01"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalOfferIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Location"
              value={boxForm.location}
              onChange={(e) => setBoxForm({ ...boxForm, location: e.target.value })}
              required
              fullWidth
              placeholder="e.g., Showroom, Warehouse"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Description"
              value={boxForm.description}
              onChange={(e) => setBoxForm({ ...boxForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder="Add notes about this box..."
            />
            <TextField
              label="Capacity"
              type="number"
              value={boxForm.capacity}
              onChange={(e) => setBoxForm({ ...boxForm, capacity: parseInt(e.target.value) || 50 })}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={boxForm.status}
                onChange={(e) => setBoxForm({ ...boxForm, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="Active">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                    Active
                  </Box>
                </MenuItem>
                <MenuItem value="Full">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon fontSize="small" color="warning" />
                    Full
                  </Box>
                </MenuItem>
                <MenuItem value="Inactive">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon fontSize="small" color="action" />
                    Inactive
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => { setOpenBoxDialog(false); resetBoxForm(); }} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={selectedBox ? handleUpdateBox : handleCreateBox}
            variant="contained"
            startIcon={selectedBox ? <EditIcon /> : <AddIcon />}
          >
            {selectedBox ? 'Update Box' : 'Create Box'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Item to Box Dialog */}
      <Dialog 
        open={openItemDialog} 
        onClose={() => { setOpenItemDialog(false); resetItemForm(); }} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <AddIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Add Item to Box</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedBox?.boxNumber}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <Autocomplete
              options={items}
              getOptionLabel={(option) => option.name}
              onChange={(e, value) => setItemForm({ ...itemForm, itemId: value?._id || '' })}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Item" 
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <InventoryIcon color="action" />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
              fullWidth
            />
            <TextField
              label="Quantity"
              type="number"
              value={itemForm.quantity}
              onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 0 })}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Notes"
              value={itemForm.notes}
              onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder="Add any special notes..."
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => { setOpenItemDialog(false); resetItemForm(); }} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddItemToBox} variant="contained" startIcon={<AddIcon />}>
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Items Dialog */}
      <Dialog
        open={openViewItemsDialog}
        onClose={() => setOpenViewItemsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              <ViewListIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Items in Box {selectedBox?.boxNumber}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedBox?.location} • {selectedBox?.items?.length || 0} items
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {selectedBox?.items && selectedBox.items.length > 0 ? (
            <List>
              {selectedBox.items.map((item, index) => (
                <React.Fragment key={item._id}>
                  <ListItem
                    sx={{
                      bgcolor: index % 2 === 0 ? 'background.paper' : 'action.hover',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                      <InventoryIcon />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="medium">
                          {item.itemName}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Quantity: <strong>{item.quantity}</strong>
                          </Typography>
                          {item.notes && (
                            <Typography variant="caption" color="text.secondary">
                              Note: {item.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => {
                          const itemIdToDelete = item.itemId?._id || item.itemId;
                          handleRemoveItem(selectedBox._id, itemIdToDelete);
                          if (selectedBox.items.length === 1) {
                            setOpenViewItemsDialog(false);
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <InventoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                No items in this box yet
              </Typography>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenViewItemsDialog(false)} color="inherit">
            Close
          </Button>
          <Button
            onClick={() => {
              setOpenViewItemsDialog(false);
              openAddItemDialog(selectedBox);
            }}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, boxShadow: 3 }
        }}
      >
        <MenuItem onClick={() => { openViewItems(selectedBoxForMenu); handleMenuClose(); }}>
          <ViewListIcon sx={{ mr: 1 }} fontSize="small" />
          View Items
        </MenuItem>
        <MenuItem onClick={() => { openAddItemDialog(selectedBoxForMenu); handleMenuClose(); }}>
          <AddIcon sx={{ mr: 1 }} fontSize="small" />
          Add Item
        </MenuItem>
        <MenuItem onClick={() => { openEditBox(selectedBoxForMenu); handleMenuClose(); }}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Box
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => { 
            handleDeleteBox(selectedBoxForMenu._id); 
            handleMenuClose(); 
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Box
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default InventoryBoxes;
