import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

// Loading skeleton for checklist cards
export const ChecklistCardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="60%" height={30} />
      <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={40} sx={{ mt: 2, borderRadius: 1 }} />
    </CardContent>
  </Card>
);

// Loading skeleton for categories
export const CategoryCardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="70%" height={28} />
      <Skeleton variant="text" width="90%" height={20} sx={{ mt: 1 }} />
    </CardContent>
  </Card>
);

// Loading skeleton for templates
export const TemplateCardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="60%" height={30} />
      <Skeleton variant="rounded" width={80} height={24} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="100%" height={20} sx={{ mt: 2 }} />
      <Skeleton variant="text" width="30%" height={20} sx={{ mt: 1 }} />
      {[1, 2, 3].map(i => (
        <Skeleton key={i} variant="text" width="80%" height={18} sx={{ mt: 0.5 }} />
      ))}
    </CardContent>
  </Card>
);

// Loading skeleton for reports table
export const ReportTableSkeleton = () => (
  <Box>
    {[1, 2, 3, 4, 5].map(i => (
      <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width="20%" height={24} />
        <Skeleton variant="text" width="15%" height={24} />
        <Skeleton variant="text" width="15%" height={24} />
        <Skeleton variant="text" width="20%" height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
      </Box>
    ))}
  </Box>
);

// Loading skeleton for statistics cards
export const StatsCardSkeleton = () => (
  <Grid container spacing={3}>
    {[1, 2, 3, 4].map(i => (
      <Grid item xs={12} sm={6} md={3} key={i}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={48} />
            <Skeleton variant="text" width="80%" height={20} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export default {
  ChecklistCardSkeleton,
  CategoryCardSkeleton,
  TemplateCardSkeleton,
  ReportTableSkeleton,
  StatsCardSkeleton
};
