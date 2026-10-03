import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import { createProduct, deleteProduct, fetchCategories, fetchProducts, updateProduct } from '../api.js';
import { useApi } from '../hooks.js';
import { Empty, ErrorBox, Loading } from '../components.jsx';
import { useToast } from '../store.jsx';

const emptyForm = { name: '', description: '', category_id: '', price: '', stock_quantity: '', status: 'ACTIVE' };

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const { push } = useToast();

  const fetcher = () => fetchProducts(category ? { category } : {});
  const { data, loading, error, setData } = useApi(fetcher, [category]);
  const items = useMemo(() => data?.data || [], [data]);

  // real category list with counts - single extra call, cached 60s server-side.
  // filter uses name (backend ?category= is by name), dialog uses id.
  const { data: catData } = useApi(fetchCategories, []);
  const categories = useMemo(() => catData?.data || [], [catData]);
  const label = (c) => `${c.name} (${c.productCount ?? 0})`;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [pageError, setPageError] = useState('');
  const [expanded, setExpanded] = useState(null); // S2 inline detail

  const reload = async () => setData(await fetcher());
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(''); setFormOpen(true); };
  const openEdit = (p) => {
    setEditing(p); setPageError('');
    setForm({
      name: p.name || '', description: p.description || '',
      category_id: String(p.category_id ?? p.Category?.id ?? ''),
      price: String(p.price ?? ''), stock_quantity: String(p.stock_quantity ?? ''),
      status: p.status || 'ACTIVE',
    });
    setFormError(''); setFormOpen(true);
  };
  const save = async () => {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.category_id) { setFormError('Category is required.'); return; }
    if (form.price === '' || Number(form.price) < 0) { setFormError('Price must be 0 or more.'); return; }
    if (form.stock_quantity === '' || Number(form.stock_quantity) < 0) { setFormError('Stock must be 0 or more.'); return; }
    setBusy(true); setFormError('');
    const payload = {
      name: form.name.trim(), description: form.description.trim() || null,
      category_id: Number(form.category_id), price: Number(form.price),
      stock_quantity: Number(form.stock_quantity), status: form.status,
    };
    try {
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
      push(editing ? `Product #${editing.id} updated` : 'Product created', 'success');
      await reload(); setFormOpen(false);
    } catch (e) { setFormError(e.message); }
    finally { setBusy(false); }
  };
  const doDelete = async () => {
    setBusy(true); setPageError('');
    try {
      await deleteProduct(deleteId);
      await reload(); setDeleteId(null);
      push(`Product #${deleteId} deleted`, 'success');
    } catch (e) { setPageError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Products</Typography>
        <Button variant="contained" onClick={openCreate}>Add product</Button>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField size="small" label="Category" value={category || ''} select
          sx={{ minWidth: 220 }} onChange={(e) => setParams(e.target.value ? { category: e.target.value } : {})}>
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.name}>{label(c)}</MenuItem>
          ))}
        </TextField>
        {category && <Button onClick={() => setParams({})}>Clear</Button>}
      </Stack>
      {loading && <Loading label="Fetching products..." />}
      <ErrorBox message={error || pageError} />
      {!loading && !error && items.length === 0 && <Empty text="No products for this filter." />}
      <Grid container spacing={2}>
        {items.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">{p.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  #{p.id} · {p.Category?.name || '—'}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>${p.price}</Typography>
                {expanded === p.id && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {p.description || 'No description.'} · Stock: {p.stock_quantity} · Status: {p.status}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ gap: 1, flexWrap: 'wrap' }}>
                <Chip size="small"
                  label={p.stock_quantity > 0 ? `In stock (${p.stock_quantity})` : 'Out of stock'}
                  color={p.stock_quantity > 0 ? 'success' : 'default'} />
                <Button size="small" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  {expanded === p.id ? 'Hide' : 'Details'}
                </Button>
                <Button size="small" onClick={() => openEdit(p)}>Edit</Button>
                <Button size="small" color="error" onClick={() => { setDeleteId(p.id); setPageError(''); }}>Delete</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? `Edit product #${editing.id}` : 'Add product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={form.name} onChange={set('name')} fullWidth />
            <TextField label="Description" value={form.description} onChange={set('description')} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <TextField label="Category" value={form.category_id} onChange={set('category_id')} select fullWidth>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{label(c)}</MenuItem>
                ))}
              </TextField>
              <TextField label="Status" value={form.status} onChange={set('status')} select fullWidth>
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Price" type="number" value={form.price} onChange={set('price')} fullWidth />
              <TextField label="Stock" type="number" value={form.stock_quantity} onChange={set('stock_quantity')} fullWidth />
            </Stack>
            {formError && <ErrorBox message={formError} />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete product #{deleteId}?</DialogTitle>
        <DialogContent>Blocked with 409 if this product is in any order.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Keep</Button>
          <Button variant="contained" color="error" disabled={busy} onClick={doDelete}>{busy ? 'Deleting...' : 'Yes, delete'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
