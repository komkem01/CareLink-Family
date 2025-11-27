import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/health/records - ดึงประวัติสุขภาพ (Read-only สำหรับ Family)
router.get('/records', async (req: Request, res: Response) => {
  try {
    const { elderId, type, limit } = req.query;

    const where: any = {};
    if (elderId) where.elderId = String(elderId);
    if (type) where.type = String(type);

    const records = await prisma.healthRecord.findMany({
      where,
      orderBy: {
        recordedAt: 'desc'
      },
      take: limit ? parseInt(String(limit)) : 50,
      include: {
        caregiver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(records);
  } catch (error: any) {
    console.error('Get health records error:', error);
    res.status(500).json({ error: 'Failed to fetch health records', message: error.message });
  }
});

// GET /api/health/latest - ดึงข้อมูลล่าสุด
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const { elderId } = req.query;

    const latest = await prisma.healthRecord.findFirst({
      where: elderId ? { elderId: String(elderId) } : undefined,
      orderBy: {
        recordedAt: 'desc'
      },
      include: {
        caregiver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(latest);
  } catch (error: any) {
    console.error('Get latest health record error:', error);
    res.status(500).json({ error: 'Failed to fetch latest record', message: error.message });
  }
});

export default router;
