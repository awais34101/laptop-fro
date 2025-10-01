import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  CalendarToday
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function ChecklistHistory() {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchHistory();
  }, [days]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/checklists/history?days=${days}`, {
        headers: { 'x-auth-token': token }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupHistoryByDate = (history) => {
    const grouped = {};
    history.forEach(item => {
      const date = new Date(item.date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  const groupedHistory = groupHistoryByDate(history);
  const dates = Object.keys(groupedHistory).sort((a, b) => new Date(b) - new Date(a));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Checklist History
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={days}
            label="Period"
            onChange={(e) => setDays(e.target.value)}
          >
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {dates.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CalendarToday sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No History Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No checklist completions found for the selected period.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {dates.map(date => (
            <Grid item xs={12} key={date}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CalendarToday color="primary" />
                    <Typography variant="h6">
                      {date}
                    </Typography>
                  </Box>
                  
                  <List dense>
                    {groupedHistory[date].map((item, index) => (
                      <React.Fragment key={item._id}>
                        <ListItem>
                          <ListItemIcon>
                            {item.isFullyCompleted ? (
                              <CheckCircle color="success" />
                            ) : (
                              <RadioButtonUnchecked color="disabled" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1">
                                  {item.templateId?.name || 'Unknown Checklist'}
                                </Typography>
                                <Chip
                                  label={item.isFullyCompleted ? 'Completed' : 'Incomplete'}
                                  color={item.isFullyCompleted ? 'success' : 'warning'}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {item.completedCount} of {item.totalItems} items completed
                                  {item.completedAt && (
                                    <> • Completed at {new Date(item.completedAt).toLocaleTimeString()}</>
                                  )}
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.completionPercentage}%
                                  </Typography>
                                  <Box sx={{ flexGrow: 1, height: 4, backgroundColor: 'grey.300', borderRadius: 2 }}>
                                    <Box
                                      sx={{
                                        height: '100%',
                                        backgroundColor: item.isFullyCompleted ? 'success.main' : 'warning.main',
                                        borderRadius: 2,
                                        width: `${item.completionPercentage}%`
                                      }}
                                    />
                                  </Box>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < groupedHistory[date].length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default ChecklistHistory;