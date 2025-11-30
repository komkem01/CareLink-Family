import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateCaregiver } from '../../middleware/auth';

const router = Router();

// POST /api/caregiver/sos - แจ้งเหตุฉุกเฉิน
router.post('/', authenticateCaregiver, async (req: Request, res: Response) => {
  try {
    const caregiverId = req.user?.caregiverId || req.userId;
    const { elderId, reason, timestamp } = req.body;

    if (!caregiverId || !elderId || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'กรุณาระบุข้อมูลให้ครบถ้วน' 
      });
    }

    // ดึงข้อมูล caregiver และ elder
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId },
      include: {
        elder: {
          include: {
            familyUser: true
          }
        }
      }
    });

    if (!caregiver) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }

    if (!caregiver.elder) {
      return res.status(404).json({ error: 'Elder not found' });
    }

    // สร้างการแจ้งเตือนให้ครอบครัว
    const notification = await prisma.notification.create({
      data: {
        title: '🚨 แจ้งเหตุฉุกเฉิน (SOS)',
        message: `${caregiver.name} แจ้งเหตุฉุกเฉิน: ${reason}\n\nผู้สูงอายุ: ${caregiver.elder.name}\nเวลา: ${new Date(timestamp || new Date()).toLocaleString('th-TH')}`,
        type: 'urgent',
        category: 'health',
        priority: 'urgent',
        userId: caregiver.elder.familyUserId,
        relatedId: elderId,
        relatedType: 'sos',
        actionText: 'ดูรายละเอียด',
        isRead: false
      }
    });

    // บันทึก SOS log (ถ้ามี health record)
    try {
      await prisma.healthRecord.create({
        data: {
          type: 'incident',
          observation: `SOS: ${reason}`,
          notes: `แจ้งเหตุฉุกเฉิน - ${reason}`,
          severity: 'urgent',
          elderId: elderId,
          caregiverId: caregiverId,
          recordedAt: new Date(timestamp || new Date())
        }
      });
    } catch (err) {
      console.error('Failed to create health record for SOS:', err);
    }

    res.status(201).json({
      success: true,
      message: 'แจ้งเหตุฉุกเฉินสำเร็จ',
      notification: {
        id: notification.id,
        sentTo: caregiver.elder.familyUser.name,
        sentAt: notification.createdAt
      }
    });

  } catch (error: any) {
    console.error('SOS error:', error);
    res.status(500).json({ 
      error: 'Failed to send SOS alert',
      message: error.message 
    });
  }
});

export default router;
