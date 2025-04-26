import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Container, Alert } from '@mui/material';

const API_BASE_URL = 'https://aui6flvy73.execute-api.us-east-1.amazonaws.com';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.UserId) {
        throw new Error('Failed to login');
      }

      localStorage.setItem('userId', data.UserId);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to login. Please check your credentials and try again.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" sx={{ fontWeight: 500, color: 'grey.900', mb: 3, textAlign: 'center' }}>
          Sign In
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            variant="outlined"
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2, borderRadius: 2, textTransform: 'none', py: 1.5 }}
          >
            Sign In
          </Button>
        </Box>
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Don't have an account?{' '}
          <Button component="a" href="/SignUp" sx={{ textTransform: 'none' }}>
            Sign Up
          </Button>
        </Typography>
      </Paper>
    </Container>
  );
}

export default SignIn;