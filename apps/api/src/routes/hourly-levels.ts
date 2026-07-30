import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { hourlyLevelRepository } from '../repositories/hourly-level-repository';
import { validateHourlyTideLevel } from '@pilot-tide-planner/validation';
import { parseHourlyLevels } from '@pilot-tide-planner/excel-parser';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;
    const data = date ? await hourlyLevelRepository.findByDate(date) : [];
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const errors = validateHourlyTideLevel(req.body);
    if (errors.length > 0) {
      return res.status(422).json({ success: false, message: errors[0].message, code: 'VALIDATION_ERROR' });
    }
    const data = await hourlyLevelRepository.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = await hourlyLevelRepository.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await hourlyLevelRepository.delete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.get('/export', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string | undefined;
    const data = date ? await hourlyLevelRepository.findByDate(date) : [];

    const rows = data.map((r) => ({
      Date: r.recordedAt.toISOString().split('T')[0],
      Time: `${String(r.recordedAt.getUTCHours()).padStart(2, '0')}:00`,
      'Level (ft)': Number(r.waterLevelFt),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Hourly Levels');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=hourly-levels${date ? '-' + date : ''}.xlsx`);
    res.send(buf);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded', code: 'MISSING_FILE' });
    }
    const parsed = parseHourlyLevels(req.file.buffer);
    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return res.status(422).json({ success: false, message: 'Failed to parse file', code: 'PARSE_ERROR', errors: parsed.errors });
    }
    if (parsed.data.length > 0) {
      const dates = [...new Set(parsed.data.map((d) => {
        const dt = new Date(d.recordedAt);
        return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
      }))];
      for (const date of dates) {
        await hourlyLevelRepository.deleteByDate(date);
      }
      await hourlyLevelRepository.createMany(parsed.data as any);
    }
    res.json({ success: true, inserted: parsed.data.length, failed: parsed.errors.length, errors: parsed.errors });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

export { router as hourlyLevelRoutes };
