import { Router, Request, Response } from 'express';
import multer from 'multer';
import { tideIndicatorRepository } from '../repositories/tide-indicator-repository';
import { validateTideIndicator } from '@pilot-tide-planner/validation';
import { parseTideIndicators } from '@pilot-tide-planner/excel-parser';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;
    const data = date ? await tideIndicatorRepository.findByDate(date) : await tideIndicatorRepository.findAll();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const errors = validateTideIndicator(req.body);
    if (errors.length > 0) {
      return res.status(422).json({ success: false, message: errors[0].message, code: 'VALIDATION_ERROR' });
    }
    const data = await tideIndicatorRepository.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = await tideIndicatorRepository.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await tideIndicatorRepository.delete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded', code: 'MISSING_FILE' });
    }
    const parsed = parseTideIndicators(req.file.buffer);
    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return res.status(422).json({ success: false, message: 'Failed to parse file', code: 'PARSE_ERROR', errors: parsed.errors });
    }
    if (parsed.data.length > 0) {
      const dates = [...new Set(parsed.data.map((d) => {
        const dt = new Date(d.occurredAt);
        return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
      }))];
      for (const date of dates) {
        await tideIndicatorRepository.deleteByDate(date);
      }
      await tideIndicatorRepository.createMany(parsed.data as any);
    }
    res.json({ success: true, inserted: parsed.data.length, failed: parsed.errors.length, errors: parsed.errors });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

export { router as tideIndicatorRoutes };
