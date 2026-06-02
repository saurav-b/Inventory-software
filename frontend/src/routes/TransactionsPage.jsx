import React from 'react';
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import api from '../lib/api.js';

export default function TransactionsPage() {
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    api.get('/transactions').then((r) => setRows(r.data.data)).catch(() => {});
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={800}>
        Transactions
      </Typography>
      {rows.map((t) => (
        <Card key={t.number} variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
              <Stack>
                <Typography fontWeight={900}>
                  {t.number}{' '}
                  <Chip
                    size="small"
                    label={t.type.replace('_', ' ')}
                    sx={{ ml: 1, textTransform: 'capitalize' }}
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(t.createdAt).toLocaleString()}
                </Typography>
              </Stack>
              <Stack alignItems={{ md: 'flex-end' }}>
                <Typography fontWeight={900}>৳{Number(t.total).toFixed(2)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Payment: {t.payment.status}
                </Typography>
              </Stack>
            </Stack>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Items: {t.items.reduce((sum, i) => sum + i.qty, 0)}
            </Typography>
          </CardContent>
        </Card>
      ))}
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No transactions yet.
        </Typography>
      ) : null}
    </Stack>
  );
}

