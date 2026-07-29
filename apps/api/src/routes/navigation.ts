import { Router, Request, Response } from 'express';
import { navigationService } from '../services/navigation-service';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { date, profileId } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required', code: 'MISSING_DATE' });
    }
    const data = await navigationService.generate(date, profileId);
    res.json({ success: true, data });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message, code: err.code || 'SERVER_ERROR' });
  }
});

router.get('/today', async (_req: Request, res: Response) => {
  try {
    const data = await navigationService.getToday();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const data = await navigationService.getByDate(req.params.date);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Navigation window not found', code: 'NOT_FOUND' });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const { page, limit, from, to } = req.query;
    const data = await navigationService.getHistory({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      from: from as string,
      to: to as string,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

export { router as navigationRoutes };
