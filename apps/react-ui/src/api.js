// Small wrapper around fetch. vite proxies /api -> node-api in dev,
// so no CORS headache locally. In prod nginx does the same.
export async function api(path, options = {}) {
  const res = await fetch(`/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // api returns json mostly, but guard for empty 204 (delete)
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    // backend shapes differ a bit (error/message/errors) - normalise here
    const msg =
      data?.message || data?.error || data?.errors?.[0]?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const fetchProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api(`/products${qs ? `?${qs}` : ''}`);
};

export const fetchCategories = () => api('/categories');

export const fetchOrders = () => api('/orders');

export const fetchCustomers = () => api('/customers');

export const createCustomer = (payload) =>
  api('/customers', { method: 'POST', body: JSON.stringify(payload) });

export const updateCustomer = (id, payload) =>
  api(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteCustomer = (id) => api(`/customers/${id}`, { method: 'DELETE' });


export const createProduct = (payload) =>
  api('/products', { method: 'POST', body: JSON.stringify(payload) });

export const updateProduct = (id, payload) =>
  api(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteProduct = (id) => api(`/products/${id}`, { method: 'DELETE' });

export const cancelOrder = (id) => api(`/orders/${id}`, { method: 'DELETE' });

export const runQuery = (query) =>
  api('/query', { method: 'POST', body: JSON.stringify({ query }) });

