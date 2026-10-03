import { createTheme } from '@mui/material/styles';

// kept simple on purpose - one primary colour, default spacing.
// tweak here if designer gives palette later.
const theme = createTheme({
  palette: {
    primary: { main: '#1a73e8' },
    background: { default: '#f6f8fb' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: { defaultProps: { variant: 'outlined' } },
  },
});

export default theme;
