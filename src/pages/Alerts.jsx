import { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
import AddAlertModal from '../components/AddAlertModal.jsx';

const API_BASE_URL = 'https://e5lpxos917.execute-api.us-east-1.amazonaws.com';

function Alerts({ userId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openAddAlertModal, setOpenAddAlertModal] = useState(false);

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
        headers: { 'Content-Type': 'application/json' },
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
    resetAlerts();
  }, [userId]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Alerts</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={resetAlerts}>
              Reset Alerts
            </Button>
            <Button variant="contained" onClick={() => {
              setOpenAddAlertModal(true);
              fetchAlerts();
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
                <TableCell>Type</TableCell>
                <TableCell>Triggered</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert, index) => (
                <TableRow key={index}>
                  <TableCell>{alert.symbol}</TableCell>
                  <TableCell>${alert.thresholdHigh?.toFixed(2)}</TableCell>
                  <TableCell>${alert.thresholdLow?.toFixed(2)}</TableCell>
                  <TableCell>
                    {alert.trigger ? (
                      <Typography
                        sx={{ cursor: 'pointer', color: 'blue' }}
                        onClick={() => alert(`View details for ${alert.type} alert`)}
                      >
                        {alert.type || 'Price'}
                      </Typography>
                    ) : (
                      <Typography sx={{ color: 'gray' }}>-</Typography>
                    )}
                  </TableCell>
                  <TableCell>{alert.trigger ? 'Yes' : 'No'}</TableCell>
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