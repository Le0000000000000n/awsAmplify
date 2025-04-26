import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import Carousel from 'react-material-ui-carousel';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

const API_BASE_URL = 'https://aui6flvy73.execute-api.us-east-1.amazonaws.com';

// Simple in-memory cache
const cache = {};

function SectorComparisonCarousel({ portfolio }) {
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchSectorComparisons = async () => {
      if (!portfolio || !portfolio.assets || portfolio.assets.length === 0) {
        setSectorData([]);
        setLoading({});
        setErrors({});
        return;
      }

      // Get unique symbols
      const uniqueSymbols = [...new Set(portfolio.assets.map((asset) => asset.symbol))];
      const uniqueAssets = uniqueSymbols.map((symbol) =>
        portfolio.assets.find((asset) => asset.symbol === symbol)
      );

      // Initialize states
      const initialLoading = {};
      const initialErrors = {};
      uniqueSymbols.forEach((symbol) => {
        initialLoading[symbol] = true;
        initialErrors[symbol] = null;
      });
      setLoading(initialLoading);
      setErrors(initialErrors);
      setSectorData([]);

      // Sequential fetch with delay for unique symbols
      for (const asset of uniqueAssets) {
        const symbol = asset.symbol;

        // Check cache
        if (cache[symbol]) {
          setSectorData((prev) => [...prev, cache[symbol]]);
          setLoading((prev) => ({ ...prev, [symbol]: false }));
          continue;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/stock/${symbol}/compare`, {
            method: 'GET',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch sector comparison for ${symbol}`);
          }
          const data = await response.json();
          const attributes = data.events?.[0]?.attributes || {};
          const stockData = {
            symbol,
            sectorInfo: attributes.sectorInfo || 'Unknown',
            company: attributes.company || {},
            sector: attributes.sector || {},
          };

          // Cache result
          cache[symbol] = stockData;

          // Update incrementally
          setSectorData((prev) => [...prev, stockData]);
          setLoading((prev) => ({ ...prev, [symbol]: false }));
        } catch (err) {
          setErrors((prev) => ({ ...prev, [symbol]: err.message }));
          setLoading((prev) => ({ ...prev, [symbol]: false }));
        }

        // Delay to prevent network congestion
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    };

    // Defer fetch to avoid blocking selectedStock
    const timer = setTimeout(() => {
      fetchSectorComparisons();
    }, 100);

    return () => clearTimeout(timer);
  }, [portfolio]);

  const chartData = (stock) => [
    { metric: 'Innovativeness', stock: (stock.company.innovativeness || 0) * 100, sector: (stock.sector.innovativeness || 0) * 100 },
    { metric: 'Hiring', stock: (stock.company.hiring || 0) * 100, sector: (stock.sector.hiring || 0) * 100 },
    { metric: 'Sustainability', stock: (stock.company.sustainability || 0) * 100, sector: (stock.sector.sustainability || 0) * 100 },
    { metric: 'Insider Sentiments', stock: (stock.company.insiderSentiments || 0) * 100, sector: (stock.sector.insiderSentiments || 0) * 100 },
    { metric: 'Earnings Reports', stock: (stock.company.earningsReports || 0) * 100, sector: (stock.sector.earningsReports || 0) * 100 },
    { metric: 'Dividends', stock: (stock.company.dividends || 0) * 100, sector: (stock.sector.dividends || 0) * 100 },
  ];

  if (!portfolio || !portfolio.assets || portfolio.assets.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No portfolio stocks to compare.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4, mb: 4, bgcolor: '#f5f5f5', borderRadius: 2, p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Stock vs. Sector Comparison
      </Typography>
      {sectorData.length === 0 && Object.values(loading).some((isLoading) => isLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {sectorData.length === 0 && !Object.values(loading).some((isLoading) => isLoading) && (
        <Typography color="error" sx={{ textAlign: 'center' }}>
          No comparison data available.
        </Typography>
      )}
      {sectorData.length > 0 && (
        <Carousel
          autoPlay={false}
          indicators={true}
          navButtonsAlwaysVisible={true}
          cycleNavigation={sectorData.length > 1}
          animation="slide"
          duration={500}
          sx={{ width: '100%' }}
        >
          {sectorData.map((stock) => (
            <Box key={stock.symbol} sx={{ p: 2 }}>
              {loading[stock.symbol] ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', height: 300 }}>
                  <CircularProgress />
                </Box>
              ) : errors[stock.symbol] ? (
                <Typography color="error" sx={{ textAlign: 'center' }}>
                  {errors[stock.symbol]}
                </Typography>
              ) : (
                <>
                  <Typography variant="h6" align="center" sx={{ mb: 2, fontWeight: 'medium' }}>
                    {stock.symbol} vs. {stock.sectorInfo} Sector
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={chartData(stock)} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#333' }} />
                      <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
                      <Radar
                        name={`${stock.symbol}`}
                        dataKey="stock"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name={`${stock.sectorInfo} Average`}
                        dataKey="sector"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <Typography
                    variant="body2"
                    align="center"
                    sx={{ mt: 2, maxWidth: 600, mx: 'auto', color: '#555' }}
                  >
                    This radar chart compares {stock.symbol} to the {stock.sectorInfo} sector average across six metrics
                    (0–100 scale): Innovativeness (R&D and product launches), Hiring (employment trends),
                    Sustainability (ESG performance), Insider Sentiments (executive confidence),
                    Earnings Reports (financial performance), and Dividends (payout consistency).
                  </Typography>
                </>
              )}
            </Box>
          ))}
        </Carousel>
      )}
    </Box>
  );
}

export default SectorComparisonCarousel;