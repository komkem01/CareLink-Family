import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';

const router = Router();

// GET /api/family/caregivers - ดึงรายชื่อผู้ดูแลทั้งหมด
router.get('/', async (req: Request, res: Response) => {
  try {
    const { familyUserId } = req.query;

    const caregivers = await prisma.caregiver.findMany({
      where: familyUserId ? {
        elder: {
          familyUserId: String(familyUserId)
        }
      } : undefined,
      include: {
        elder: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.json(caregivers);
  } catch (error: any) {
    console.error('Get caregivers error:', error);
    res.status(500).json({ error: 'Failed to fetch caregivers', message: error.message });
  }
});

// POST /api/family/caregivers - เพิ่มผู้ดูแลใหม่
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      idCard,
      address,
      emergencyContact,
      emergencyName,
      experience,
      certificate,
      salary,
      workSchedule,
      elderId
    } = req.body;

    // Generate pairing code (6 ตัว)
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const caregiver = await prisma.caregiver.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        idCard,
        address,
        emergencyContact,
        emergencyName,
        experience,
        certificate,
        salary,
        workSchedule,
        pairingCode,
        elderId
      }
    });

    res.status(201).json(caregiver);
  } catch (error: any) {
    console.error('Create caregiver error:', error);
    res.status(500).json({ error: 'Failed to create caregiver', message: error.message });
  }
});

// PATCH /api/family/caregivers/:id - แก้ไขข้อมูลผู้ดูแล
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const caregiver = await prisma.caregiver.update({
      where: { id },
      data: updateData
    });

    res.json(caregiver);
  } catch (error: any) {
    console.error('Update caregiver error:', error);
    res.status(500).json({ error: 'Failed to update caregiver', message: error.message });
  }
});

// DELETE /api/family/caregivers/:id - ลบผู้ดูแล
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.caregiver.delete({
      where: { id }
    });

    res.json({ message: 'Caregiver deleted successfully' });
  } catch (error: any) {
    console.error('Delete caregiver error:', error);
    res.status(500).json({ error: 'Failed to delete caregiver', message: error.message });
  }
});

// POST /api/family/caregivers/:id/verify - ยืนยันตัวตนผู้ดูแล
router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const caregiver = await prisma.caregiver.update({
      where: { id },
      data: { verified: true }
    });

    res.json({ message: 'Caregiver verified successfully', caregiver });
  } catch (error: any) {
    console.error('Verify caregiver error:', error);
    res.status(500).json({ error: 'Failed to verify caregiver', message: error.message });
  }
});

export default router;
