import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Paper, Grid, Card, CardContent, Chip } from '@mui/material';
import { fetchTechnicianStats } from '../services/technicianStatsApi';
import api from '../services/api';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';

export default function TechnicianStatsBox({ initialFrom = '', initialTo = '', technicianId = null }) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [techStats, setTechStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleTechStatsFilter = async () => {
    setLoading(true);
    try {
      if (user.role === 'technician') {
        // For technician, use self endpoint with date filters
        let url = '/technician-self/stats';
        if (from || to) {
          url += `?from=${from}&to=${to}`;
        }
        const response = await api.get(url);
        setTechStats(response.data ? [response.data] : []);
      } else {
        let stats = await fetchTechnicianStats(from, to);
        if (technicianId) {
          // Ensure filtering by technicianId matches backend expectations
          stats = stats.filter(t => t._id === technicianId);
        }
        setTechStats(stats);
      }
    } catch (error) {
      console.error('Error fetching technician stats:', error);
      setTechStats([]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    handleTechStatsFilter();
    // eslint-disable-next-line
  }, [technicianId]);

  // Calculate days in range
  let days = 0;
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    days = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1);
  }

  return (
    <Paper sx={{ 
      p: 4, 
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(25,118,210,0.12)',
      background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
      border: '1px solid rgba(25,118,210,0.08)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
          📊 Technician Performance Statistics
        </Typography>
      </Box>

      {/* Date Filter Section */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(102,126,234,0.3)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <CalendarTodayIcon sx={{ color: '#fff', fontSize: 28 }} />
          <TextField 
            type="date" 
            label="From Date" 
            InputLabelProps={{ shrink: true, style: { color: '#fff', fontWeight: 600 } }} 
            value={from} 
            onChange={e => setFrom(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#fff' }
              }
            }}
          />
          <TextField 
            type="date" 
            label="To Date" 
            InputLabelProps={{ shrink: true, style: { color: '#fff', fontWeight: 600 } }} 
            value={to} 
            onChange={e => setTo(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#fff' }
              }
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleTechStatsFilter} 
            disabled={loading}
            startIcon={<TrendingUpIcon />}
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              fontWeight: 700,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 15px rgba(245,87,108,0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                boxShadow: '0 6px 20px rgba(245,87,108,0.5)'
              }
            }}
          >
            {loading ? 'Loading...' : 'Filter Stats'}
          </Button>
        </Box>
      </Paper>

      {/* Stats Display */}
      <Box>
        {techStats.length === 0 ? (
          <Alert 
            severity="info" 
            icon={<CalendarTodayIcon />}
            sx={{ 
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            📅 No technician activity found in the selected date range. Please adjust your filters.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {techStats.map(t => {
              const totalJobs = Number(t.repair) + Number(t.test);
              const avgPerDay = days > 1 ? (totalJobs / days).toFixed(2) : totalJobs;
              
              return (
                <Grid item xs={12} md={6} lg={4} key={t._id}>
                  <Card sx={{ 
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(25,118,210,0.2)',
                      borderColor: 'primary.main'
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Technician Name Header */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 3,
                        pb: 2,
                        borderBottom: '2px solid',
                        borderColor: 'primary.main'
                      }}>
                        <PersonIcon sx={{ 
                          fontSize: 32, 
                          color: 'primary.main', 
                          mr: 1.5,
                          p: 0.5,
                          borderRadius: '50%',
                          background: 'rgba(25,118,210,0.1)'
                        }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {t.name}
                        </Typography>
                      </Box>

                      {/* Stats Grid */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        {/* Repair Count */}
                        <Grid item xs={6}>
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textAlign: 'center',
                            boxShadow: '0 4px 15px rgba(102,126,234,0.3)'
                          }}>
                            <BuildIcon sx={{ fontSize: 28, color: '#fff', mb: 0.5 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                              {t.repair}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
                              🔧 Repairs
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Test Count */}
                        <Grid item xs={6}>
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            textAlign: 'center',
                            boxShadow: '0 4px 15px rgba(245,87,108,0.3)'
                          }}>
                            <CheckCircleIcon sx={{ fontSize: 28, color: '#fff', mb: 0.5 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                              {t.test}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
                              ✅ Tests
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Total Jobs */}
                        <Grid item xs={12}>
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            textAlign: 'center',
                            boxShadow: '0 4px 15px rgba(79,172,254,0.3)'
                          }}>
                            <TrendingUpIcon sx={{ fontSize: 28, color: '#fff', mb: 0.5 }} />
                            <Typography variant="h3" sx={{ fontWeight: 700, color: '#fff' }}>
                              {totalJobs}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                              📈 Total Jobs Completed
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Average Per Day (if applicable) */}
                        {days > 1 && (
                          <Grid item xs={12}>
                            <Box sx={{ 
                              p: 2, 
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                              textAlign: 'center',
                              boxShadow: '0 4px 15px rgba(250,112,154,0.3)'
                            }}>
                              <CalendarTodayIcon sx={{ fontSize: 24, color: '#fff', mb: 0.5 }} />
                              <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                                {avgPerDay}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                                ⚡ Average Jobs/Day
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                                <Chip 
                                  label={`${(Number(t.repair) / days).toFixed(1)} repairs/day`}
                                  size="small"
                                  sx={{ 
                                    background: 'rgba(255,255,255,0.3)', 
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }}
                                />
                                <Chip 
                                  label={`${(Number(t.test) / days).toFixed(1)} tests/day`}
                                  size="small"
                                  sx={{ 
                                    background: 'rgba(255,255,255,0.3)', 
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              </Box>
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      {/* Period Badge */}
                      {from && to && (
                        <Box sx={{ 
                          mt: 2, 
                          p: 1.5, 
                          borderRadius: 2,
                          background: 'rgba(25,118,210,0.08)',
                          textAlign: 'center'
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            📅 Period: {days} day{days !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Paper>
  );
}
