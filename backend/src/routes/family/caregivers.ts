import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireFamily } from '../../middleware/auth';

const router = Router();

// GET /api/family/caregivers - ดึงรายชื่อผู้ดูแลทั้งหมด หรือของผู้สูงอายุคนใดคนหนึ่ง
// Query params: ?elderId=xxx (optional)
router.get('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const familyUserId = req.userId as string;
    if (!familyUserId) {
      return res.status(401).json({ error: 'Missing family user id from token' });
    }
    
    const { elderId } = req.query;
    
    // Build where clause
    const whereClause: any = {
      elder: {
        familyUserId: familyUserId
      }
    };
    
    // ถ้ามี elderId ให้กรองเฉพาะผู้ดูแลของคุณยายคนนั้น
    if (elderId && typeof elderId === 'string') {
      whereClause.elderId = elderId;
    }
    
    const caregivers = await prisma.caregiver.findMany({
      where: whereClause,
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
      gender,
      dateOfBirth,
      idCard,
      address,
      subDistrict,
      district,
      province,
      postalCode,
      emergencyContact,
      emergencyName,
      emergencyRelation,
      experience,
      certificate,
      salary,
      salaryType,
      employmentType,
      workSchedule,
      contractStartDate,
      contractEndDate,
      idCardImage,
      certificateImage,
      elderId
    } = req.body;

    // Generate pairing code (6 ตัว)
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const caregiver = await prisma.caregiver.create({
      data: {
        name,
        phone,
        email,
        password: "", // ไม่ใช้ password จริง
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        idCard,
        address,
        subDistrict,
        district,
        province,
        postalCode,
        emergencyContact,
        emergencyName,
        emergencyRelation,
        experience,
        certificate,
        salary: salary ? String(salary) : "0", // แปลงเป็น string เพื่อรักษา precision
        salaryType,
        employmentType,
        workSchedule,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        idCardImage,
        certificateImage,
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

    // Convert date strings to Date objects
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.contractStartDate) {
      updateData.contractStartDate = new Date(updateData.contractStartDate);
    }
    if (updateData.contractEndDate) {
      updateData.contractEndDate = new Date(updateData.contractEndDate);
    }
    // Convert salary to string to preserve precision
    if (updateData.salary !== undefined) {
      updateData.salary = String(updateData.salary);
    }

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
