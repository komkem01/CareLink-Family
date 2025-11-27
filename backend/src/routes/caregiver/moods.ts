import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// POST /api/caregiver/moods - บันทึกอารมณ์
router.post('/', async (req: Request, res: Response) => {
  try {
    const { elderId, caregiverId, mood, timeOfDay, note } = req.body;

    const moodRecord = await prisma.mood.create({
      data: {
        mood,
        timeOfDay,
        note,
        elderId,
        caregiverId
      }
    });

    res.status(201).json(moodRecord);
  } catch (error: any) {
    console.error('Record mood error:', error);
    res.status(500).json({ error: 'Failed to record mood', message: error.message });
  }
});

// GET /api/caregiver/moods - ดูบันทึกอารมณ์
router.get('/', async (req: Request, res: Response) => {
  try {
    const { caregiverId, elderId } = req.query;

    const where: any = {};
    if (caregiverId) where.caregiverId = String(caregiverId);
    if (elderId) where.elderId = String(elderId);

    const moods = await prisma.mood.findMany({
      where,
      orderBy: {
        recordedAt: 'desc'
      },
      take: 50
    });

    res.json(moods);
  } catch (error: any) {
    console.error('Get moods error:', error);
    res.status(500).json({ error: 'Failed to fetch moods', message: error.message });
  }
});

export default router;
