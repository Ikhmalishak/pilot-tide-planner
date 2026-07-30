import { Router, Request, Response } from 'express';
import multer from 'multer';
import { bulkService } from '../services/bulk-service';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/import', upload.fields([
  { name: 'tideIndicators', maxCount: 1 },
  { name: 'hourlyLevels', maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const tideFile = files?.['tideIndicators']?.[0];
    const hourlyFile = files?.['hourlyLevels']?.[0];

    if (!tideFile || !hourlyFile) {
      return res.status(400).json({
        success: false,
        message: 'Both tideIndicators and hourlyLevels files are required',
        code: 'MISSING_FILES',
      });
    }

    const now = new Date();
    const year = parseInt(req.body.year as string, 10) || now.getFullYear();
    const month = parseInt(req.body.month as string, 10) || now.getMonth() + 1;
    const profileId = req.body.profileId as string | undefined;

    const result = await bulkService.import({
      tideFile: tideFile.buffer,
      hourlyFile: hourlyFile.buffer,
      year,
      month,
      profileId,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
});

export { router as bulkRoutes };
