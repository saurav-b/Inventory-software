import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import api from '../lib/api.js';

export default function DashboardPage() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    let ok = true;
    api
      .get('/dashboard')
      .then((r) => {
        if (ok) setData(r.data.data);
      })
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, []);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={800}>
        Dashboard
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Sales
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {data ? `৳${data.sales.today.toFixed(2)}` : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today
              </Typography>
              <Typography sx={{ mt: 1 }} variant="h6" fontWeight={700}>
                {data ? `৳${data.sales.month.toFixed(2)}` : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Stock summary
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {data ? data.stock.skuCount : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SKUs
              </Typography>
              <Typography sx={{ mt: 1 }} variant="h6" fontWeight={700}>
                {data ? data.stock.totalUnits : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total units
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Low stock alerts
              </Typography>
              <List dense>
                {(data?.stock.lowStock || []).slice(0, 8).map((p) => (
                  <ListItem key={p.productId} disableGutters>
                    <ListItemText
                      primary={`${p.name} (${p.productId})`}
                      secondary={`Qty: ${p.stockQty}  •  Threshold: ${p.lowStockThreshold}`}
                    />
                  </ListItem>
                ))}
                {!data ? (
                  <ListItem disableGutters>
                    <ListItemText primary="—" />
                  </ListItem>
                ) : null}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Top selling (this month)
              </Typography>
              <List dense>
                {(data?.topSelling || []).map((t) => (
                  <ListItem key={t._id} disableGutters>
                    <ListItemText primary={t.name} secondary={`Qty: ${t.qty}`} />
                  </ListItem>
                ))}
                {!data ? (
                  <ListItem disableGutters>
                    <ListItemText primary="—" />
                  </ListItem>
                ) : null}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

