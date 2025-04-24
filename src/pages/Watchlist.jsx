import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const API_BASE_URL = 'https://e5lpxos917.execute-api.us-east-1.amazonaws.com';

function Watchlist() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState('AAPL');
  const stockOptions = ['AAPL', 'TSLA', 'GOOGL', 'MSFT'];
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/stock/${symbol}/history`, {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Failed to fetch stock history for ${symbol}`);
      const data = await response.json();
      let historyData = data.events[0]?.attributes || [];
      historyData = historyData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(historyData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/stock/${symbol}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to update stock history for ${symbol}`);
      await fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [symbol]);

  const handleStockChange = (event) => {
    setSymbol(event.target.value);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate(-1)}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h5">Watchlist - {symbol} History</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Select Stock</InputLabel>
              <Select
                value={symbol}
                onChange={handleStockChange}
                label="Select Stock"
              >
                {stockOptions.map((stock) => (
                  <MenuItem key={stock} value={stock}>
                    {stock}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={updateHistory}>
              Update History
            </Button>
          </Box>
        </Box>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && history.length === 0 && <Typography>No history data available for {symbol}.</Typography>}
        {history.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Open ($)</TableCell>
                <TableCell>High ($)</TableCell>
                <TableCell>Low ($)</TableCell>
                <TableCell>Close ($)</TableCell>
                <TableCell>Volume</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>${entry.open?.toFixed(2) || '-'}</TableCell>
                  <TableCell>${entry.high?.toFixed(2) || '-'}</TableCell>
                  <TableCell>${entry.low?.toFixed(2) || '-'}</TableCell>
                  <TableCell>${entry.close?.toFixed(2) || '-'}</TableCell>
                  <TableCell>{entry.volume?.toLocaleString() || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </Box>
  );
}

export default Watchlist;