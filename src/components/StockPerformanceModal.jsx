import { Box, Modal, Typography, Button, Table, TableBody, TableCell, TableContainer, TableRow, Paper, CircularProgress } from '@mui/material';

function StockPerformanceModal({ symbol, performanceData, onClose }) {
  const formatNumber = (num) => {
    if (typeof num !== 'number') return 'N/A';
    return num.toFixed(2);
  };

  const formatLargeNumber = (num) => {
    if (typeof num !== 'number') return 'N/A';
    return (num / 1e9).toFixed(2) + 'B';
  };

  const formatBoolean = (bool) => (bool ? 'Yes' : 'No');

  return (
    <Modal open={!!symbol} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          maxWidth: 600,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          Performance Analysis: {symbol}
        </Typography>
        {!performanceData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : !performanceData.symbol ? (
          <Typography color="error">Failed to load performance data.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 1 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>Current Price</TableCell>
                  <TableCell align="right">${formatNumber(performanceData.price)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>Volume</TableCell>
                  <TableCell align="right">{formatLargeNumber(performanceData.volume)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>Market Cap</TableCell>
                  <TableCell align="right">${formatLargeNumber(performanceData.marketCap)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>RSI (Relative Strength Index)</TableCell>
                  <TableCell align="right">{formatNumber(performanceData.momentum_indicators?.rsi)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>MACD Trend</TableCell>
                  <TableCell align="right">{performanceData.momentum_indicators?.MACD?.macdTrend || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>Price Deviation (200-day Avg)</TableCell>
                  <TableCell align="right">${formatNumber(performanceData.mean_reversion?.priceDeviation)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>Volume Spike</TableCell>
                  <TableCell align="right">{formatBoolean(performanceData.trends?.volume_spike)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>Unusual Movement</TableCell>
                  <TableCell align="right">{formatBoolean(performanceData.trends?.unusual_movement)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onClose} sx={{ bgcolor: '#1976d2' }}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default StockPerformanceModal;