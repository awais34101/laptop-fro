import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ProfitLoss() {
  const [tabValue, setTabValue] = useState(0);
  const [loadingStore1, setLoadingStore1] = useState(false);
  const [loadingStore2, setLoadingStore2] = useState(false);
  const [loadingCombined, setLoadingCombined] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // New filter states
  const [profitType, setProfitType] = useState(''); // '', 'profit', 'loss'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Store 1 data
  const [store1Data, setStore1Data] = useState(null);
  
  // Store 2 data
  const [store2Data, setStore2Data] = useState(null);
  
  // Combined data
  const [combinedData, setCombinedData] = useState(null);

  const token = localStorage.getItem('token');

  // Fetch customers for dropdown - memoized
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  }, [token]);

  const fetchStore1Data = useCallback(async () => {
    setLoadingStore1(true);
    setError('');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (profitType) params.profitType = profitType;
      if (selectedCustomer) params.customerId = selectedCustomer._id;

      console.log('Fetching Store 1 data...');

      const response = await axios.get(`${API_URL}/api/profit-loss/store1`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        timeout: 60000 // 60 second timeout
      });
      
      console.log('Store 1 data received:', response.data);
      setStore1Data(response.data);
    } catch (err) {
      console.error('Error fetching Store 1 data:', err);
      setError('Failed to fetch Store 1 profit/loss data');
    } finally {
      setLoadingStore1(false);
    }
  }, [startDate, endDate, profitType, selectedCustomer, token]);

  const fetchStore2Data = useCallback(async () => {
    setLoadingStore2(true);
    setError('');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (profitType) params.profitType = profitType;
      if (selectedCustomer) params.customerId = selectedCustomer._id;

      console.log('Fetching Store 2 data...');

      const response = await axios.get(`${API_URL}/api/profit-loss/store2`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        timeout: 60000 // 60 second timeout
      });
      
      console.log('Store 2 data received:', response.data);
      setStore2Data(response.data);
    } catch (err) {
      console.error('Error fetching Store 2 data:', err);
      setError('Failed to fetch Store 2 profit/loss data');
    } finally {
      setLoadingStore2(false);
    }
  }, [startDate, endDate, profitType, selectedCustomer, token]);

  const fetchCombinedData = useCallback(async () => {
    setLoadingCombined(true);
    setError('');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      console.log('Fetching combined data...');

      const response = await axios.get(`${API_URL}/api/profit-loss/combined`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        timeout: 60000 // 60 second timeout
      });
      
      console.log('Combined data received:', response.data);
      setCombinedData(response.data);
    } catch (err) {
      console.error('Error fetching combined data:', err);
      setError('Failed to fetch combined profit/loss data');
    } finally {
      setLoadingCombined(false);
    }
  }, [startDate, endDate, token]);

  useEffect(() => {
    // Load combined data by default on page load
    fetchCombinedData();
    // Load customers for filter
    fetchCustomers();
  }, [fetchCombinedData, fetchCustomers]);

  // Fetch data when tab changes
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Fetch data for the selected tab if not already loaded
    if (newValue === 0 && !combinedData && !loadingCombined) {
      fetchCombinedData();
    } else if (newValue === 1 && !store1Data && !loadingStore1) {
      fetchStore1Data();
    } else if (newValue === 2 && !store2Data && !loadingStore2) {
      fetchStore2Data();
    }
  };

  const fetchAllData = () => {
    setError('');
    
    // Start all three fetches independently
    fetchStore1Data();
    fetchStore2Data();
    fetchCombinedData();
  };

  const handleFilter = () => {
    fetchStore1Data();
    fetchStore2Data();
    fetchCombinedData();
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setProfitType('');
    setSelectedCustomer(null);
    setTimeout(() => {
      fetchStore1Data();
      fetchStore2Data();
      fetchCombinedData();
    }, 100);
  };

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount || 0);
  }, []);

  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString('en-GB');
  }, []);

  const SummaryCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {formatCurrency(value)}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderStoreData = (data, isLoading) => {
    if (isLoading) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 3, fontSize: 18 }}>Loading store data...</Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>
            This may take a moment if you have many invoices
          </Typography>
        </Box>
      );
    }

    if (!data) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No data loaded yet</Typography>
        </Box>
      );
    }

    if (data.sales && data.sales.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No sales data found for this store. Make some sales to see profit/loss analysis.
        </Alert>
      );
    }

    return (
      <>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* First Row */}
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Total Revenue"
              value={data.summary.totalRevenue}
              icon={<AttachMoneyIcon fontSize="inherit" />}
              color="#4caf50"
              subtitle={`${data.summary.totalSales} sales`}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Cost of Goods"
              value={data.summary.totalCost}
              icon={<ShoppingCartIcon fontSize="inherit" />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Gross Profit"
              value={data.summary.grossProfit}
              icon={<TrendingUpIcon fontSize="inherit" />}
              color="#2196f3"
              subtitle="Before expenses"
            />
          </Grid>
          {/* Second Row */}
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Expenses"
              value={data.summary.totalExpenses}
              icon={<ShoppingCartIcon fontSize="inherit" />}
              color="#f44336"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${data.summary.netProfit >= 0 ? '#4caf5015' : '#f4433615'} 0%, ${data.summary.netProfit >= 0 ? '#4caf5005' : '#f4433605'} 100%)` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Net Profit
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: data.summary.netProfit >= 0 ? '#4caf50' : '#f44336' }}>
                      {formatCurrency(data.summary.netProfit)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Profit Margin
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: data.summary.netProfit >= 0 ? '#4caf50' : '#f44336' }}>
                      {data.summary.profitMargin}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Sales Details */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Sales Breakdown
        </Typography>
        {data.sales.map((sale, index) => (
          <Accordion key={sale._id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', pr: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Invoice: {sale.invoice_number || 'N/A'} | {formatDate(sale.date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer: {sale.customer?.name || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip
                    label={`Profit: ${formatCurrency(sale.profit)}`}
                    color={sale.profit >= 0 ? 'success' : 'error'}
                    size="small"
                  />
                  <Chip
                    label={`${sale.profitMargin}%`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Item</strong></TableCell>
                      <TableCell align="right"><strong>Qty</strong></TableCell>
                      <TableCell align="right"><strong>Purchase Price</strong></TableCell>
                      <TableCell align="right"><strong>Sale Price</strong></TableCell>
                      <TableCell align="right"><strong>Revenue</strong></TableCell>
                      <TableCell align="right"><strong>Cost</strong></TableCell>
                      <TableCell align="right"><strong>Profit</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.purchasePrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.salePrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            color: item.profit >= 0 ? '#4caf50' : '#f44336',
                            fontWeight: 'bold'
                          }}
                        >
                          {formatCurrency(item.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right"><strong>Totals:</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(sale.revenue)}</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(sale.cost)}</strong></TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          color: sale.profit >= 0 ? '#4caf50' : '#f44336',
                          fontWeight: 'bold'
                        }}
                      >
                        <strong>{formatCurrency(sale.profit)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </>
    );
  };

  const renderCombinedData = () => {
    if (loadingCombined) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 3, fontSize: 18 }}>Loading combined data...</Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>
            Calculating profit/loss for both stores
          </Typography>
        </Box>
      );
    }

    if (!combinedData) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No data loaded yet</Typography>
        </Box>
      );
    }

    if (combinedData.combined && combinedData.combined.totalSales === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No sales data found for either store. Make some sales to see profit/loss analysis.
        </Alert>
      );
    }

    return (
      <>
        {/* Combined Summary */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Combined Overview
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* First Row */}
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Total Revenue"
              value={combinedData.combined.totalRevenue}
              icon={<AttachMoneyIcon fontSize="inherit" />}
              color="#4caf50"
              subtitle={`${combinedData.combined.totalSales} sales`}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Cost of Goods"
              value={combinedData.combined.totalCost}
              icon={<ShoppingCartIcon fontSize="inherit" />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Gross Profit"
              value={combinedData.combined.grossProfit}
              icon={<TrendingUpIcon fontSize="inherit" />}
              color="#2196f3"
            />
          </Grid>
          {/* Second Row */}
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Total Expenses"
              value={combinedData.combined.totalExpenses}
              icon={<ShoppingCartIcon fontSize="inherit" />}
              color="#f44336"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${combinedData.combined.netProfit >= 0 ? '#4caf5015' : '#f4433615'} 0%, ${combinedData.combined.netProfit >= 0 ? '#4caf5005' : '#f4433605'} 100%)` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Net Profit
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: combinedData.combined.netProfit >= 0 ? '#4caf50' : '#f44336' }}>
                      {formatCurrency(combinedData.combined.netProfit)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Profit Margin
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: combinedData.combined.netProfit >= 0 ? '#4caf50' : '#f44336' }}>
                      {combinedData.combined.profitMargin}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Store Comparison */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Store Comparison
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
                  Store 1
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Revenue:</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(combinedData.store1.revenue)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Cost:</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(combinedData.store1.cost)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Gross Profit:</Typography>
                    <Typography sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {formatCurrency(combinedData.store1.grossProfit)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Expenses:</Typography>
                    <Typography sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {formatCurrency(combinedData.store1.expenses)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 'bold' }}>Net Profit:</Typography>
                    <Typography sx={{ fontWeight: 'bold', color: combinedData.store1.netProfit >= 0 ? '#4caf50' : '#f44336' }}>
                      {formatCurrency(combinedData.store1.netProfit)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Margin:</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{combinedData.store1.profitMargin}%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Sales Count:</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{combinedData.store1.salesCount}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#9c27b0' }}>
                  Store 2
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Revenue:</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(combinedData.store2.revenue)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Cost:</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(combinedData.store2.cost)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Gross Profit:</Typography>
                    <Typography sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {formatCurrency(combinedData.store2.grossProfit)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Expenses:</Typography>
                    <Typography sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {formatCurrency(combinedData.store2.expenses)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 'bold' }}>Net Profit:</Typography>
                    <Typography sx={{ fontWeight: 'bold', color: combinedData.store2.netProfit >= 0 ? '#4caf50' : '#f44336' }}>
                      {formatCurrency(combinedData.store2.netProfit)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Margin:</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{combinedData.store2.profitMargin}%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Sales Count:</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{combinedData.store2.salesCount}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Profit & Loss Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track revenue, costs, and profits for both stores
        </Typography>
      </Box>

      {/* Date Filter */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={profitType}
                  onChange={(e) => setProfitType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="profit">Profit</MenuItem>
                  <MenuItem value="loss">Loss</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name || ''}
                value={selectedCustomer}
                onChange={(event, newValue) => setSelectedCustomer(newValue)}
                loading={loadingCustomers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
                    placeholder="All"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleFilter}
                  fullWidth
                >
                  Apply
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilter}
                  fullWidth
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Combined Overview" />
          <Tab label="Store 1" />
          <Tab label="Store 2" />
        </Tabs>
      </Paper>

      {/* Content */}
      {tabValue === 0 && renderCombinedData()}
      {tabValue === 1 && renderStoreData(store1Data, loadingStore1)}
      {tabValue === 2 && renderStoreData(store2Data, loadingStore2)}
    </Container>
  );
}
