import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireFamily } from '../../middleware/auth';

const router = Router();

// GET /api/family/reports - ดึงรายงานทั้งหมด
router.get('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { elderId, caregiverId, status } = req.query;
    
    const where: any = {
      elder: { familyUserId: userId }
    };

    if (elderId) where.elderId = String(elderId);
    if (caregiverId) where.caregiverId = String(caregiverId);
    if (status) where.status = String(status);

    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        caregiver: {
          select: {
            id: true,
            name: true
          }
        },
        elder: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 50
    });

    res.json(reports);
  } catch (error: any) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports', message: error.message });
  }
});

// GET /api/family/reports/:id - ดูรายละเอียดรายงาน
router.get('/:id', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId as string;

    const report = await prisma.dailyReport.findFirst({
      where: {
        id,
        elder: { familyUserId: userId }
      },
      include: {
        elder: true,
        caregiver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Mark as read
    if (report.status !== 'read') {
      await prisma.dailyReport.update({
        where: { id },
        data: {
          status: 'read',
          readAt: new Date()
        }
      });
    }

    res.json(report);
  } catch (error: any) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report', message: error.message });
  }
});

export default router;
