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
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { cancelOrder, createOrder, fetchCustomers, fetchOrders, fetchProducts, updateOrderStatus } from '../api.js';
import { useApi } from '../hooks.js';
import { Empty, ErrorBox, Loading } from '../components.jsx';
import { useToast } from '../store.jsx';

// S3 create (customer + up to 5 line items) + S4 list/cancel + status advance.
// Backend enforces: customer exists, stock locked, no duplicate product, max 5 items.
// confirm dialog avoids accidental cancel - backend also guards non-cancellable states.
export default function OrdersPage() {
  const { data, loading, error, setData } = useApi(fetchOrders, []);
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const { push } = useToast();
  // create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [rows, setRows] = useState([{ product_id: '', quantity: 1 }]);
  const [formError, setFormError] = useState('');
  // status advance
  const [statusId, setStatusId] = useState(null);
  const [nextStatus, setNextStatus] = useState('CONFIRMED');

  const orders = useMemo(() => data?.data || [], [data]);

  const reload = async () => setData(await fetchOrders());

  const openCreate = async () => {
    setFormError(''); setCustomerId(''); setRows([{ product_id: '', quantity: 1 }]);
    setCreateOpen(true);
    // load dropdowns lazily - only when user wants to create
    try {
      const [c, pr] = await Promise.all([fetchCustomers(), fetchProducts({ limit: 100 })]);
      setCustomers(c?.data || []);
      setProducts(pr?.data || []);
    } catch (e) { setFormError(e.message); }
  };
  const setRow = (i, k) => (e) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: e.target.value } : r)));
  const addRow = () => { if (rows.length < 5) setRows([...rows, { product_id: '', quantity: 1 }]); };
  const removeRow = (i) => setRows(rows.filter((_, j) => j !== i));

  const doCreate = async () => {
    if (!customerId) { setFormError('Pick a customer.'); return; }
    const items = rows.filter((r) => r.product_id).map((r) => ({ product_id: Number(r.product_id), quantity: Math.max(1, Number(r.quantity) || 1) }));
    if (!items.length) { setFormError('Add at least one product.'); return; }
    if (new Set(items.map((i) => i.product_id)).size !== items.length) { setFormError('Same product twice - merge quantities instead.'); return; }
    setBusy(true); setFormError('');
    try {
      await createOrder({ customer_id: Number(customerId), line_items: items });
      await reload(); setCreateOpen(false);
      push('Order created', 'success');
    } catch (e) { setFormError(e.message); } // 400 stock / 404 customer / 429 rate-limit land here
    finally { setBusy(false); }
  };

  const doStatus = async () => {
    setBusy(true); setLocalError('');
    try {
      await updateOrderStatus(statusId, nextStatus);
      await reload(); setStatusId(null);
      push(`Order #${statusId} -> ${nextStatus}`, 'success');
    } catch (e) { setLocalError(e.message); }
    finally { setBusy(false); }
  };

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Orders</Typography>
        <Button variant="contained" onClick={openCreate}>New order</Button>
      </Stack>

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
                    <Button size="small" onClick={() => { setStatusId(o.id); setNextStatus('CONFIRMED'); setLocalError(''); }}>Status</Button>
                    <Button size="small" color="error" onClick={() => setConfirmId(o.id)}>Cancel</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* create order: customer + up to 5 line items */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New order</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} select fullWidth>
              {customers.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>#{c.id} {c.name}</MenuItem>
              ))}
            </TextField>
            {rows.map((r, i) => (
              <Stack key={i} direction="row" spacing={1}>
                <TextField label={`Item ${i + 1}`} value={r.product_id} onChange={setRow(i, 'product_id')} select fullWidth>
                  {products.map((pr) => (
                    <MenuItem key={pr.id} value={String(pr.id)}>{pr.name} (stock {pr.stock_quantity})</MenuItem>
                  ))}
                </TextField>
                <TextField label="Qty" type="number" value={r.quantity} onChange={setRow(i, 'quantity')} sx={{ width: 90 }} />
                {rows.length > 1 && <Button onClick={() => removeRow(i)}>X</Button>}
              </Stack>
            ))}
            {rows.length < 5 && <Button onClick={addRow}>+ Add item (max 5)</Button>}
            {formError && <ErrorBox message={formError} />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={doCreate}>{busy ? 'Placing...' : 'Place order'}</Button>
        </DialogActions>
      </Dialog>

      {/* advance status: PENDING/CONFIRMED/... (CANCELLED goes through cancel flow) */}
      <Dialog open={statusId !== null} onClose={() => setStatusId(null)} fullWidth maxWidth="xs">
        <DialogTitle>Order #{statusId} status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="New status" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} select fullWidth>
              {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((st) => (
                <MenuItem key={st} value={st}>{st}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusId(null)}>Close</Button>
          <Button variant="contained" disabled={busy} onClick={doStatus}>{busy ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

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
