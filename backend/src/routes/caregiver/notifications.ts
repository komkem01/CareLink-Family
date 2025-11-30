import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateCaregiver } from '../../middleware/auth';

const router = Router();

// GET /api/caregiver/notifications - ดึงการแจ้งเตือนของผู้ดูแล
router.get('/', authenticateCaregiver, async (req: Request, res: Response) => {
  try {
    const caregiverId = req.user?.caregiverId || req.userId;

    if (!caregiverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ดึง elder ที่ผู้ดูแลดูแลอยู่
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId },
      select: { elderId: true, elder: { select: { familyUserId: true } } }
    });

    if (!caregiver || !caregiver.elder) {
      return res.json([]); // ยังไม่ได้จับคู่กับผู้สูงอายุ
    }

    // ดึงการแจ้งเตือนที่เกี่ยวข้องกับผู้สูงอายุที่ดูแล
    // (สามารถปรับแก้ตาม logic ที่ต้องการ - ปัจจุบันดึงจาก family notifications ที่เกี่ยวข้อง)
    const notifications = await prisma.notification.findMany({
      where: {
        userId: caregiver.elder.familyUserId,
        OR: [
          { relatedId: caregiver.elderId },
          { category: { in: ['health', 'task', 'appointment'] } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(notifications);

  } catch (error: any) {
    console.error('Get caregiver notifications error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      message: error.message 
    });
  }
});

// PATCH /api/caregiver/notifications/:id/read - อ่านการแจ้งเตือน
router.patch('/:id/read', authenticateCaregiver, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caregiverId = req.user?.caregiverId || req.userId;

    if (!caregiverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // อัปเดตสถานะเป็นอ่านแล้ว
    const notification = await prisma.notification.update({
      where: { id },
      data: { 
        isRead: true,
        readAt: new Date()
      }
    });

    res.json(notification);

  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ 
      error: 'Failed to mark notification as read',
      message: error.message 
    });
  }
});

export default router;
