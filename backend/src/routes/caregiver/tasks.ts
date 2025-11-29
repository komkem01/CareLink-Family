import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/caregiver/tasks - ดึงรายการงานประจำวัน
router.get('/', async (req: Request, res: Response) => {
  try {
    const { caregiverId, date } = req.query;

    const where: any = {};
    if (caregiverId) where.caregiverId = String(caregiverId);
    if (date) {
      const targetDate = new Date(String(date));
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.date = {
        gte: targetDate,
        lt: nextDay
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        time: 'asc'
      }
    });

    res.json(tasks);
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', message: error.message });
  }
});

// POST /api/caregiver/tasks/:id/complete - ทำเครื่องหมายงานเสร็จ
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.update({
      where: { id },
      data: { status: 'done' }
    });

    res.json(task);
  } catch (error: any) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task', message: error.message });
  }
});

// POST /api/caregiver/tasks/:id/photo - อัพโหลดรูปบันทึกการทำงาน
router.post('/:id/photo', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: { photoUrl }
    });

    res.json(task);
  } catch (error: any) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Failed to upload photo', message: error.message });
  }
});

// GET /api/caregiver/tasks/next - ดึงงานถัดไป
router.get('/next', async (req: Request, res: Response) => {
  try {
    const { caregiverId } = req.query;

    const task = await prisma.task.findFirst({
      where: {
        caregiverId: String(caregiverId),
        status: 'pending'
      },
      orderBy: {
        time: 'asc'
      }
    });

    res.json(task);
  } catch (error: any) {
    console.error('Get next task error:', error);
    res.status(500).json({ error: 'Failed to get next task', message: error.message });
  }
});

export default router;
