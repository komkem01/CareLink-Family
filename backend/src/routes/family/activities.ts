import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireFamily } from '../../middleware/auth';
import { selectBestCaregiver } from '../../services/taskAssignmentService';

const router = Router();

// GET /api/family/activities
router.get('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { elderId } = req.query;
    const where: any = {};
    if (elderId) {
      where.elderId = String(elderId);
    } else {
      // If no elderId, filter by user's elders
      where.elder = { familyUserId: userId };
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

    // 🧠 Smart Task Assignment
    let tasksCreated = 0;
    const createdTasks = [];
    const notifications = [];
    
    if (caregiverId) {
      // ถ้าระบุ caregiver ไว้แล้ว ให้สร้าง task ให้เลย
      console.log('👤 Creating task for specified caregiver:', caregiverId);
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
      // 🎯 ใช้ Smart Assignment เลือก caregiver ที่เหมาะสมที่สุด
      console.log('🧠 Using smart assignment to select best caregiver...');
      const bestCaregiverId = await selectBestCaregiver(elderId, new Date(date));
      
      if (bestCaregiverId) {
        console.log(`🎯 Best caregiver selected: ${bestCaregiverId}`);
        const task = await prisma.task.create({
          data: {
            title,
            detail: description,
            instruction: description,
            time,
            date: new Date(date),
            caregiverId: bestCaregiverId,
            elderId,
            status: 'pending'
          }
        });
        createdTasks.push(task);
        tasksCreated = 1;
        console.log('✅ Task created with smart assignment');
      } else {
        // ไม่มี caregiver ที่เหมาะสม → ส่ง notification แจ้ง family
        console.log('⚠️ No suitable caregiver found - sending notification to family');
        
        // ดึง family user
        const elderInfo = await prisma.elder.findUnique({
          where: { id: elderId },
          select: { familyUserId: true }
        });
        
        if (elderInfo?.familyUserId) {
          await prisma.notification.create({
            data: {
              userId: elderInfo.familyUserId,
              type: 'task_assignment_failed',
              title: '⚠️ ไม่สามารถมอบหมายงานอัตโนมัติได้',
              message: `กิจกรรม "${title}" วันที่ ${new Date(date).toLocaleDateString('th-TH')} ไม่มีผู้ดูแลที่พร้อมรับงาน กรุณามอบหมายเองในภายหลัง`
            }
          });
          notifications.push({
            type: 'warning',
            message: 'No caregiver available on this date. Please assign manually later.'
          });
        }
        
        console.log('📢 Notification sent to family');
      }
    }

    res.status(201).json({
      activity,
      tasksCreated,
      tasks: createdTasks,
      notifications,
      message: tasksCreated > 0
        ? `Activity และ ${tasksCreated} Task ถูกสร้างสำหรับผู้ดูแลเรียบร้อย` 
        : 'Activity ถูกสร้างแล้ว (ไม่มีผู้ดูแลที่ verified จะมอบหมายงาน)'
    });
  } catch (error: any) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity', message: error.message });
  }
});

// PATCH /api/family/activities/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, time, date } = req.body;

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        title,
        description,
        time,
        date: date ? new Date(date) : undefined
      }
    });

    res.json(activity);
  } catch (error: any) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity', message: error.message });
  }
});

// DELETE /api/family/activities/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.activity.delete({
      where: { id }
    });

    res.json({ message: 'Activity deleted successfully' });
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

    res.json(updated);
  } catch (error: any) {
    console.error('Toggle activity error:', error);
    res.status(500).json({ error: 'Failed to toggle activity', message: error.message });
  }
});

export default router;
