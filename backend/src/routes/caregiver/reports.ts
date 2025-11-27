import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// POST /api/caregiver/reports/daily - ส่งสรุปรายงานประจำวัน
router.post('/daily', async (req: Request, res: Response) => {
  try {
    const {
      elderId,
      caregiverId,
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
        title,
        summary,
        tasksCompleted: tasksCompleted || 0,
        tasksTotal: tasksTotal || 0,
        healthStatus: healthStatus || 'normal',
        healthNotes,
        overallMood,
        expenseTotal: expenseTotal ? parseFloat(expenseTotal) : 0,
        incidents: incidents || [],
        highlights: highlights || [],
        concerns: concerns || [],
        photoUrls: photoUrls || [],
        status: 'sent',
        sentAt: new Date(),
        elderId,
        caregiverId
      }
    });

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Send daily report error:', error);
    res.status(500).json({ error: 'Failed to send report', message: error.message });
  }
});

// GET /api/caregiver/reports/sent - ดูรายงานที่ส่งแล้ว
router.get('/sent', async (req: Request, res: Response) => {
  try {
    const { caregiverId } = req.query;

    const reports = await prisma.dailyReport.findMany({
      where: caregiverId ? { caregiverId: String(caregiverId) } : undefined,
      orderBy: {
        date: 'desc'
      },
      include: {
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
    console.error('Get sent reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports', message: error.message });
  }
});

// GET /api/caregiver/reports/:id - ดูรายละเอียดรายงาน
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

    res.json(report);
  } catch (error: any) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report', message: error.message });
  }
});

export default router;
