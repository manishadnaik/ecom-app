import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useToast } from './store.jsx';

const linkStyle = ({ isActive }) => ({
  color: '#fff',
  textDecoration: 'none',
  opacity: isActive ? 1 : 0.75,
  fontWeight: isActive ? 700 : 400,
});

// shell with top bar + outlet. navlink keeps active state for free.
export default function Layout() {
  const { toasts } = useToast();
  const [open, setOpen] = useState(true);
  const latest = toasts[toasts.length - 1];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2 }}>
          <StorefrontIcon />
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 3 }}>
            Ecom Admin
          </Typography>
          <Button component={NavLink} to="/" end style={linkStyle}>
            Products
          </Button>
          <Button component={NavLink} to="/orders" style={linkStyle}>
            Orders
          </Button>
          <Button component={NavLink} to="/customers" style={linkStyle}>
            Customers
          </Button>
          <Button component={NavLink} to="/query" style={linkStyle}>
            Query console
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>

      <Snackbar
        open={!!latest && open}
        autoHideDuration={3500}
        onClose={() => setOpen(false)}
        key={latest?.id || 'none'}
      >
        <MuiAlert severity={latest?.severity || 'info'} sx={{ width: '100%' }}>
          {latest?.message || ''}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
