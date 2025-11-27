import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/family/elders - ดึงรายชื่อผู้สูงอายุ
router.get('/', async (req: Request, res: Response) => {
  try {
    const { familyUserId } = req.query;

    const elders = await prisma.elder.findMany({
      where: familyUserId ? { familyUserId: String(familyUserId) } : undefined,
      include: {
        caregiver: {
          select: {
            id: true,
            name: true,
            phone: true,
            verified: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(elders);
  } catch (error: any) {
    console.error('Get elders error:', error);
    res.status(500).json({ error: 'Failed to fetch elders', message: error.message });
  }
});

// POST /api/family/elders - เพิ่มผู้สูงอายุใหม่
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      age,
      dateOfBirth,
      gender,
      relation,
      profileColor,
      bloodType,
      allergies,
      chronicDiseases,
      phone,
      address,
      familyUserId
    } = req.body;

    const elder = await prisma.elder.create({
      data: {
        name,
        age: parseInt(age),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        relation,
        profileColor: profileColor || '#9333ea',
        bloodType,
        allergies: allergies || [],
        chronicDiseases: chronicDiseases || [],
        phone,
        address,
        familyUserId
      }
    });

    res.status(201).json(elder);
  } catch (error: any) {
    console.error('Create elder error:', error);
    res.status(500).json({ error: 'Failed to create elder', message: error.message });
  }
});

// GET /api/family/elders/:id - ดึงข้อมูลผู้สูงอายุ
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const elder = await prisma.elder.findUnique({
      where: { id },
      include: {
        caregiver: true,
        bills: {
          orderBy: { date: 'desc' },
          take: 10
        },
        activities: {
          orderBy: { date: 'desc' },
          take: 10
        },
        appointments: {
          orderBy: { date: 'desc' },
          take: 10
        },
        healthRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!elder) {
      return res.status(404).json({ error: 'Elder not found' });
    }

    res.json(elder);
  } catch (error: any) {
    console.error('Get elder error:', error);
    res.status(500).json({ error: 'Failed to fetch elder', message: error.message });
  }
});

// PATCH /api/family/elders/:id - แก้ไขข้อมูล
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert age to number if provided
    if (updateData.age) {
      updateData.age = parseInt(updateData.age);
    }

    // Convert dateOfBirth to Date if provided
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Remove familyUserId from update (shouldn't be changed)
    delete updateData.familyUserId;

    const elder = await prisma.elder.update({
      where: { id },
      data: updateData
    });

    res.json(elder);
  } catch (error: any) {
    console.error('Update elder error:', error);
    res.status(500).json({ error: 'Failed to update elder', message: error.message });
  }
});

// DELETE /api/family/elders/:id - ลบผู้สูงอายุ
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.elder.delete({
      where: { id }
    });

    res.json({ message: 'Elder deleted successfully' });
  } catch (error: any) {
    console.error('Delete elder error:', error);
    res.status(500).json({ error: 'Failed to delete elder', message: error.message });
  }
});

export default router;
