import { useState } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

function format(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AddAssetsModal({ open, onClose, onAddAssets }) {
  const [assets, setAssets] = useState([
    { symbol: '', price: '', quantity: '', date: format(new Date()) },
  ]);
  const [error, setError] = useState(null);

  const handleAssetChange = (index, field, value) => {
    const newAssets = [...assets];
    newAssets[index][field] = value;
    setAssets(newAssets);
    setError(null);
  };

  const addAssetRow = () => {
    setAssets([...assets, { symbol: '', price: '', quantity: '', date: format(new Date()) }]);
  };

  const removeAssetRow = (index) => {
    if (assets.length > 1) {
      setAssets(assets.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    try {
      const formattedAssets = assets.map((asset) => ({
        symbol: asset.symbol.toUpperCase(),
        price: parseFloat(asset.price),
        quantity: parseFloat(asset.quantity),
        date: asset.date,
      }));

      // Validate inputs
      for (const asset of formattedAssets) {

        if (!asset.symbol || isNaN(asset.price) || isNaN(asset.quantity) || !asset.date) {
          throw new Error('All fields (symbol, price, quantity, date) are required and must be valid');
        }
        if (asset.price <= 0) {
          throw new Error('Price must be positive');
        }
      }

      const success = await onAddAssets(formattedAssets);
      if (success) {
        setAssets([{ symbol: '', price: '', quantity: '', date: format(new Date()) }]);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', p: 4, minWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Add Assets to Portfolio
        </Typography>
        {error && <Typography color="error" gutterBottom>{error}</Typography>}
        {assets.map((asset, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <TextField
                label="Symbol"
                value={asset.symbol}
                onChange={(e) => handleAssetChange(index, 'symbol', e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Price"
                type="number"
                value={asset.price}
                onChange={(e) => handleAssetChange(index, 'price', e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Quantity"
                type="number"
                value={asset.quantity}
                onChange={(e) => handleAssetChange(index, 'quantity', e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Date"
                type="datetime-local"
                value={asset.date}
                onChange={(e) => handleAssetChange(index, 'date', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={2}>
              {assets.length > 1 && (
                <IconButton onClick={() => removeAssetRow(index)} color="error">
                  <RemoveIcon />
                </IconButton>
              )}
              {index === assets.length - 1 && (
                <IconButton onClick={addAssetRow} color="primary">
                  <AddIcon />
                </IconButton>
              )}
            </Grid>
          </Grid>
        ))}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Assets
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default AddAssetsModal;