import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/profile - ดึงข้อมูลโปรไฟล์
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.query;

    if (type === 'family') {
      const user = await prisma.familyUser.findUnique({
        where: { id: String(userId) },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true
        }
      });
      return res.json(user);
    } else if (type === 'caregiver') {
      const caregiver = await prisma.caregiver.findUnique({
        where: { id: String(userId) },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          verified: true,
          experience: true,
          workSchedule: true
        }
      });
      return res.json(caregiver);
    }

    res.status(400).json({ error: 'Invalid type parameter' });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

// PATCH /api/profile - แก้ไขโปรไฟล์
router.patch('/', async (req: Request, res: Response) => {
  try {
    const { userId, type, ...updateData } = req.body;

    if (type === 'family') {
      const user = await prisma.familyUser.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true
        }
      });
      return res.json(user);
    } else if (type === 'caregiver') {
      const caregiver = await prisma.caregiver.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true
        }
      });
      return res.json(caregiver);
    }

    res.status(400).json({ error: 'Invalid type parameter' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

export default router;
