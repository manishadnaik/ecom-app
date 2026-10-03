import { Router } from 'express';

const router = Router();

// Read-only. Uses Node Process API for observability.
// K8s livenessProbe hits this. Never put secrets here.
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    pid: process.pid,
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
  });
});

export default router;
