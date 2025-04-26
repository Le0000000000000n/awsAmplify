import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
import AddAlertModal from '../components/AddAlertModal.jsx';

const API_BASE_URL = 'https://aui6flvy73.execute-api.us-east-1.amazonaws.com';

function Alerts({ userId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openAddAlertModal, setOpenAddAlertModal] = useState(false);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/alerts/${userId}`, {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data.events[0]?.attributes?.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addAlert = async (alert) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: JSON.stringify(alert),
      });
      if (!response.ok) throw new Error('Failed to add alert');
      await fetchAlerts();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };



  const resetAlerts = () => {
    setAlerts([]);
    setError(null);
  };

  useEffect(() => {
    fetchAlerts();
  }, [])

  useEffect(() => {
    resetAlerts();
  }, [userId]);

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
            <Typography variant="h5">Alerts</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={resetAlerts}>
              Reset Alerts
            </Button>
            <Button variant="contained" onClick={() => {
              setOpenAddAlertModal(true);
            }}>
              Add Alert
            </Button>
          </Box>
        </Box>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && alerts.length === 0 && <Typography>No alerts set.</Typography>}
        {alerts.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Threshold High ($)</TableCell>
                <TableCell>Threshold Low ($)</TableCell>
                <TableCell>Tiggered On Price</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Triggered</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert, index) => (
                <TableRow key={index}>
                  <TableCell>{alert.symbol}</TableCell>
                  <TableCell>{alert.thresholdHigh?.toFixed(2) ? `$${alert.thresholdHigh?.toFixed(2)}` : 'N/A'}</TableCell>
                  <TableCell>{alert.thresholdLow?.toFixed(2) ? `$${alert.thresholdLow?.toFixed(2)}` : 'N/A'}</TableCell>
                  <TableCell>${alert.currentPrice?.toFixed(2)}</TableCell>
                  <TableCell>{alert.type}</TableCell>
                  <TableCell>{'Yes'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AddAlertModal
          open={openAddAlertModal}
          onClose={() => setOpenAddAlertModal(false)}
          onAddAlert={addAlert}
        />
      </Box>
    </Box>
  );
}

export default Alerts;