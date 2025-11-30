import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireCaregiver } from '../../middleware/auth';

const router = Router();

// GET /api/caregiver/reports - ดึงรายงานทั้งหมดของผู้ดูแล
router.get('/', authenticateToken, requireCaregiver, async (req: Request, res: Response) => {
  try {
    const caregiverId = req.userId as string;
    const { elderId } = req.query;

    const where: any = { caregiverId };
    if (elderId) where.elderId = String(elderId);

    const reports = await prisma.dailyReport.findMany({
      where,
      include: {
        elder: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 50
    });

    res.json(reports);
  } catch (error: any) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports', message: error.message });
  }
});

// POST /api/caregiver/reports - สร้างรายงานใหม่
router.post('/', authenticateToken, requireCaregiver, async (req: Request, res: Response) => {
  try {
    const caregiverId = req.userId as string;
    const {
      elderId,
      title,
      summary,
      tasksCompleted,
      tasksTotal,
      healthStatus,
      healthNotes,
      overallMood,
      expenseTotal,
      incidents,
      highlights,
      concerns,
      photoUrls
    } = req.body;

    const report = await prisma.dailyReport.create({
      data: {
        caregiverId,
        elderId,
        title,
        summary,
        tasksCompleted: tasksCompleted || 0,
        tasksTotal: tasksTotal || 0,
        healthStatus: healthStatus || 'normal',
        healthNotes,
        overallMood,
        expenseTotal: expenseTotal || 0,
        incidents: incidents || [],
        highlights: highlights || [],
        concerns: concerns || [],
        photoUrls: photoUrls || [],
        status: 'sent',
        sentAt: new Date()
      },
      include: {
        elder: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report', message: error.message });
  }
});

// PATCH /api/caregiver/reports/:id - แก้ไขรายงาน
router.patch('/:id', authenticateToken, requireCaregiver, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caregiverId = req.userId as string;
    const updateData = req.body;

    // ตรวจสอบว่าเป็นรายงานของผู้ดูแลคนนี้
    const existing = await prisma.dailyReport.findFirst({
      where: { id, caregiverId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    const report = await prisma.dailyReport.update({
      where: { id },
      data: updateData,
      include: {
        elder: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.json(report);
  } catch (error: any) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report', message: error.message });
  }
});

// DELETE /api/caregiver/reports/:id - ลบรายงาน
router.delete('/:id', authenticateToken, requireCaregiver, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caregiverId = req.userId as string;

    // ตรวจสอบว่าเป็นรายงานของผู้ดูแลคนนี้
    const existing = await prisma.dailyReport.findFirst({
      where: { id, caregiverId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    await prisma.dailyReport.delete({
      where: { id }
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report', message: error.message });
  }
});

export default router;
