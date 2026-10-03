import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import Layout from './Layout.jsx';
import ProductsPage from './pages/Products.jsx';
import OrdersPage from './pages/Orders.jsx';
import CustomersPage from './pages/Customers.jsx';
import QueryPage from './pages/Query.jsx';
import { ToastProvider } from './store.jsx';
import theme from './theme.js';

// router sits outside layout so pages get outlet.
// toast provider wraps all - header snackbar + pages share it (context, not redux).
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<ProductsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/query" element={<QueryPage />} />
              <Route path="*" element={<ProductsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
