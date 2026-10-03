import { useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { cancelOrder, fetchOrders } from '../api.js';
import { useApi } from '../hooks.js';
import { Empty, ErrorBox, Loading } from '../components.jsx';
import { useToast } from '../store.jsx';

// S3 (create happens via products/cart - here we list) + S4 list/cancel.
// confirm dialog avoids accidental cancel - backend also guards non-cancellable states.
export default function OrdersPage() {
  const { data, loading, error, setData } = useApi(fetchOrders, []);
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const { push } = useToast();

  const orders = useMemo(() => data?.data || [], [data]);

  const doCancel = async () => {
    setBusy(true);
    setLocalError('');
    try {
      await cancelOrder(confirmId);
      // optimistic-ish: refetch is safer than hand-editing totals
      const fresh = await fetchOrders();
      setData(fresh);
      push(`Order #${confirmId} cancelled, stock restored`, 'success');
      setConfirmId(null);
    } catch (e) {
      // 409 means already shipped/delivered - show plain words
      setLocalError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Orders
      </Typography>

      {loading && <Loading label="Fetching orders..." />}
      <ErrorBox message={error || localError} />
      {!loading && !error && orders.length === 0 && <Empty text="No orders yet." />}

      {!loading && orders.length > 0 && (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>#{o.id}</TableCell>
                  <TableCell>
                    <Chip size="small" label={o.status} />
                  </TableCell>
                  <TableCell>${o.total_amount ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setConfirmId(o.id)}>
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={confirmId !== null} onClose={() => setConfirmId(null)}>
        <DialogTitle>Cancel order #{confirmId}?</DialogTitle>
        <DialogContent>Stock will be restored. Shipped/delivered orders cannot be cancelled.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Keep</Button>
          <Button variant="contained" color="error" disabled={busy} onClick={doCancel}>
            {busy ? 'Cancelling...' : 'Yes, cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
