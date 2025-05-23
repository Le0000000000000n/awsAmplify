import {
  Box,
  Modal,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

  const LabelWithInfo = ({ label, info }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {label}
      <Tooltip title={info} placement="right" arrow>
        <InfoOutlinedIcon fontSize="small" color="action" />
      </Tooltip>
    </Box>
  );

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
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    <LabelWithInfo
                      label="Current Price"
                      info="The most recent trading price of the stock."
                    />
                  </TableCell>
                  <TableCell align="right">${formatNumber(performanceData.price)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    <LabelWithInfo
                      label="Volume"
                      info="Number of shares traded today."
                    />
                  </TableCell>
                  <TableCell align="right">{formatLargeNumber(performanceData.volume)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    <LabelWithInfo
                      label="Market Cap"
                      info="Total value of all outstanding shares."
                    />
                  </TableCell>
                  <TableCell align="right">${formatLargeNumber(performanceData.marketCap)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    <LabelWithInfo
                      label="RSI"
                      info="Shows if a stock is overbought or oversold (Relative Strength Index)."
                    />
                  </TableCell>
                  <TableCell align="right">{formatNumber(performanceData.momentum_indicators?.rsi)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    <LabelWithInfo
                      label="MACD Trend"
                      info="Indicates potential trend changes using moving averages."
                    />
                  </TableCell>
                  <TableCell align="right">
                    {performanceData.momentum_indicators?.MACD?.macdTrend || 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    <LabelWithInfo
                      label="Price Deviation"
                      info="How far the current price is from its 200-day average."
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${formatNumber(performanceData.mean_reversion?.priceDeviation)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    <LabelWithInfo
                      label="Volume Spike"
                      info="Sudden large increase in trading volume."
                    />
                  </TableCell>
                  <TableCell align="right">{formatBoolean(performanceData.trends?.volume_spike)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    <LabelWithInfo
                      label="Unusual Movement"
                      info="Uncommon price activity detected in the stock."
                    />
                  </TableCell>
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
