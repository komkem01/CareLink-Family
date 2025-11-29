import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireFamily } from '../../middleware/auth';

const router = Router();

// GET /api/family/medications - ดึงรายการยาทั้งหมด
router.get('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { elderId, isActive } = req.query;
    
    const where: any = {};
    if (elderId) where.elderId = String(elderId);
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const medications = await prisma.medication.findMany({
      where,
      include: {
        intakes: {
          where: {
            scheduledTime: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // วันนี้เป็นต้นไป
            }
          },
          orderBy: { scheduledTime: 'asc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(medications);
  } catch (error: any) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: 'Failed to fetch medications', message: error.message });
  }
});

// POST /api/family/medications - เพิ่มยาใหม่
router.post('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const {
      name,
      dosage,
      frequency,
      timing,
      times,
      instructions,
      sideEffects,
      reminderEnabled,
      reminderBefore,
      currentStock,
      minStock,
      unit,
      startDate,
      endDate,
      prescribedBy,
      elderId
    } = req.body;

    const medication = await prisma.medication.create({
      data: {
        name,
        dosage,
        frequency,
        timing: timing || [],
        times: times || [],
        instructions,
        sideEffects,
        reminderEnabled: reminderEnabled ?? true,
        reminderBefore: reminderBefore || 30,
        currentStock,
        minStock,
        unit: unit || 'เม็ด',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        prescribedBy,
        elderId,
        isActive: true
      }
    });

    // สร้าง intake schedule สำหรับ 7 วันข้างหน้า
    if (times && times.length > 0) {
      const intakes = [];
      const today = new Date();
      
      for (let day = 0; day < 7; day++) {
        for (const time of times) {
          const [hours, minutes] = time.split(':');
          const scheduledTime = new Date(today);
          scheduledTime.setDate(today.getDate() + day);
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          intakes.push({
            medicationId: medication.id,
            scheduledTime,
            status: 'pending'
          });
        }
      }
      
      await prisma.medicationIntake.createMany({
        data: intakes
      });
    }

    res.status(201).json(medication);
  } catch (error: any) {
    console.error('Create medication error:', error);
    res.status(500).json({ error: 'Failed to create medication', message: error.message });
  }
});

// PATCH /api/family/medications/:id - แก้ไขยา
router.patch('/:id', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      dosage,
      frequency,
      timing,
      times,
      instructions,
      sideEffects,
      reminderEnabled,
      reminderBefore,
      currentStock,
      minStock,
      unit,
      endDate,
      isActive
    } = req.body;

    const medication = await prisma.medication.update({
      where: { id },
      data: {
        name,
        dosage,
        frequency,
        timing,
        times,
        instructions,
        sideEffects,
        reminderEnabled,
        reminderBefore,
        currentStock,
        minStock,
        unit,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive
      }
    });

    res.json(medication);
  } catch (error: any) {
    console.error('Update medication error:', error);
    res.status(500).json({ error: 'Failed to update medication', message: error.message });
  }
});

// DELETE /api/family/medications/:id - ลบยา
router.delete('/:id', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.medication.delete({
      where: { id }
    });
    
    res.json({ message: 'Medication deleted successfully' });
  } catch (error: any) {
    console.error('Delete medication error:', error);
    res.status(500).json({ error: 'Failed to delete medication', message: error.message });
  }
});

// GET /api/family/medications/:id/intakes - ดึงประวัติการกินยา
router.get('/:id/intakes', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;
    
    const where: any = { medicationId: id };
    
    if (from || to) {
      where.scheduledTime = {};
      if (from) where.scheduledTime.gte = new Date(String(from));
      if (to) where.scheduledTime.lte = new Date(String(to));
    }
    
    const intakes = await prisma.medicationIntake.findMany({
      where,
      orderBy: { scheduledTime: 'desc' },
      take: 100
    });
    
    res.json(intakes);
  } catch (error: any) {
    console.error('Get intakes error:', error);
    res.status(500).json({ error: 'Failed to fetch intakes', message: error.message });
  }
});

// GET /api/family/medications/today - ยาที่ต้องกินวันนี้
router.get('/schedule/today', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { elderId } = req.query;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const intakes = await prisma.medicationIntake.findMany({
      where: {
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        medication: elderId ? { elderId: String(elderId) } : undefined
      },
      include: {
        medication: {
          include: {
            elder: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { scheduledTime: 'asc' }
    });
    
    res.json(intakes);
  } catch (error: any) {
    console.error('Get today schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch today schedule', message: error.message });
  }
});

// GET /api/family/medications/upcoming - ยาที่กำลังจะถึงเวลา
router.get('/schedule/upcoming', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const { elderId, hours = 2 } = req.query;
    
    const now = new Date();
    const upcoming = new Date(now.getTime() + (Number(hours) * 60 * 60 * 1000));
    
    const intakes = await prisma.medicationIntake.findMany({
      where: {
        scheduledTime: {
          gte: now,
          lte: upcoming
        },
        status: 'pending',
        medication: elderId ? { elderId: String(elderId) } : undefined
      },
      include: {
        medication: {
          include: {
            elder: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { scheduledTime: 'asc' }
    });
    
    res.json(intakes);
  } catch (error: any) {
    console.error('Get upcoming schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming schedule', message: error.message });
  }
});

export default router;
