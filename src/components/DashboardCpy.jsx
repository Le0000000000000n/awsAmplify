// import React, { useState, useEffect, useRef } from 'react';
// import {
//   Box,
//   AppBar,
//   Toolbar,
//   Typography,
//   Drawer,
//   List,
//   ListItem,
//   ListItemText,
//   Card,
//   CardContent,
//   Button,
//   CircularProgress,
//   Alert,
//   AlertTitle,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
// } from '@mui/material';
// import { Chart as ChartJS, ArcElement, Tooltip, BarElement, CategoryScale, LinearScale } from 'chart.js';
// import { Pie, Bar } from 'react-chartjs-2';

// ChartJS.register(ArcElement, Tooltip, BarElement, CategoryScale, LinearScale);

// const drawerWidth = 240;
// const API_BASE_URL = 'https://e5lpxos917.execute-api.us-east-1.amazonaws.com';

// const Dashboard = () => {
//   const [portfolio, setPortfolio] = useState(null);
//   const [performance, setPerformance] = useState(null);
//   const [allocation, setAllocation] = useState(null);
//   const [selectedStock, setSelectedStock] = useState(null);
//   const [comparisonData, setComparisonData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const userId = 'dd4f509a-e839-4f1a-9a84-6441ada1c7e6';
//   const pieChartRef = useRef(null);
//   const barChartRef = useRef(null);

//   const createDefaultPortfolio = async () => {
//     try {
//       const defaultAssets = [
//         { symbol: 'AAPL', price: 250, quantity: 4 },
//         { symbol: 'GOOGL', price: 250, quantity: 2 },
//       ];
//       const response = await fetch(`${API_BASE_URL}/portfolio/assets`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           // Replace with your API key if required
//           // 'x-api-key': 'YOUR_API_KEY',
//         },
//         body: JSON.stringify({
//           userId,
//           assets: defaultAssets,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to create portfolio: ${response.status}`);
//       }

//       console.log('Default portfolio created successfully');
//       return true;
//     } catch (err) {
//       console.error('Failed to create default portfolio:', err);
//       return false;
//     }
//   };

//   const fetchPortfolioData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       let perfResponse = await fetch(`${API_BASE_URL}/portfolio/performance/${userId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           // Replace with your API key if required
//           // 'x-api-key': 'YOUR_API_KEY',
//         },
//       });

//       if (!perfResponse.ok) {
//         if (perfResponse.status === 404) {
//           const created = await createDefaultPortfolio();
//           if (!created) {
//             throw new Error('Failed to create a default portfolio.');
//           }
//           perfResponse = await fetch(`${API_BASE_URL}/portfolio/performance/${userId}`, {
//             method: 'GET',
//             headers: {
//               'Content-Type': 'application/json',
//               // Replace with your API key if required
//               // 'x-api-key': 'YOUR_API_KEY',
//             },
//           });
//         } else {
//           throw new Error(`Server error: ${perfResponse.status}`);
//         }
//       }

//       const perfData = await perfResponse.json();
//       if (!perfData.stocks || perfData.stocks.length === 0) {
//         throw new Error('No portfolio assets found');
//       }
//       setPerformance(perfData);

//       const allocResponse = await fetch(`${API_BASE_URL}/portfolio/allocation/${userId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           // Replace with your API key if required
//           // 'x-api-key': 'YOUR_API_KEY',
//         },
//       });
//       if (!allocResponse.ok) {
//         throw new Error(`Failed to fetch allocation: ${allocResponse.status}`);
//       }
//       const allocData = await allocResponse.json();
//       setAllocation(allocData);

//       const portfolioData = {
//         assets: perfData.stocks.map((stock) => ({
//           symbol: stock.symbol,
//           quantity: stock.totalInvested / 250,
//           purchasePrice: 250,
//           purchaseDate: '2025-03-01T01:00',
//           currentPrice: stock.currentValue / (stock.totalInvested / 250),
//         })),
//       };
//       setPortfolio(portfolioData);
//     } catch (error) {
//       console.error('Error fetching portfolio data:', error);
//       if (error.message === 'No portfolio assets found') {
//         setError('No portfolio assets found. Please create a portfolio.');
//       } else {
//         setError('Failed to fetch portfolio data. Please check your network or try again later.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedStock) {
//       const fetchComparisonData = async () => {
//         try {
//           const response = await fetch(`${API_BASE_URL}/stock/compare/${selectedStock}`, {
//             method: 'GET',
//             headers: {
//               'Content-Type': 'application/json',
//               // Replace with your API key if required
//               // 'x-api-key': 'YOUR_API_KEY',
//             },
//           });
//           if (!response.ok) {
//             throw new Error(`Failed to fetch comparison data: ${response.status}`);
//           }
//           const data = await response.json();
//           setComparisonData(data);
//         } catch (error) {
//           console.error('Error fetching comparison data:', error);
//           setError('Failed to fetch stock comparison data. Please try again.');
//         }
//       };
//       fetchComparisonData();
//     }
//   }, [selectedStock]);

//   useEffect(() => {
//     fetchPortfolioData();
//   }, []);

//   const handleStockClick = (symbol) => {
//     setSelectedStock(symbol);
//   };

