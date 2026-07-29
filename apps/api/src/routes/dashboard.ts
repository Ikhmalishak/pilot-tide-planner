import { Router, Request, Response } from 'express';
import { dashboardService } from '../services/dashboard-service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const data = await dashboardService.getDashboard(date);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

export { router as dashboardRoutes };
