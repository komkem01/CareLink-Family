import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/caregiver/tasks - ดึงรายการงานประจำวัน
router.get('/', async (req: Request, res: Response) => {
  try {
    const { caregiverId, elderId, date } = req.query;

    const where: any = {};
    
    // Query by elderId (preferred) or caregiverId
    if (elderId) {
      where.elderId = String(elderId);
    } else if (caregiverId) {
      where.caregiverId = String(caregiverId);
    }
    
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

    // อัพเดท Task
    const task = await prisma.task.update({
      where: { id },
      data: { 
        status: 'done',
        completedAt: new Date()
      }
    });

    console.log(`✅ Task ${id} marked as done by caregiver`);

    // หา Activity ที่เกี่ยวข้อง และอัพเดทด้วย
    if (task.elderId) {
      const taskDate = new Date(task.date);
      const startOfDay = new Date(taskDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(taskDate.setHours(23, 59, 59, 999));

      const relatedActivities = await prisma.activity.findMany({
        where: {
          elderId: task.elderId,
          title: task.title,
          time: task.time,
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });

      // อัพเดท Activity เป็น completed
      for (const activity of relatedActivities) {
        if (!activity.completed) {
          await prisma.activity.update({
            where: { id: activity.id },
            data: {
              completed: true,
              completedAt: new Date()
            }
          });
          console.log(`  → Synced activity ${activity.id} to completed`);
        }
      }
    }

    res.json(task);
  } catch (error: any) {
    console.error('❌ Complete task error:', error);
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
