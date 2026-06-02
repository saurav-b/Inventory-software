import React from 'react';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import api from '../lib/api.js';
import InvoicePrint from '../ui/InvoicePrint.jsx';

export default function NewSalePage() {
  const [barcodeOrId, setBarcodeOrId] = React.useState('');
  const [qty, setQty] = React.useState(1);
  const [cart, setCart] = React.useState([]); // {productId, name, qty}
  const [products, setProducts] = React.useState([]);
  const [error, setError] = React.useState('');
  const [invoice, setInvoice] = React.useState(null);
  const printRef = React.useRef(null);

  React.useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data.data)).catch(() => {});
  }, []);

  const byAny = React.useMemo(() => {
    const map = new Map();
    for (const p of products) {
      map.set(p.productId, p);
      map.set(p.barcodeValue, p);
    }
    return map;
  }, [products]);

  const addItem = () => {
    setError('');
    const key = barcodeOrId.trim();
    if (!key) return;
    const p = byAny.get(key);
    if (!p) {
      setError('No product found for that barcode/product ID.');
      return;
    }
    const q = Math.max(1, Number(qty) || 1);
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.productId === p.productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + q };
        return next;
      }
      return [...prev, { productId: p.productId, name: p.name, qty: q }];
    });
    setBarcodeOrId('');
    setQty(1);
  };

  const totalEst = cart.reduce((sum, it) => {
    const p = products.find((x) => x.productId === it.productId);
    return sum + (p ? p.sellingPrice * it.qty : 0);
  }, 0);

  const createAndPrint = async () => {
    setError('');
    try {
      const res = await api.post('/transactions', {
        type: 'sale',
        items: cart.map((c) => ({ productId: c.productId, qty: c.qty })),
        payment: { status: 'paid', paidAmount: totalEst, method: 'cash' },
        discount: 0,
        tax: 0
      });
      setInvoice(res.data.data);
    } catch (e) {
      setError(e?.response?.data?.error?.message || 'Failed to create sale');
    }
  };

  const doPrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: invoice ? `Invoice-${invoice.number}` : 'Invoice'
  });

  React.useEffect(() => {
    if (invoice) doPrint?.();
  }, [invoice, doPrint]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={800}>
        New Sale
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              label="Scan barcode / enter Product ID"
              value={barcodeOrId}
              onChange={(e) => setBarcodeOrId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem();
              }}
              fullWidth
            />
            <TextField
              label="Qty"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              sx={{ width: 120 }}
              inputProps={{ min: 1 }}
            />
            <Button variant="contained" onClick={addItem}>
              Add
            </Button>
          </Stack>
          {error ? (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography fontWeight={800}>Cart</Typography>
          {cart.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Scan items to add them to the cart.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {cart.map((it) => (
                <Stack key={it.productId} direction="row" justifyContent="space-between">
                  <Typography>
                    {it.name} ({it.productId})
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>Qty: {it.qty}</Typography>
                    <Button
                      size="small"
                      onClick={() => setCart((prev) => prev.filter((x) => x.productId !== it.productId))}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Stack>
              ))}
              <Typography sx={{ mt: 1 }} fontWeight={900}>
                Total (est.): ৳{totalEst.toFixed(2)}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => setCart([])}>
                  Clear
                </Button>
                <Button variant="contained" onClick={createAndPrint} disabled={cart.length === 0}>
                  Confirm payment & print invoice
                </Button>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!invoice} onClose={() => setInvoice(null)} maxWidth="md" fullWidth>
        <DialogTitle>Invoice created</DialogTitle>
        <DialogContent>
          {invoice ? (
            <div style={{ overflowX: 'auto' }}>
              <div ref={printRef}>
                <InvoicePrint invoice={invoice} />
              </div>
            </div>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoice(null)}>Close</Button>
          <Button variant="contained" onClick={() => doPrint?.()}>
            Print again
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

