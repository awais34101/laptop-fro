import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Category as CategoryIcon,
  CheckBox as CheckBoxIcon,
  Add as AddIcon
} from '@mui/icons-material';

export const EmptyCategories = ({ onAdd }) => (
  <Paper 
    sx={{ 
      p: 6, 
      textAlign: 'center', 
      bgcolor: '#f5f5f5',
      border: '2px dashed #ccc'
    }}
  >
    <CategoryIcon sx={{ fontSize: 64, color: '#999', mb: 2 }} />
    <Typography variant="h6" gutterBottom color="text.secondary">
      No Categories Yet
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Create your first category to organize your checklists
    </Typography>
    <Button 
      variant="contained" 
      startIcon={<AddIcon />}
      onClick={onAdd}
    >
      Create First Category
    </Button>
  </Paper>
);

export const EmptyTemplates = ({ onAdd }) => (
  <Paper 
    sx={{ 
      p: 6, 
      textAlign: 'center', 
      bgcolor: '#f5f5f5',
      border: '2px dashed #ccc'
    }}
  >
    <CheckBoxIcon sx={{ fontSize: 64, color: '#999', mb: 2 }} />
    <Typography variant="h6" gutterBottom color="text.secondary">
      No Templates Yet
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Create checklist templates that your team can use daily
    </Typography>
    <Button 
      variant="contained" 
      startIcon={<AddIcon />}
      onClick={onAdd}
    >
      Create First Template
    </Button>
  </Paper>
);

export const EmptyPendingChecklists = () => (
  <Paper 
    sx={{ 
      p: 6, 
      textAlign: 'center', 
      bgcolor: '#e8f5e9',
      border: '2px dashed #4caf50'
    }}
  >
    <AssignmentIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
    <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
      All Caught Up! 🎉
    </Typography>
    <Typography variant="body2" color="text.secondary">
      No pending daily checklists. Great work!
    </Typography>
  </Paper>
);

export const EmptyHistory = () => (
  <Paper 
    sx={{ 
      p: 6, 
      textAlign: 'center', 
      bgcolor: '#f5f5f5'
    }}
  >
    <AssignmentIcon sx={{ fontSize: 64, color: '#999', mb: 2 }} />
    <Typography variant="h6" gutterBottom color="text.secondary">
      No Completed Checklists
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Complete some checklists to see them here
    </Typography>
  </Paper>
);

export const ErrorState = ({ message, onRetry }) => (
  <Paper 
    sx={{ 
      p: 6, 
      textAlign: 'center', 
      bgcolor: '#ffebee',
      border: '2px solid #ef5350'
    }}
  >
    <Typography variant="h6" gutterBottom sx={{ color: '#c62828' }}>
      Oops! Something went wrong
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      {message || 'Failed to load data. Please try again.'}
    </Typography>
    {onRetry && (
      <Button 
        variant="contained" 
        color="error"
        onClick={onRetry}
      >
        Try Again
      </Button>
    )}
  </Paper>
);

export default {
  EmptyCategories,
  EmptyTemplates,
  EmptyPendingChecklists,
  EmptyHistory,
  ErrorState
};
