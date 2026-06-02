import React from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';

export default function InvoicePrint({ invoice }) {
  // Printable invoice (A4 friendly) — the parent triggers window.print().
  const now = new Date(invoice.createdAt || Date.now());

  return (
    <Box sx={{ p: 2, color: '#111', bgcolor: '#fff', width: '210mm', minHeight: '297mm' }}>
      <style>
        {`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: left; font-size: 12px; }
          th { background: #fafafa; font-weight: 700; }
        `}
      </style>

      <Stack spacing={1}>
        <Typography variant="h5" fontWeight={900}>
          Motif Collection
        </Typography>
        <Typography variant="body2">Invoice: {invoice.number}</Typography>
        <Typography variant="body2">Date: {now.toLocaleString()}</Typography>
        <Divider />

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => {
              const unit =
                invoice.type === 'purchase' || invoice.type === 'purchase_return'
                  ? it.purchasePriceSnapshot
                  : it.sellingPriceSnapshot;
              return (
                <tr key={it.productId}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{it.nameSnapshot}</div>
                    <div style={{ opacity: 0.75 }}>{it.productId}</div>
                  </td>
                  <td>{it.qty}</td>
                  <td>৳{unit}</td>
                  <td>৳{(unit * it.qty).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Stack direction="row" justifyContent="flex-end" spacing={3} sx={{ mt: 1 }}>
          <Stack spacing={0.25} sx={{ minWidth: 240 }}>
            <Row label="Subtotal" value={`৳${invoice.subtotal.toFixed(2)}`} />
            <Row label="Tax" value={`৳${invoice.tax.toFixed(2)}`} />
            <Row label="Discount" value={`৳${invoice.discount.toFixed(2)}`} />
            <Divider />
            <Row label="Total" value={`৳${invoice.total.toFixed(2)}`} bold />
            <Row label="Payment" value={invoice.payment.status.toUpperCase()} />
          </Stack>
        </Stack>

        <Divider sx={{ mt: 2 }} />
        <Typography variant="caption" sx={{ mt: 1 }}>
          Thank you for shopping with Motif Collection.
        </Typography>
      </Stack>
    </Box>
  );
}

function Row({ label, value, bold }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" sx={{ fontWeight: bold ? 900 : 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 900 : 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}

