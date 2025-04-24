import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function PortfolioOverview({
  portfolio,
  performance,
  allocation,
  loading,
  error,
  onAddAssets,
  onDeleteStock,
  onDeletePortfolio,
  onStockClick,
}) {
  const [quantities, setQuantities] = useState({});
  useEffect(() => {
    if (allocation && allocation.sectorAllocations) {
      const newQuantities = {};
      allocation.sectorAllocations.forEach((sector) => {
        sector.assets.forEach((asset) => {
          newQuantities[asset.symbol] = (newQuantities[asset.symbol] || 0) + (asset.quantity || 1);
        });
      });
      setQuantities(newQuantities);
    }
  }, [allocation]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Loading portfolio...
        </Typography>
      </Box>
    );
  }

  if (error || !portfolio || !portfolio.assets || portfolio.assets.length === 0) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 500, color: 'grey.900', mb: 2 }}>
          Start adding your first assets to build your portfolio!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={onAddAssets}
          sx={{ borderRadius: 2, textTransform: 'none', px: 4, py: 1.5, fontSize: '1rem' }}
        >
          Create Portfolio
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500, color: 'grey.900' }}>
          Portfolio Overview
        </Typography>
        <Box>
          <Button
            variant="contained"
            onClick={onAddAssets}
            sx={{ mr: 2, borderRadius: 2, textTransform: 'none' }}
          >
            Add Assets
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onDeletePortfolio}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Delete Portfolio
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 500, color: 'grey.900' }}>Symbol</TableCell>
              <TableCell sx={{ fontWeight: 500, color: 'grey.900' }}>Quantity</TableCell>
              <TableCell sx={{ fontWeight: 500, color: 'grey.900' }}>Avg Purchase Price</TableCell>
              <TableCell sx={{ fontWeight: 500, color: 'grey.900' }}>Current Value</TableCell>
              <TableCell sx={{ fontWeight: 500, color: 'grey.900' }}>Gain/Loss</TableCell>
              <TableCell sx={{ fontWeight: 500, color: 'grey.900' }}>Purchase Date</TableCell>
              <TableCell sx={{ fontWeight: 500, color: 'grey.900' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {portfolio.assets.map((asset) => (
    <TableRow
      key={asset.symbol}
      hover
      onClick={() => onStockClick(asset.symbol)}
      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
    >
      <TableCell sx={{ color: 'grey.700' }}>{asset.symbol}</TableCell>
      <TableCell sx={{ color: 'grey.700' }}>{asset.quantity}</TableCell>
      <TableCell sx={{ color: 'grey.700' }}>${asset.purchasePrice.toFixed(2)}</TableCell>
      <TableCell sx={{ color: 'grey.700' }}>${asset.currentValue.toFixed(2)}</TableCell>
      <TableCell sx={{ color: asset.gainLoss >= 0 ? 'green' : 'red' }}>
        {asset.gainLoss >= 0 ? '+' : ''}${asset.gainLoss.toFixed(2)} (
        {asset.gainLossPercentage.toFixed(2)}%)
      </TableCell>
      <TableCell sx={{ color: 'grey.700' }}>{asset.purchaseDate}</TableCell>
      <TableCell>
        <IconButton
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteStock(asset.symbol);
          }}
        >
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
        </Table>
      </TableContainer>
      {performance && performance.totals && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'grey.900', mb: 1 }}>
            Portfolio Totals
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.700' }}>
            Current Value: ${performance.totals.currentValue?.toFixed(2)}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: performance.totals.gainLoss >= 0 ? 'green' : 'red' }}
          >
            Gain/Loss: {performance.totals.gainLoss >= 0 ? '+' : ''}${performance.totals.gainLoss?.toFixed(2)} (
            {performance.totals.gainLossPercentage?.toFixed(2)}%)
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default PortfolioOverview;