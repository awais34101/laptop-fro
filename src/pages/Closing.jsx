import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Tooltip, Chip, alpha, LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
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
    setSummaries([]); // Clear old data
    
    try {
      const apiStoreType = storeType === 'store1' ? 'store' : 'store2';
      
      // Create all promises at once (parallel fetching instead of sequential)
      const promises = [];
      for (let i = 0; i < 30; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        promises.push(
          getClosingSummary(date, apiStoreType)
            .catch(err => {
              console.error(`Failed to fetch closing for ${date}:`, err);
              return null; // Return null for failed requests
            })
        );
      }
      
      // Fetch all in parallel
      const results = await Promise.all(promises);
      
      // Filter out null results (failed requests) and set summaries
      const validResults = results.filter(r => r !== null);
      setSummaries(validResults);
      
      if (validResults.length === 0) {
        setError('No closing data available for the last 30 days');
      }
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
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa', p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              background: storeType === 'store1' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              <AssessmentIcon sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748', letterSpacing: 0.5 }}>
                {storeType === 'store1' ? 'Store 1 Closing' : 'Store 2 Closing'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                Last 30 days financial records
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={fetchLast30Days}
              disabled={loading}
              sx={{ 
                background: '#fff', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { background: '#f7fafc', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Loading Bar */}
        {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

        {/* Error Alert */}
        {error && (
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#fee', border: '1px solid #fcc' }}>
            <Typography color="error" sx={{ fontWeight: 600 }}>{error}</Typography>
          </Paper>
        )}

        {!loading && summaries.length > 0 && (
          <>
            {/* Daily Closing Table */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <TableContainer sx={{ maxHeight: 650 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        background: storeType === 'store1'
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        py: 2
                      }}>
                        📅 Date
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        background: storeType === 'store1'
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        py: 2
                      }}>
                        💰 Sales (AED)
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        background: storeType === 'store1'
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        py: 2
                      }}>
                        🔄 Returns (AED)
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        background: storeType === 'store1'
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        py: 2
                      }}>
                        💸 Expenses (AED)
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        background: storeType === 'store1'
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        py: 2
                      }}>
                        💵 Cash (AED)
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        background: storeType === 'store1'
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        py: 2
                      }}>
                        📊 Net Profit
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summaries.map((summary, index) => {
                      const isToday = summary.date === dayjs().format('YYYY-MM-DD');
                      const dailyNet = (summary.totalSale || 0) - (summary.totalReturn || 0) - (summary.totalExpense || 0);
                      
                      return (
                        <TableRow 
                          key={summary.date} 
                          sx={{ 
                            backgroundColor: isToday 
                              ? alpha('#ffd700', 0.15)
                              : 'inherit',
                            '&:nth-of-type(odd)': { 
                              backgroundColor: isToday 
                                ? alpha('#ffd700', 0.2)
                                : alpha(storeType === 'store1' ? '#667eea' : '#06beb6', 0.02) 
                            },
                            '&:hover': { 
                              backgroundColor: isToday 
                                ? alpha('#ffd700', 0.25)
                                : alpha(storeType === 'store1' ? '#667eea' : '#06beb6', 0.08),
                              transform: 'scale(1.001)',
                              transition: 'all 0.2s'
                            }
                          }}
                        >
                          <TableCell sx={{ fontWeight: isToday ? 700 : 600, fontSize: '0.95rem' }}>
                            {isToday && (
                              <Chip 
                                label="TODAY" 
                                size="small" 
                                color="warning" 
                                sx={{ mr: 1, fontWeight: 700, fontSize: '0.75rem' }} 
                              />
                            )}
                            {dayjs(summary.date).format('DD MMM YYYY')}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#1976d2', fontWeight: 700, fontSize: '0.95rem' }}>
                            {(summary.totalSale || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#f57c00', fontWeight: 700, fontSize: '0.95rem' }}>
                            {(summary.totalReturn || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 700, fontSize: '0.95rem' }}>
                            {(summary.totalExpense || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            color: (summary.cashInHand || 0) >= 0 ? '#2e7d32' : '#d32f2f', 
                            fontWeight: 700,
                            fontSize: '0.95rem'
                          }}>
                            {(summary.cashInHand || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={dailyNet.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              size="small"
                              sx={{ 
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                minWidth: 90,
                                background: dailyNet >= 0 
                                  ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                  : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                                color: '#fff'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Footer Summary */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                Showing {summaries.length} days of closing records
              </Typography>
              <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                Period: {dayjs().subtract(29, 'day').format('DD MMM')} - {dayjs().format('DD MMM YYYY')}
              </Typography>
            </Box>
          </>
        )}

        {!loading && summaries.length === 0 && !error && (
          <Paper sx={{ p: 8, borderRadius: 3, textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Closing Data Available
            </Typography>
            <Typography variant="body2" color="text.disabled">
              No closing records found for the last 30 days
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
