// S5 customers CRUD - one page: table + dialog for create/edit.
// backend: GET/POST /customers, PUT/DELETE /customers/:id.
// delete 204 ok, 409 when orders exist (shown as-is).
import { useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from '../api.js';
import { useApi } from '../hooks.js';
import { Empty, ErrorBox, Loading } from '../components.jsx';
import { useToast } from '../store.jsx';

const emptyForm = { name: '', email: '', phone: '' };

export default function CustomersPage() {
  const { data, loading, error, setData } = useApi(fetchCustomers, []);
  const { push } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [pageError, setPageError] = useState('');
  const customers = useMemo(() => data?.data || [], [data]);
  const reload = async () => setData(await fetchCustomers());
  const openCreate = () => {
    setEditing(null); setForm(emptyForm); setFormError(''); setFormOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name || '', email: row.email || '', phone: row.phone || '' });
    setFormError(''); setFormOpen(true);
  };
  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required.'); return;
    }
    setBusy(true); setFormError('');
    try {
      if (editing) { await updateCustomer(editing.id, form); }
      else { await createCustomer(form); }
      push(editing ? `Customer #${editing.id} updated` : 'Customer created', 'success');
      await reload(); setFormOpen(false);
    } catch (e) { setFormError(e.message); }
    finally { setBusy(false); }
  };
  const doDelete = async () => {
    setBusy(true); setPageError('');
    try {
      await deleteCustomer(deleteId);
      await reload(); setDeleteId(null);
      push(`Customer #${deleteId} deleted`, 'success');
    } catch (e) { setPageError(e.message); }
    finally { setBusy(false); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Customers</Typography>
        <Button variant="contained" onClick={openCreate}>Add customer</Button>
      </Stack>
      {loading && <Loading label="Fetching customers..." />}
      <ErrorBox message={error || pageError} />
      {!loading && !error && customers.length === 0 && <Empty text="No customers yet. Add one." />}
      {!loading && customers.length > 0 && (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell><TableCell>Name</TableCell>
                <TableCell>Email</TableCell><TableCell>Phone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>#{c.id}</TableCell><TableCell>{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell><TableCell>{c.phone || '—'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openEdit(c)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => { setDeleteId(c.id); setPageError(''); }}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? `Edit customer #${editing.id}` : 'Add customer'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={form.name} onChange={set('name')} fullWidth />
            <TextField label="Email" value={form.email} onChange={set('email')} fullWidth />
            <TextField label="Phone (optional)" value={form.phone} onChange={set('phone')} fullWidth />
            {formError && <ErrorBox message={formError} />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete customer #{deleteId}?</DialogTitle>
        <DialogContent>Blocked with a clear message if this customer has orders.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Keep</Button>
          <Button variant="contained" color="error" disabled={busy} onClick={doDelete}>{busy ? 'Deleting...' : 'Yes, delete'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
