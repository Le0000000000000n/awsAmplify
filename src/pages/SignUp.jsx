import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Container, Alert } from '@mui/material';

const API_BASE_URL = 'https://aui6flvy73.execute-api.us-east-1.amazonaws.com';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      console.log(JSON.stringify({ email: email, password: password, name: name }))
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
         },
        body: JSON.stringify({ email: email, password: password, name: name }),
      });

      const data = await response.json();
      console.log(response)
      console.log(data)
      if (!response.ok || !data.userId) {
        throw new Error(data.error || 'Failed to sign up');
      }

      localStorage.setItem('userId', data.userId);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign up. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" sx={{ fontWeight: 500, color: 'grey.900', mb: 3, textAlign: 'center' }}>
          Sign Up
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            variant="outlined"
          />
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
            Sign Up
          </Button>
        </Box>
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Already have an account?{' '}
          <Button component="a" href="/SignIn" sx={{ textTransform: 'none' }}>
            Sign In
          </Button>
        </Typography>
      </Paper>
    </Container>
  );
}

export default SignUp;