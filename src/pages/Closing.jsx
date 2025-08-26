import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import dayjs from 'dayjs';
import { getClosingSummary } from '../services/closingApi';
// import { useParams } from 'react-router-dom';

const today = dayjs().format('YYYY-MM-DD');

export default function Closing(props) {
  // Always use storeType from props (passed by route)
  const storeType = props.storeType || 'store2';
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const apiStoreType = storeType === 'store1' ? 'store' : 'store2';
      const data = await getClosingSummary(today, apiStoreType);
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch closing summary');
    }
    setLoading(false);
  };

  useEffect(() => {
    setSummary(null);
    setError('');
    setLoading(true);
    fetchSummary();
    // eslint-disable-next-line
  }, [storeType]);

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {storeType === 'store1' ? 'Store 1 Closing' : 'Store 2 Closing'}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Date: {today}
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : summary ? (
          <Box>
            <Typography variant="body1">Total Sale: <b>{summary.totalSale} AED</b></Typography>
            <Typography variant="body1">Total Return: <b>{summary.totalReturn} AED</b></Typography>
            <Typography variant="body1">Total Expense: <b>{summary.totalExpense} AED</b></Typography>
            <Typography variant="body1" sx={{ mt: 2, fontSize: 20, fontWeight: 700 }}>
              Cash in Hand: <span style={{ color: '#1976d2' }}>{summary.cashInHand} AED</span>
            </Typography>
          </Box>
        ) : null}
      </Paper>
    </Box>
  );
}
