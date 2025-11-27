import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// POST /api/caregiver/health/blood-pressure - บันทึกความดันโลหิต
router.post('/blood-pressure', async (req: Request, res: Response) => {
  try {
    const { elderId, caregiverId, systolic, diastolic, heartRate, notes } = req.body;

    const record = await prisma.healthRecord.create({
      data: {
        type: 'vital-sign',
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        heartRate: heartRate ? parseInt(heartRate) : undefined,
        notes,
        elderId,
        caregiverId
      }
    });

    res.status(201).json(record);
  } catch (error: any) {
    console.error('Record blood pressure error:', error);
    res.status(500).json({ error: 'Failed to record blood pressure', message: error.message });
  }
});

// POST /api/caregiver/health/observation - บันทึกการสังเกตอาการ
router.post('/observation', async (req: Request, res: Response) => {
  try {
    const { elderId, caregiverId, observation, notes } = req.body;

    const record = await prisma.healthRecord.create({
      data: {
        type: 'observation',
        observation,
        notes,
        elderId,
        caregiverId
      }
    });

    res.status(201).json(record);
  } catch (error: any) {
    console.error('Record observation error:', error);
    res.status(500).json({ error: 'Failed to record observation', message: error.message });
  }
});

// GET /api/caregiver/health/history - ดูประวัติที่บันทึก
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { caregiverId, elderId } = req.query;

    const where: any = {};
    if (caregiverId) where.caregiverId = String(caregiverId);
    if (elderId) where.elderId = String(elderId);

    const records = await prisma.healthRecord.findMany({
      where,
      orderBy: {
        recordedAt: 'desc'
      },
      take: 50
    });

    res.json(records);
  } catch (error: any) {
    console.error('Get health history error:', error);
    res.status(500).json({ error: 'Failed to fetch health history', message: error.message });
  }
});

export default router;
