import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function StockComparisonBarChart({ stock, comparisonData, onClose }) {
  // Sample data processing based on expected comparisonData structure
  const chartData = [
    {
      name: stock,
      innovativeness: comparisonData?.events?.[0]?.attributes?.company?.innovativeness * 100 || 0,
      sustainability: comparisonData?.events?.[0]?.attributes?.company?.sustainability * 100 || 0,
      earnings: comparisonData?.events?.[0]?.attributes?.company?.earningsReports * 100 || 0,
    },
    {
      name: `${comparisonData?.events?.[0]?.attributes?.sectorInfo || 'Sector'} Avg`,
      innovativeness: comparisonData?.events?.[0]?.attributes?.sector?.innovativeness * 100 || 0,
      sustainability: comparisonData?.events?.[0]?.attributes?.sector?.sustainability * 100 || 0,
      earnings: comparisonData?.events?.[0]?.attributes?.sector?.earningsReports * 100 || 0,
    },
  ];

  return (
    <Box sx={{ p: 3, mt: 4, bgcolor: '#f5f5f5', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        {stock} Comparison
      </Typography>
      <Paper sx={{ p: 2, boxShadow: 1 }}>
        {comparisonData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="innovativeness" fill="#8884d8" name="Innovativeness" />
              <Bar dataKey="sustainability" fill="#82ca9d" name="Sustainability" />
              <Bar dataKey="earnings" fill="#ffc658" name="Earnings Reports" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Typography color="error">No comparison data available.</Typography>
        )}
      </Paper>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={onClose} sx={{ bgcolor: '#1976d2' }}>
          Close
        </Button>
      </Box>
    </Box>
  );
}

export default StockComparisonBarChart;