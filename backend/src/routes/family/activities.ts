import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireFamily } from '../../middleware/auth';

const router = Router();

// GET /api/family/activities
router.get('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { elderId, date } = req.query;
    const where: any = {};
    if (elderId) {
      where.elderId = String(elderId);
    } else {
      // If no elderId, filter by user's elders
      where.elder = { familyUserId: userId };
    }
    
    // กรองตามวันที่ถ้ามีส่ง date parameter
    if (date) {
      const startOfDay = new Date(String(date));
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(String(date));
      endOfDay.setHours(23, 59, 59, 999);
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
    
    const activities = await prisma.activity.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      include: {
        elder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    res.json(activities);
  } catch (error: any) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities', message: error.message });
  }
});

// POST /api/family/activities
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, time, date, elderId, caregiverId } = req.body;

    console.log('📝 Creating activity:', { title, description, time, date, elderId, caregiverId });

    // สร้าง Activity
    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        time,
        date: new Date(date),
        elderId
      }
    });

    console.log('✅ Activity created:', activity.id);

    // ถ้ามี caregiverId หรือ elder มี caregiver ที่ active อยู่ ให้สร้าง Task ด้วย
    let tasksCreated = 0;
    const createdTasks = [];
    
    if (caregiverId) {
      // สร้าง Task สำหรับ caregiver ที่ระบุ
      console.log('👤 Creating task for specific caregiver:', caregiverId);
      const task = await prisma.task.create({
        data: {
          title,
          detail: description,
          instruction: description,
          time,
          date: new Date(date),
          caregiverId,
          elderId,
          status: 'pending'
        }
      });
      createdTasks.push(task);
      tasksCreated = 1;
      console.log('✅ Task created for caregiver:', caregiverId);
    } else {
      // ดึง caregivers ที่ active อยู่สำหรับ elder นี้
      const elder = await prisma.elder.findUnique({
        where: { id: elderId },
        include: {
          caregivers: {
            where: { verified: true }
          }
        }
      });

      console.log(`👥 Found ${elder?.caregivers.length || 0} verified caregivers for elder ${elderId}`);

      // สร้าง Task สำหรับ caregiver ทุกคน
      if (elder && elder.caregivers.length > 0) {
        const tasks = await Promise.all(
          elder.caregivers.map(caregiver => {
            console.log(`  → Creating task for caregiver ${caregiver.name} (${caregiver.id})`);
            return prisma.task.create({
              data: {
                title,
                detail: description,
                instruction: description,
                time,
                date: new Date(date),
                caregiverId: caregiver.id,
                elderId,
                status: 'pending'
              }
            });
          })
        );
        createdTasks.push(...tasks);
        tasksCreated = tasks.length;
        console.log(`✅ Created ${tasksCreated} tasks`);
      } else {
        console.log('⚠️  No verified caregivers found - no tasks created');
      }
    }

    res.status(201).json({
      activity,
      tasksCreated,
      tasks: createdTasks,
      message: tasksCreated > 0
        ? `Activity และ ${tasksCreated} Task ถูกสร้างสำหรับผู้ดูแลเรียบร้อย` 
        : 'Activity ถูกสร้างแล้ว (ไม่มีผู้ดูแลที่ verified จะมอบหมายงาน)'
    });
  } catch (error: any) {
    console.error('❌ Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity', message: error.message });
  }
});

// PATCH /api/family/activities/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, time, date } = req.body;

    // ดึง Activity เดิมก่อน
    const oldActivity = await prisma.activity.findUnique({ where: { id } });
    if (!oldActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // อัพเดท Activity
    const activity = await prisma.activity.update({
      where: { id },
      data: {
        title,
        description,
        time,
        date: date ? new Date(date) : undefined
      }
    });

    // อัพเดท Task ที่เกี่ยวข้อง (ถ้ามี)
    const oldDate = new Date(oldActivity.date);
    const startOfDay = new Date(oldDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(oldDate.setHours(23, 59, 59, 999));
    
    const tasksToUpdate = await prisma.task.findMany({
      where: {
        title: oldActivity.title,
        time: oldActivity.time,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    // อัพเดทแต่ละ Task
    for (const task of tasksToUpdate) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          title,
          detail: description,
          instruction: description,
          time,
          date: date ? new Date(date) : undefined
        }
      });
    }

    res.json({ activity, tasksUpdated: tasksToUpdate.length });
  } catch (error: any) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity', message: error.message });
  }
});

// DELETE /api/family/activities/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // ดึงข้อมูล Activity ก่อนลบ
    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // ลบ Activity
    await prisma.activity.delete({
      where: { id }
    });

    // ลบ Tasks ที่เกี่ยวข้อง (ถ้ามี)
    const activityDate = new Date(activity.date);
    const startOfDay = new Date(activityDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(activityDate.setHours(23, 59, 59, 999));

    const deletedTasks = await prisma.task.deleteMany({
      where: {
        title: activity.title,
        time: activity.time,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    res.json({ 
      message: 'Activity deleted successfully',
      tasksDeleted: deletedTasks.count
    });
  } catch (error: any) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity', message: error.message });
  }
});

// PATCH /api/family/activities/:id/toggle
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const newCompletedStatus = !activity.completed;
    const updated = await prisma.activity.update({
      where: { id },
      data: { 
        completed: newCompletedStatus,
        completedAt: newCompletedStatus ? new Date() : null
      }
    });

    console.log(`🔄 Toggled activity ${id} to ${newCompletedStatus ? 'completed' : 'pending'}`);

    // อัพเดท Tasks ที่เกี่ยวข้องด้วย
    const activityDate = new Date(activity.date);
    const startOfDay = new Date(activityDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(activityDate.setHours(23, 59, 59, 999));

    const updatedTasks = await prisma.task.updateMany({
      where: {
        title: activity.title,
        time: activity.time,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      data: {
        status: newCompletedStatus ? 'done' : 'pending'
      }
    });

    console.log(`  → Updated ${updatedTasks.count} related tasks`);

    res.json({ 
      ...updated, 
      tasksUpdated: updatedTasks.count 
    });
  } catch (error: any) {
    console.error('❌ Toggle activity error:', error);
    res.status(500).json({ error: 'Failed to toggle activity', message: error.message });
  }
});

export default router;
