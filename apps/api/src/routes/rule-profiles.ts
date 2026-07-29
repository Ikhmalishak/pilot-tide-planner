import { Router, Request, Response } from 'express';
import { ruleProfileRepository } from '../repositories/rule-profile-repository';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await ruleProfileRepository.findAll();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = await ruleProfileRepository.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

export { router as ruleProfileRoutes };