//   const pieChartData = allocation
//     ? {
//         labels: allocation.sectorAllocations?.map((sector) => sector.sector) || [],
//         datasets: [
//           {
//             label: 'Sector Allocation',
//             data: allocation.sectorAllocations?.map((sector) => sector.totalWeight) || [],
//             backgroundColor: [
//               'rgba(255, 99, 132, 0.2)',
//               'rgba(54, 162, 235, 0.2)',
//               'rgba(255, 206, 86, 0.2)',
//               'rgba(75, 192, 192, 0.2)',
//               'rgba(153, 102, 255, 0.2)',
//             ],
//             borderColor: [
//               'rgba(255, 99, 132, 1)',
//               'rgba(54, 162, 235, 1)',
//               'rgba(255, 206, 86, 1)',
//               'rgba(75, 192, 192, 1)',
//               'rgba(153, 102, 255, 1)',
//             ],
//             borderWidth: 1,
//           },
//         ],
//       }
//     : null;

//   const barChartData = comparisonData
//     ? {
//         labels: ['Innovativeness', 'Hiring', 'Sustainability', 'Insider Sentiments', 'Earnings Reports', 'Dividends'],
//         datasets: [
//           {
//             label: 'Company',
//             data: comparisonData.events?.[0]?.attributes?.company
//               ? Object.values(comparisonData.events[0].attributes.company)
//               : [],
//             backgroundColor: 'rgba(255, 99, 132, 0.2)',
//             borderColor: 'rgba(255, 99, 132, 1)',
//             borderWidth: 1,
//           },
//           {
//             label: 'Sector',
//             data: comparisonData.events?.[0]?.attributes?.sector
//               ? Object.values(comparisonData.events[0].attributes.sector)
//               : [],
//             backgroundColor: 'rgba(54, 162, 235, 0.2)',
//             borderColor: 'rgba(54, 162, 235, 1)',
//             borderWidth: 1,
//           },
//         ],
//       }
//     : null;

//   return (
//     <Box sx={{ display: 'flex' }}>
//       <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}>
//         <Toolbar>
//           <Typography variant="h6" noWrap component="div">
//             Dashboard
//           </Typography>
//         </Toolbar>
//       </AppBar>
//       <Drawer
//         sx={{
//           width: drawerWidth,
//           flexShrink: 0,
//           '& .MuiDrawer-paper': {
//             width: drawerWidth,
//             boxSizing: 'border-box',
//           },
//         }}
//         variant="permanent"
//         anchor="left"
//       >
//         <Toolbar />
//         <List>
//           {['Portfolio', 'Watchlist', 'Alerts'].map((text) => (
//             <ListItem key={text} button>
//               <ListItemText primary={text} />
//             </ListItem>
//           ))}
//         </List>
//       </Drawer>
//       <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
//         <Toolbar />
//         {loading && <CircularProgress />}
//         {error && (
//           <Alert severity="error">
//             <AlertTitle>Error</AlertTitle>
//             {error}
//             {!portfolio && (
//               <Button onClick={createDefaultPortfolio} sx={{ mt: 1 }}>
//                 Create Default Portfolio
//               </Button>
//             )}
//           </Alert>
//         )}
//         {!loading && !error && !portfolio && (
//           <Alert severity="info">
//             <AlertTitle>No Portfolio Found</AlertTitle>
//             No portfolio assets found. Click{' '}
//             <Button onClick={createDefaultPortfolio}>here</Button> to create a default portfolio.
//           </Alert>
//         )}
//         {!loading && !error && portfolio && (
//           <>
//             <Card sx={{ mb: 2 }}>
//               <CardContent>
//                 <Typography variant="h5" component="div">
//                   Portfolio Overview
//                 </Typography>
//                 <Table>
//                   <TableHead>
//                     <TableRow>
//                       <TableCell>Symbol</TableCell>
//                       <TableCell>Quantity</TableCell>
//                       <TableCell>Purchase Price</TableCell>
//                       <TableCell>Purchase Date</TableCell>
//                       <TableCell>Current Price</TableCell>
//                       <TableCell>Actions</TableCell>
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {portfolio.assets.map((asset) => (
//                       <TableRow key={asset.symbol}>
//                         <TableCell>{asset.symbol}</TableCell>
//                         <TableCell>{asset.quantity}</TableCell>
//                         <TableCell>${asset.purchasePrice.toFixed(2)}</TableCell>
//                         <TableCell>{asset.purchaseDate}</TableCell>
//                         <TableCell>${asset.currentPrice.toFixed(2)}</TableCell>
//                         <TableCell>
//                           <Button onClick={() => handleStockClick(asset.symbol)}>Compare</Button>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </CardContent>
//             </Card>
//             {pieChartData && pieChartData.labels.length > 0 && (
//               <Card sx={{ mb: 2 }}>
//                 <CardContent>
//                   <Typography variant="h5" component="div">
//                     Portfolio Allocation
//                   </Typography>
//                   <Pie ref={pieChartRef} data={pieChartData} />
//                 </CardContent>
//               </Card>
//             )}
//             {barChartData && selectedStock && (
//               <Card>
//                 <CardContent>
//                   <Typography variant="h5" component="div">
//                     Stock Comparison: {selectedStock}
//                   </Typography>
//                   <Bar ref={barChartRef} data={barChartData} />
//                 </CardContent>
//               </Card>
//             )}
//           </>
//         )}
//       </Box>
//     </Box>
//   );
// };

// export default Dashboard;