import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// POST /api/caregiver/notifications/sos - ส่งแจ้งเตือนฉุกเฉิน
router.post('/sos', async (req: Request, res: Response) => {
  try {
    const { elderId, caregiverId, reason, location } = req.body;

    if (!elderId || !caregiverId || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'กรุณาระบุ elderId, caregiverId, และเหตุผล' 
      });
    }

    // Get elder info to find family user
    const elder = await prisma.elder.findUnique({
      where: { id: elderId },
      include: {
        familyUser: true,
        caregivers: {
          where: { id: caregiverId }
        }
      }
    });

    if (!elder) {
      return res.status(404).json({ 
        error: 'Elder not found',
        message: 'ไม่พบข้อมูลผู้สูงอายุ'
      });
    }

    const caregiver = elder.caregivers[0];
    if (!caregiver) {
      return res.status(404).json({ 
        error: 'Caregiver not found',
        message: 'ไม่พบข้อมูลผู้ดูแล'
      });
    }

    // Create notification for family
    const notification = await prisma.notification.create({
      data: {
        userId: elder.familyUserId,
        title: '🆘 แจ้งเหตุฉุกเฉิน!',
        message: `ผู้ดูแล ${caregiver.name} แจ้งเหตุฉุกเฉิน: ${reason}\n${elder.relation}${elder.name}\n${location ? `สถานที่: ${location}` : ''}`,
        type: 'urgent',
        category: 'health',
        priority: 'urgent',
        isRead: false,
        relatedId: elderId,
        relatedType: 'elder'
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        elderId,
        title: '🆘 แจ้งเหตุฉุกเฉิน',
        description: `ผู้ดูแล ${caregiver.name} แจ้ง: ${reason}\nสถานที่: ${location || 'ไม่ระบุ'}`,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(),
        category: 'emergency',
        priority: 'high',
        completed: true,
        completedAt: new Date(),
      }
    });

    res.json({
      success: true,
      message: 'ส่งแจ้งเตือนถึงครอบครัวเรียบร้อยแล้ว',
      notification
    });

  } catch (error: any) {
    console.error('SOS notification error:', error);
    res.status(500).json({ 
      error: 'Failed to send SOS notification', 
      message: error.message 
    });
  }
});

// POST /api/caregiver/notifications/general - ส่งแจ้งเตือนทั่วไป
router.post('/general', async (req: Request, res: Response) => {
  try {
    const { elderId, caregiverId, title, message, type = 'info' } = req.body;

    if (!elderId || !caregiverId || !title || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'กรุณาระบุข้อมูลให้ครบถ้วน' 
      });
    }

    // Get elder info
    const elder = await prisma.elder.findUnique({
      where: { id: elderId },
      include: {
        caregivers: {
          where: { id: caregiverId }
        }
      }
    });

    if (!elder) {
      return res.status(404).json({ 
        error: 'Elder not found',
        message: 'ไม่พบข้อมูลผู้สูงอายุ'
      });
    }

    const caregiver = elder.caregivers[0];
    if (!caregiver) {
      return res.status(404).json({ 
        error: 'Caregiver not found',
        message: 'ไม่พบข้อมูลผู้ดูแล'
      });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: elder.familyUserId,
        title,
        message: `${caregiver.name}: ${message}`,
        type,
        category: 'general',
        isRead: false,
        relatedId: elderId,
        relatedType: 'elder'
      }
    });

    res.json({
      success: true,
      message: 'ส่งแจ้งเตือนเรียบร้อยแล้ว',
      notification
    });

  } catch (error: any) {
    console.error('Send notification error:', error);
    res.status(500).json({ 
      error: 'Failed to send notification', 
      message: error.message 
    });
  }
});

export default router;
