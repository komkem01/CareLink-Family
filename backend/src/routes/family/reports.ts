import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireFamily } from '../../middleware/auth';
import { generateWeeklyReportData, generateWeeklyReportHTML, generateWeeklyReportPDF } from '../../services/reportGenerationService';
import path from 'path';
import fs from 'fs';

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

/**
 * GET /api/family/reports/weekly/:elderId
 * สร้างรายงานสรุปประจำสัปดาห์
 */
router.get('/weekly/:elderId', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { elderId } = req.params;
    const { format = 'json', date } = req.query;

    // ตรวจสอบว่า elder เป็นของ family user นี้
    const elder = await prisma.elder.findFirst({
      where: {
        id: elderId,
        familyUserId: req.userId
      }
    });

    if (!elder) {
      return res.status(404).json({ error: 'Elder not found or access denied' });
    }

    // สร้างรายงาน
    const weekStart = date ? new Date(date as string) : undefined;
    const reportData = await generateWeeklyReportData(elderId, weekStart);

    // Return ตามรูปแบบที่ต้องการ
    if (format === 'html') {
      const html = generateWeeklyReportHTML(reportData);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } else if (format === 'pdf') {
      const reportsDir = path.join(__dirname, '../../temp/reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `report-${elderId}-${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);

      await generateWeeklyReportPDF(reportData, filepath);

      // ส่งไฟล์ PDF
      res.download(filepath, `weekly-report-${elder.name}.pdf`, (err) => {
        // ลบไฟล์หลังส่งเสร็จ
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      });
    } else {
      // Default: JSON
      res.json(reportData);
    }
  } catch (error: any) {
    console.error('Generate weekly report error:', error);
    res.status(500).json({ error: 'Failed to generate report', message: error.message });
  }
});

/**
 * GET /api/family/reports/summary/:elderId
 * สรุปข้อมูลสำคัญแบบรวดเร็ว (สำหรับ dashboard)
 */
router.get('/summary/:elderId', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { elderId } = req.params;
    const { days = '7' } = req.query;

    const elder = await prisma.elder.findFirst({
      where: {
        id: elderId,
        familyUserId: req.userId
      }
    });

    if (!elder) {
      return res.status(404).json({ error: 'Elder not found or access denied' });
    }

    const daysCount = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    // สร้างรายงานเฉพาะสถิติสำคัญ
    const reportData = await generateWeeklyReportData(elderId, startDate);

    // Return เฉพาะส่วนสำคัญ
    res.json({
      period: reportData.period,
      summary: {
        activityCompletion: reportData.activities.completionRate,
        medicationCompliance: reportData.medications.compliance,
        healthAlerts: reportData.health.alertCount,
        moodScore: reportData.moods.averageScore,
        moodTrend: reportData.moods.trend
      },
      highlights: reportData.highlights,
      concerns: reportData.concerns
    });
  } catch (error: any) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to get summary', message: error.message });
  }
});

export default router;
