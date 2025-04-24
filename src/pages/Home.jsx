import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <Box sx={{ textAlign: 'center', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to the Portfolio Dashboard
      </Typography>
      <Button variant="contained" component={Link} to="/dashboard">
        Go to Dashboard
      </Button>
    </Box>
  );
}

export default Home;