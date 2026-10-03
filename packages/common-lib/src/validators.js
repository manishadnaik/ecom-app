// Tiny shared validators in plain JS (no zod here so UI stays light).
// Heavy zod validation stays in node-api/src/validators. UI uses these for quick checks.
export const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
export const isEmail = (v) => typeof v === 'string' && /.+@.+\..+/.test(v);
