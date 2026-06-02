import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../lib/api.js';
import { setSession } from '../lib/auth.js';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export default function LoginPage() {
  const nav = useNavigate();
  const [error, setError] = React.useState('');

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (values) => {
    setError('');
    try {
      const res = await api.post('/auth/login', values);
      setSession(res.data.data);
      nav('/', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <Stack sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              Motif Collection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to continue
            </Typography>

            <TextField
              label="Email"
              autoComplete="username"
              {...form.register('email')}
              error={!!form.formState.errors.email}
              helperText={form.formState.errors.email?.message}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
              error={!!form.formState.errors.password}
              helperText={form.formState.errors.password?.message}
            />

            {error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : null}

            <Button variant="contained" size="large" onClick={form.handleSubmit(onSubmit)}>
              Login
            </Button>
            <Typography variant="caption" color="text.secondary">
              Seeded users: admin@motif.local / Admin@12345, staff@motif.local / Staff@12345
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

