import { Router, type Request, type Response, type NextFunction } from 'express';
import { env } from '../../config/env.js';
import { validateAdminCredentials, verifyAdminToken, getDashboardStats } from './admin.service.js';

const adminController = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = auth.slice(7);
  if (!verifyAdminToken(token)) {
    res.status(403).json({ error: 'Invalid or expired admin token' });
    return;
  }

  next();
}

adminController.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username: string; password: string };

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const token = validateAdminCredentials(username, password);
    if (!token) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.json({ token, sfAdminToken: env.SHADOWFEED_ADMIN_TOKEN });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
});

adminController.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();
    return res.json(stats);
  } catch (error: any) {
    console.error('[ADMIN] Error fetching stats:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch stats' });
  }
});

export default adminController;
