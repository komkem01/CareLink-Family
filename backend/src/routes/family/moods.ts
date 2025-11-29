import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/family/moods - ดึงข้อมูลจดอาการทั้งหมด
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { elderId, date } = req.query;

    if (!elderId) {
      return res.status(400).json({ error: 'กรุณาระบุ elderId' });
    }

    const where: any = {
      elderId: String(elderId),
    };

    // กรองตามวันที่ถ้ามีส่ง date parameter
    if (date) {
      const startOfDay = new Date(String(date));
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(String(date));
      endOfDay.setHours(23, 59, 59, 999);
      
      where.recordedAt = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const moods = await prisma.mood.findMany({
      where,
      include: {
        caregiver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });

    console.log(`📋 ดึงข้อมูล moods สำหรับ elder ${elderId}${date ? ` วันที่ ${date}` : ''}:`, moods.length, 'รายการ');

    res.json(moods);
  } catch (error) {
    console.error('❌ Error fetching moods:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลจดอาการ' });
  }
});

// GET /api/family/moods/:id - ดึงข้อมูลจดอาการเฉพาะ
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const mood = await prisma.mood.findUnique({
      where: { id },
      include: {
        caregiver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!mood) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลจดอาการ' });
    }

    res.json(mood);
  } catch (error) {
    console.error('❌ Error fetching mood:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลจดอาการ' });
  }
});

export default router;
