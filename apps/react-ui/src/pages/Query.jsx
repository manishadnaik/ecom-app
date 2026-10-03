import { useState } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { runQuery } from '../api.js';
import { ErrorBox, Loading } from '../components.jsx';

// S6 playground. 429 is expected (10/15min) - explain it, don't look broken.
const EXAMPLES = [
  'Find all products that are out of stock',
  'Which products are in the Electronics category?',
  'Top 3 categories by revenue',
];

export default function QueryPage() {
  const [q, setQ] = useState(EXAMPLES[0]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!q.trim() || busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await runQuery(q.trim());
      setResult(res);
    } catch (e) {
      setError(
        e.status === 429
          ? 'Rate limited (10 queries per 15 min). Wait a bit and retry - this guard saves LLM cost.'
          : e.message
      );
    } finally {
      setBusy(false);
    }
  };

  const rows = result?.results || [];
  const cols = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Query console
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        {EXAMPLES.map((ex) => (
          <Button key={ex} size="small" variant="outlined" onClick={() => setQ(ex)}>
            {ex.slice(0, 32)}...
          </Button>
        ))}
      </Box>

      <TextField
        fullWidth
        multiline
        rows={2}
        label="Ask in plain English"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        sx={{ mb: 1 }}
      />
      <Button variant="contained" onClick={run} disabled={busy || !q.trim()}>
        {busy ? 'Asking...' : 'Run'}
      </Button>

      {busy && <Loading label="Generating SQL..." />}
      <ErrorBox message={error} />

      {result && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle2">Generated SQL ({result.rowCount ?? rows.length} rows)</Typography>
          <Box
            component="pre"
            sx={{ bgcolor: '#f1f3f4', p: 1, borderRadius: 1, overflowX: 'auto', fontSize: 12 }}
          >
            {result.generatedSQL}
          </Box>
          {rows.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  {cols.map((c) => (
                    <TableCell key={c}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    {cols.map((c) => (
                      <TableCell key={c}>{String(r[c])}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2">No rows.</Typography>
          )}
        </Paper>
      )}
    </div>
  );
}
