import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import PerformanceLineChart from './PerformanceLineChart.jsx';

function StockModal({ userId, symbol, onClose }) {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = 'https://aui6flvy73.execute-api.us-east-1.amazonaws.com';

  useEffect(() => {
    const fetchStockPerformance = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/portfolio/${userId}/performance/${symbol}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch stock performance');
        const data = await response.json();
        setStockData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStockPerformance();
  }, [userId, symbol]);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {symbol} Performance
        <Button onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          ✕
        </Button>
      </DialogTitle>
      <DialogContent>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {stockData && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography>Total Invested: ${stockData.totalInvested.toFixed(2)}</Typography>
              <Typography>Current Value: ${stockData.currentValue.toFixed(2)}</Typography>
              <Typography color={stockData.gainLoss >= 0 ? 'success.main' : 'error.main'}>
                Gain/Loss: ${stockData.gainLoss.toFixed(2)} ({stockData.gainLossPercentage.toFixed(2)}%)
              </Typography>
            </Box>
            <PerformanceLineChart performance={{ totals: stockData }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default StockModal;