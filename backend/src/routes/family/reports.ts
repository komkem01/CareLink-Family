import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireFamily } from '../../middleware/auth';

const router = Router();

// GET /api/family/reports - ดึงรายงานทั้งหมด
router.get('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { elderId, caregiverId, status } = req.query;
    const where: any = {};
    // Filter by elderId, caregiverId, status if provided
    if (elderId) where.elderId = String(elderId);
    if (caregiverId) where.caregiverId = String(caregiverId);
    if (status) where.status = String(status);
    // Always filter by user's elders (familyUserId)
    // If elderId not provided, filter by user's elders
    if (!elderId) {
      where.elder = { familyUserId: userId };
    }
    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
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
      }
    });
    res.json(reports);
  } catch (error: any) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports', message: error.message });
  }
});

// GET /api/family/reports/:id - ดูรายละเอียดรายงาน
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await prisma.dailyReport.findUnique({
      where: { id },
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

    // Mark as read if not already
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
