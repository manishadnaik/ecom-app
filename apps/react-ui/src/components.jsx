import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// shared empty/loading/error bits - every page uses same look
export function Loading({ label = 'Loading...' }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 4 }}>
      <CircularProgress size={22} />
      <span>{label}</span>
    </Box>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="error" action={onRetry ? undefined : undefined}>
        {message}
      </Alert>
    </Box>
  );
}

export function Empty({ text = 'Nothing here yet.' }) {
  return (
    <Box sx={{ py: 4, color: 'text.secondary' }}>
      <Alert severity="info">{text}</Alert>
    </Box>
  );
}
