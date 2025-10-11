import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import dayjs from 'dayjs';
import { getClosingSummary } from '../services/closingApi';
// import { useParams } from 'react-router-dom';

export default function Closing(props) {
  // Always use storeType from props (passed by route)
  const storeType = props.storeType || 'store2';
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLast30Days = async () => {
    setLoading(true);
    setError('');
    setSummaries([]);
    
    try {
      const apiStoreType = storeType === 'store1' ? 'store' : 'store2';
      const results = [];
      
      // Fetch last 30 days
      for (let i = 0; i < 30; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        try {
          const data = await getClosingSummary(date, apiStoreType);
          results.push(data);
        } catch (err) {
          // If a specific day fails, continue with others
          console.error(`Failed to fetch closing for ${date}:`, err);
        }
      }
      
      setSummaries(results);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch closing summaries');
    }
    setLoading(false);
  };

  useEffect(() => {
    setSummaries([]);
    setError('');
    setLoading(true);
    fetchLast30Days();
    // eslint-disable-next-line
  }, [storeType]);

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, background: 'linear-gradient(135deg, #f4f6f8 60%, #e3eafc 100%)', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 1, color: 'primary.main', mb: 3 }}>
        {storeType === 'store1' ? 'Store 1 Closing - Last 30 Days' : 'Store 2 Closing - Last 30 Days'}
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : summaries.length > 0 ? (
        <>
          {/* Daily Closing Table */}
          <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, boxShadow: '0 4px 24px rgba(25,118,210,0.08)', maxHeight: 600, overflowY: 'auto' }}>
            <Table stickyHeader sx={{ minWidth: 650, '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9fafd' }, '& tbody tr:hover': { backgroundColor: '#e3eafc' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    position: 'sticky', 
                    top: 0, 
                    background: 'linear-gradient(145deg, #1976d2, #1565c0)', 
                    fontWeight: 900, 
                    fontSize: '1.05rem', 
                    color: 'white',
                    zIndex: 100,
                    borderBottom: '3px solid #0d47a1',
                    py: 2
                  }}>
                    📅 Date
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    position: 'sticky', 
                    top: 0, 
                    background: 'linear-gradient(145deg, #1976d2, #1565c0)', 
                    fontWeight: 900, 
                    fontSize: '1.05rem', 
                    color: 'white',
                    zIndex: 100,
                    borderBottom: '3px solid #0d47a1',
                    py: 2
                  }}>
                    💰 Sales (AED)
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    position: 'sticky', 
                    top: 0, 
                    background: 'linear-gradient(145deg, #1976d2, #1565c0)', 
                    fontWeight: 900, 
                    fontSize: '1.05rem', 
                    color: 'white',
                    zIndex: 100,
                    borderBottom: '3px solid #0d47a1',
                    py: 2
                  }}>
                    🔄 Returns (AED)
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    position: 'sticky', 
                    top: 0, 
                    background: 'linear-gradient(145deg, #1976d2, #1565c0)', 
                    fontWeight: 900, 
                    fontSize: '1.05rem', 
                    color: 'white',
                    zIndex: 100,
                    borderBottom: '3px solid #0d47a1',
                    py: 2
                  }}>
                    💸 Expenses (AED)
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    position: 'sticky', 
                    top: 0, 
                    background: 'linear-gradient(145deg, #1976d2, #1565c0)', 
                    fontWeight: 900, 
                    fontSize: '1.05rem', 
                    color: 'white',
                    zIndex: 100,
                    borderBottom: '3px solid #0d47a1',
                    py: 2
                  }}>
                    💵 Cash in Hand (AED)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaries.map((summary, index) => {
                  const isToday = summary.date === dayjs().format('YYYY-MM-DD');
                  return (
                    <TableRow 
                      key={summary.date} 
                      sx={{ 
                        ...(isToday && { 
                          background: 'linear-gradient(145deg, #fff9c4, #fff59d)',
                          fontWeight: 700 
                        })
                      }}
                    >
                      <TableCell sx={{ fontWeight: isToday ? 700 : 600 }}>
                        {dayjs(summary.date).format('DD MMM YYYY')} {isToday && '(Today)'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#1976d2', fontWeight: 600 }}>
                        {summary.totalSale?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#f57c00', fontWeight: 600 }}>
                        {summary.totalReturn?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                        {summary.totalExpense?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: summary.cashInHand >= 0 ? '#2e7d32' : '#d32f2f', 
                        fontWeight: 700,
                        fontSize: '1.05rem'
                      }}>
                        {summary.cashInHand?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography>No closing data available</Typography>
        </Paper>
      )}
    </Box>
  );
}
