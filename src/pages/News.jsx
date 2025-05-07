import React from 'react';
import { Container, Typography, Card, CardContent, CardActionArea, Grid, Button, Chip, Box } from '@mui/material';
import { newsData } from '../FakeData/NewsData.js';
import { useNavigate } from 'react-router-dom';

// Color mapping for stocks
const stockColors = {
  AAPL: { background: '#4caf50', text: '#ffffff' }, // Green
  TSLA: { background: '#d32f2f', text: '#ffffff' }, // Red
  GOOGL: { background: '#1976d2', text: '#ffffff' }, // Blue
  MSFT: { background: '#f57c00', text: '#ffffff' }, // Orange
};

const NewsCard = ({ article }) => {
  const navigate = useNavigate();
  const { background, text } = stockColors[article.stock] || { background: '#e0e0e0', text: '#000000' };

  const handleClick = () => {
    console.log(`Clicked article: ${article.title}`);
    // Add navigation or modal logic here if needed
  };

  return (
    <Card
      className="mb-4"
      sx={{
        borderRadius: '16px',
        border: `2px solid ${background}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <CardActionArea onClick={handleClick}>
        <CardContent>
          <Typography
            variant="h6"
            component="div"
            sx={{ color: background }}
          >
            {article.title}
          </Typography>
          <Typography variant="subtitle2" color="textSecondary" className="mb-2">
            {article.stock} • {article.date}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {article.content}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const News = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" className="text-center mb-4 font-bold">
        Stock News
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
          sx={{ ml: 2 }}
        >
          Back
        </Button>
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(stockColors).map(([stock, { background, text }]) => (
          <Chip
            key={stock}
            label={stock}
            sx={{
              backgroundColor: background,
              color: text,
              fontWeight: 'bold',
            }}
          />
        ))}
      </Box>
      <Grid container spacing={4}>
        {newsData.map((article) => (
          <Grid item xs={12} sm={6} md={4} key={article.id}>
            <NewsCard article={article} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default News;