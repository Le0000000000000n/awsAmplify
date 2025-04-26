import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, Grid, Paper } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/SideBar.jsx';
import PortfolioOverview from '../components/PortfolioOverview.jsx';
import AllocationPieChart from '../components/AllocationPieChart.jsx';
import StockComparisonBarChart from '../components/StockComparisonBarChart.jsx';
import AddAssetsModal from '../components/AddAssetsModal.jsx';
import SectorComparisonCarousel from '../components/SectorComparisonCarousel.jsx';
import StockPerformanceModal from '../components/StockPerformanceModal.jsx';

const drawerWidth = 240;
const API_BASE_URL = 'https://aui6flvy73.execute-api.us-east-1.amazonaws.com';

function Dashboard({ userId }) {
  const [portfolio, setPortfolio] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [performanceError, setPerformanceError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddAssetsModal, setOpenAddAssetsModal] = useState(false);
  const navigate = useNavigate();

  const fetchPortfolioData = async (retries = 2) => {
    if (!userId) {
      setError('No user ID provided. Please sign in again.');
      setLoading(false);
      return;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        setLoading(true);
        setError(null);

        const perfResponse = await fetch(`${API_BASE_URL}/portfolio/${userId}/performance`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!perfResponse.ok) {
          if (perfResponse.status === 404) {
            setPortfolio(null);
            setPerformance(null);
            setAllocation(null);
            setError('Portfolio not found');
            return;
          }
          const errorText = await perfResponse.text();
          throw new Error(`Failed to fetch performance: ${perfResponse.status} - ${errorText}`);
        }

        const perfData = await perfResponse.json();

        if (perfData.error) {
          throw new Error('Portfolio error');
        }

        if (!perfData.stocks || perfData.stocks.length === 0 || !perfData.totals) {
          throw new Error('No portfolio assets found');
        }
        setPerformance(perfData);

        const fetchAndSetAllocation = async (userId) => {
          const allocResponse = await fetch(`${API_BASE_URL}/portfolio/${userId}/allocation`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          let allocData = null;
          if (allocResponse.ok) {
            allocData = await allocResponse.json();
            setAllocation(allocData);
          } else {
            console.warn('Failed to fetch allocation:', allocResponse.status);
          }
          return allocData;
        };
        
        const allocData = await fetchAndSetAllocation(userId);

        const portfolioData = {
          assets: perfData.stocks
            .map((stock) => {
              const quantity = allocData?.sectorAllocations
                ?.flatMap((sector) => sector.assets)
                ?.filter((asset) => asset.symbol === stock.symbol)
                ?.reduce((sum, asset) => sum + (asset.quantity || 0), 0)
              const avgPurchasePrice = stock.totalInvested / quantity;
              if (isNaN(avgPurchasePrice) || avgPurchasePrice <= 0) {
                console.warn(`Skipping ${stock.symbol}: Invalid avgPurchasePrice (${avgPurchasePrice})`);
                return null;
              }
              return {
                symbol: stock.symbol,
                quantity,
                purchasePrice: avgPurchasePrice,
                purchaseDate: stock.purchaseDate || new Date().toISOString().split('T')[0],
                currentValue: stock.currentValue,
                gainLoss: stock.gainLoss,
                gainLossPercentage: stock.gainLossPercentage,
                overall: stock.overall,
              };
            })
            .filter((asset) => asset !== null),
          earliestPurchaseDate: perfData.stocks.length
            ? Math.min(
                ...perfData.stocks.map((stock) =>
                  new Date(stock.purchaseDate || new Date().toISOString()).getTime()
                )
              )
            : new Date().getTime(),
        };

        if (portfolioData.assets.length === 0) {
          throw new Error('No valid assets found');
        }

        setPortfolio(portfolioData);
        return;
      } catch (err) {
        if (attempt < retries) {
          console.warn(`Retrying fetchPortfolioData (attempt ${attempt + 1}): ${err.message}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        setError(err.message);
        setPortfolio(null);
        setPerformance(null);
        setAllocation(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const addAssets = async (assets) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, assets }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add assets');
      }

      const data = await response.json();
      if (!data.successful || data.successful.length === 0) {
        throw new Error('No assets were added');
      }

      await fetchPortfolioData();
      return true;
    } catch (err) {
      setError('Failed to add assets');
      return false;
    }
  };

  const deleteStock = async (symbol) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/${userId}/assets/${symbol}/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete stock');
      }

      const data = await response.json();
      if (data.symbol !== symbol) {
        throw new Error('Unexpected response: Deleted symbol does not match');
      }

      await fetchPortfolioData();
      return true;
    } catch (err) {
      setError('Failed to delete stock');
      return false;
    }
  };

  const deletePortfolio = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete portfolio');
      }

      const data = await response.json();
      if (!data.message.includes('Portfolio deleted successfully')) {
        throw new Error('Unexpected response: Portfolio deletion not confirmed');
      }

      await fetchPortfolioData();
      return true;
    } catch (err) {
      setError('Failed to delete portfolio');
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    navigate('/SignIn');
  };

  useEffect(() => {
    if (userId) {
      fetchPortfolioData();
    } else {
      setError('Please sign in to view your portfolio.');
      setLoading(false);
      navigate('/SignIn');
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (selectedStock) {
      const fetchComparisonData = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/stock/${selectedStock}/compare`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch comparison data');
          }
          const data = await response.json();
          setComparisonData(data);
        } catch (err) {
          setPerformanceError(`Failed to fetch comparison data: ${err.message}`);
        }
      };

      const fetchPerformanceData = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/stock/${selectedStock}/performance`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch performance data');
          }
          const data = await response.json();
          setPerformanceData(data.historicalDataResponse?.events?.[0]?.attributes?.[0] || null);
        } catch (err) {
          setPerformanceError(`Failed to fetch performance data: ${err.message}`);
        }
      };

      fetchComparisonData();
      fetchPerformanceData();
    } else {
      setComparisonData(null);
      setPerformanceData(null);
      setPerformanceError(null);
    }
  }, [selectedStock]);

  return (
    <Box sx={{ display: 'flex', bgcolor: 'grey.100', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: 'primary.main',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ fontWeight: 500, color: 'white', flexGrow: 1 }}>
            Portfolio Dashboard
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Sidebar drawerWidth={drawerWidth} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 500, color: 'grey.900', mb: 2 }}>
              Dashboard
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <PortfolioOverview
                  portfolio={portfolio}
                  performance={performance}
                  allocation={allocation}
                  loading={loading}
                  error={error}
                  onAddAssets={() => setOpenAddAssetsModal(true)}
                  onDeleteStock={deleteStock}
                  onDeletePortfolio={deletePortfolio}
                  onStockClick={setSelectedStock}
                />
              </Paper>
            </Grid>
            {portfolio && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 500, color: 'grey.900', mb: 2 }}>
                    Sector Comparison
                  </Typography>
                  <SectorComparisonCarousel portfolio={portfolio} />
                </Paper>
              </Grid>
            )}
            {allocation && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 500, color: 'grey.900', mb: 2 }}>
                    Sector Allocation
                  </Typography>
                  <AllocationPieChart allocation={allocation} />
                </Paper>
              </Grid>
            )}
            {selectedStock && comparisonData && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <StockComparisonBarChart
                    stock={selectedStock}
                    comparisonData={comparisonData}
                    onClose={() => setSelectedStock(null)}
                  />
                </Paper>
              </Grid>
            )}
          </Grid>
          {selectedStock && (
            <StockPerformanceModal
              symbol={selectedStock}
              performanceData={performanceData}
              performanceError={performanceError}
              onClose={() => setSelectedStock(null)}
            />
          )}
          <AddAssetsModal
            open={openAddAssetsModal}
            onClose={() => setOpenAddAssetsModal(false)}
            onAddAssets={addAssets}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default Dashboard;