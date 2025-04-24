import { useState } from 'react';
import { Modal, Box, Typography, Button, TextField, Grid } from '@mui/material';

function AddAlertModal({ open, onClose, onAddAlert }) {
  const [alert, setAlert] = useState({
    symbol: '',
    thresholdHigh: '',
    thresholdLow: '',
    type: 'Price',
  });
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setAlert({ ...alert, [field]: value });
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      const formattedAlert = {
        symbol: alert.symbol.toUpperCase(),
        thresholdHigh: parseFloat(alert.thresholdHigh),
        thresholdLow: parseFloat(alert.thresholdLow),
        type: alert.type,
      };

      if (!formattedAlert.symbol || isNaN(formattedAlert.thresholdHigh) || isNaN(formattedAlert.thresholdLow)) {
        throw new Error('Symbol, Threshold High, and Threshold Low are required');
      }
      if (formattedAlert.thresholdHigh <= 0 || formattedAlert.thresholdLow <= 0) {
        throw new Error('Thresholds must be positive');
      }

      const success = await onAddAlert(formattedAlert);
      if (success) {
        setAlert({ symbol: '', thresholdHigh: '', thresholdLow: '', type: 'Price' });
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          p: 4,
          minWidth: 400,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Add Alert
        </Typography>
        {error && <Typography color="error" gutterBottom>{error}</Typography>}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Symbol"
              value={alert.symbol}
              onChange={(e) => handleChange('symbol', e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Threshold High ($)"
              type="number"
              value={alert.thresholdHigh}
              onChange={(e) => handleChange('thresholdHigh', e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Threshold Low ($)"
              type="number"
              value={alert.thresholdLow}
              onChange={(e) => handleChange('thresholdLow', e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Type"
              value={alert.type}
              onChange={(e) => handleChange('type', e.target.value)}
              fullWidth
              size="small"
              disabled
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Alert
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default AddAlertModal;