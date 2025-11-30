import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateCaregiver } from '../../middleware/auth';

const router = Router();

// GET /api/caregiver/tasks - ดึงรายการงานประจำวัน
router.get('/', authenticateCaregiver, async (req: Request, res: Response) => {
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

// PATCH /api/caregiver/tasks/:id/complete - ทำเครื่องหมายงานเสร็จ
router.patch('/:id/complete', authenticateCaregiver, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, completedAt } = req.body;

    // อัปเดต Task และดึงข้อมูล caregiver/elder
    const task = await prisma.task.update({
      where: { id },
      data: { 
        status: status || 'done',
        completedAt: completedAt ? new Date(completedAt) : new Date()
      },
      include: {
        caregiver: {
          select: {
            elderId: true
          }
        }
      }
    });

    // อัปเดต Activity ที่เกี่ยวข้อง (ถ้ามี elderId)
    if (task.caregiver?.elderId) {
      // แปลง task.date เป็น DateTime range สำหรับวันนั้น
      const taskDate = new Date(task.date);
      const startOfDay = new Date(taskDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(taskDate.setHours(23, 59, 59, 999));
      
      // หา Activity ที่ตรงกับ Task นี้ (ตาม title, time และวันที่)
      const relatedActivities = await prisma.activity.findMany({
        where: {
          elderId: task.caregiver.elderId,
          title: task.title,
          time: task.time,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      console.log(`🔍 Found ${relatedActivities.length} activities matching task "${task.title}" at ${task.time}`);

      // อัปเดตสถานะทุก Activity ที่เจอ
      const updatePromises = relatedActivities.map(activity => 
        prisma.activity.update({
          where: { id: activity.id },
          data: {
            completed: status === 'done',
            completedAt: status === 'done' ? (completedAt ? new Date(completedAt) : new Date()) : null
          }
        })
      );

      await Promise.all(updatePromises);

      console.log(`✅ Updated ${relatedActivities.length} related activities for task ${task.title}`);
    }

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

// PATCH /api/caregiver/tasks/:id - แก้ไขงาน
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, detail, instruction, time, date } = req.body;

    // หาข้อมูล Task เดิมก่อน
    const oldTask = await prisma.task.findUnique({ 
      where: { id },
      include: { caregiver: true }
    });

    if (!oldTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // อัพเดท Task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        detail,
        instruction,
        time,
        date: date ? new Date(date) : undefined
      }
    });

    // อัพเดท Activity ที่เกี่ยวข้อง (ถ้ามี)
    if (oldTask.caregiver.elderId) {
      const relatedActivities = await prisma.activity.findMany({
        where: {
          title: oldTask.title,
          time: oldTask.time,
          date: oldTask.date,
          elderId: oldTask.caregiver.elderId
        }
      });

      for (const activity of relatedActivities) {
        await prisma.activity.update({
          where: { id: activity.id },
          data: {
            title,
            description: detail,
            time,
            date: date ? new Date(date) : undefined
          }
        });
      }

      // อัพเดท Tasks อื่นๆ ที่มีข้อมูลเดียวกัน (ผู้ดูแลคนอื่นของคุณยายคนเดียวกัน)
      await prisma.task.updateMany({
        where: {
          id: { not: id }, // ไม่รวม task ที่เพิ่งอัพเดท
          title: oldTask.title,
          time: oldTask.time,
          date: oldTask.date,
          caregiver: {
            elderId: oldTask.caregiver.elderId
          }
        },
        data: {
          title,
          detail,
          instruction,
          time,
          date: date ? new Date(date) : undefined
        }
      });
    }

    console.log('✅ Task, related activities and other tasks updated');

    res.json(updatedTask);
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task', message: error.message });
  }
});

// DELETE /api/caregiver/tasks/:id - ลบงาน
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // หาข้อมูล Task ก่อนลบ
    const task = await prisma.task.findUnique({ 
      where: { id },
      include: { caregiver: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // ลบ Activity และ Tasks ที่เกี่ยวข้อง (ถ้ามี elderId)
    let deletedActivities = { count: 0 };
    let deletedOtherTasks = { count: 0 };

    if (task.caregiver.elderId) {
      // ลบ Activity ที่เกี่ยวข้อง
      deletedActivities = await prisma.activity.deleteMany({
        where: {
          title: task.title,
          time: task.time,
          date: task.date,
          elderId: task.caregiver.elderId
        }
      });

      // ลบ Tasks อื่นๆ ที่เกี่ยวข้อง
      deletedOtherTasks = await prisma.task.deleteMany({
        where: {
          id: { not: id },
          title: task.title,
          time: task.time,
          date: task.date,
          caregiver: {
            elderId: task.caregiver.elderId
          }
        }
      });
    }

    // ลบ Task นี้
    await prisma.task.delete({
      where: { id }
    });

    console.log(`🗑️ Deleted task, ${deletedActivities.count} activities, ${deletedOtherTasks.count} other tasks`);

    res.json({ 
      message: 'Task, related activities and other tasks deleted successfully',
      deletedActivities: deletedActivities.count,
      deletedOtherTasks: deletedOtherTasks.count
    });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task', message: error.message });
  }
});

export default router;
