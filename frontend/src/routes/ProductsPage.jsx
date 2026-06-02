import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { getSession } from '../lib/auth.js';
import api from '../lib/api.js';

function ProductCard({ p, apiBase }) {
  const low = p.stockQty <= p.lowStockThreshold;
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography fontWeight={800}>{p.name}</Typography>
            {low ? <Chip color="warning" size="small" label="Low" /> : <Chip size="small" label="OK" />}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {p.category} • {p.productId}
          </Typography>
          <Typography variant="body2">
            Purchase: ৳{p.purchasePrice} • Selling: ৳{p.sellingPrice}
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            Stock: {p.stockQty}
          </Typography>
          <Box>
            <img
              alt={`barcode-${p.productId}`}
              style={{ width: '100%', maxWidth: 320 }}
              src={`${apiBase}/api/products/${encodeURIComponent(p.productId)}/barcode.png`}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const { user } = getSession();
  const isAdmin = user?.role === 'admin';
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    category: '',
    purchasePrice: 0,
    sellingPrice: 0,
    stockQty: 0
  });
  const [err, setErr] = React.useState('');

  const load = React.useCallback(() => {
    api
      .get('/products', { params: q ? { q } : {} })
      .then((r) => setRows(r.data.data))
      .catch(() => {});
  }, [q]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onCreate = async () => {
    setErr('');
    try {
      await api.post('/products', {
        name: form.name,
        category: form.category,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        stockQty: Number(form.stockQty)
      });
      setOpen(false);
      setForm({ name: '', category: '', purchasePrice: 0, sellingPrice: 0, stockQty: 0 });
      load();
    } catch (e) {
      setErr(e?.response?.data?.error?.message || 'Failed to create product');
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Typography variant="h5" fontWeight={800}>
          Products
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField size="small" placeholder="Search name, category, ID, barcode…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button variant="outlined" onClick={load}>
            Search
          </Button>
          <Button variant="contained" disabled={!isAdmin} onClick={() => setOpen(true)}>
            Add Product
          </Button>
        </Stack>
      </Stack>

      {!isAdmin ? (
        <Typography variant="body2" color="text.secondary">
          Note: only admins can add/edit products or adjust stock.
        </Typography>
      ) : null}

      <Grid container spacing={2}>
        {rows.map((p) => (
          <Grid item xs={12} md={6} lg={4} key={p.productId}>
            <ProductCard p={p} apiBase={apiBase} />
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add product</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            <TextField label="Category" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Purchase price"
                type="number"
                value={form.purchasePrice}
                onChange={(e) => setForm((s) => ({ ...s, purchasePrice: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Selling price"
                type="number"
                value={form.sellingPrice}
                onChange={(e) => setForm((s) => ({ ...s, sellingPrice: e.target.value }))}
                fullWidth
              />
            </Stack>
            <TextField
              label="Starting stock quantity"
              type="number"
              value={form.stockQty}
              onChange={(e) => setForm((s) => ({ ...s, stockQty: e.target.value }))}
            />
            {err ? (
              <Typography variant="body2" color="error">
                {err}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

