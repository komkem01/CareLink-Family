import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireFamily } from '../../middleware/auth';

const router = Router();

// GET /api/family/elders - ดึงรายชื่อผู้สูงอายุ (with pagination)
router.get('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const familyUserId = req.userId as string;
    if (!familyUserId) {
      return res.status(401).json({ error: 'Missing family user id from token' });
    }
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 5;
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    // Query elders
    const [elders, total] = await Promise.all([
      prisma.elder.findMany({
        where: { familyUserId },
        include: {
          caregivers: {
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
        },
        skip,
        take
      }),
      prisma.elder.count({ where: { familyUserId } })
    ]);
    res.json({
      elders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error: any) {
    console.error('Get elders error:', error);
    res.status(500).json({ error: 'Failed to fetch elders', message: error.message });
  }
});

// POST /api/family/elders - เพิ่มผู้สูงอายุใหม่
router.post('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
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
      address
    } = req.body;
    const familyUserId = req.userId as string;
    if (!familyUserId) {
      return res.status(401).json({ error: 'Missing family user id from token' });
    }
    // Check for duplicate elder name for this user
    const existing = await prisma.elder.findFirst({
      where: {
        familyUserId,
        name: name.trim()
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate elder name', message: 'มีผู้สูงอายุชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น' });
    }

    // Generate unique 6-digit pairing code
    const generatePairingCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let pairingCode = generatePairingCode();
    
    // Ensure pairingCode is unique
    while (true) {
      const existingCode = await prisma.elder.findUnique({
        where: { pairingCode }
      });
      if (!existingCode) break;
      pairingCode = generatePairingCode();
    }

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
        familyUserId: familyUserId,
        pairingCode, // Add generated pairing code
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
        caregivers: true,
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
router.patch('/:id', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const familyUserId = req.userId as string;
    if (!familyUserId) {
      return res.status(401).json({ error: 'Missing family user id from token' });
    }
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

    // ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของ elder
    const elder = await prisma.elder.findUnique({ where: { id } });
    if (!elder || elder.familyUserId !== familyUserId) {
      return res.status(403).json({ error: 'Permission denied', message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้' });
    }

    // ตรวจสอบชื่อซ้ำ (exclude ตัวเอง)
    if (updateData.name) {
      const duplicate = await prisma.elder.findFirst({
        where: {
          familyUserId,
          name: updateData.name.trim(),
          NOT: { id }
        }
      });
      if (duplicate) {
        return res.status(400).json({ error: 'Duplicate elder name', message: 'มีผู้สูงอายุชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น' });
      }
    }

    const updated = await prisma.elder.update({
      where: { id },
      data: updateData
    });

    res.json(updated);
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
