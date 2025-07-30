import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Lazy load chart components to avoid initialization issues
const LineChart = lazy(() => import('./LineChart'));
const DoughnutChart = lazy(() => import('./DoughnutChart'));

interface ChartWrapperProps {
  type: 'line' | 'doughnut';
  data: any;
  height?: number;
  showLegend?: boolean;
  title?: string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ type, ...props }) => {
  const ChartComponent = type === 'line' ? LineChart : DoughnutChart;
  
  return (
    <Suspense 
      fallback={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: props.height || 300 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ChartComponent {...props} />
    </Suspense>
  );
};

export default ChartWrapper;