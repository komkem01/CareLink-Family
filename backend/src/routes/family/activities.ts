import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireFamily } from '../../middleware/auth';

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

    // Create task if caregiver is specified
    let taskCreated = null;
    
    if (caregiverId) {
      console.log('👤 Creating task for specified caregiver:', caregiverId);
      taskCreated = await prisma.task.create({
        data: {
          title,
          detail: description,
          instruction: description,
          time,
          date: new Date(date),
          caregiverId,
          status: 'pending'
        }
      });
      console.log('✅ Task created for caregiver:', caregiverId);
    }

    res.status(201).json({
      activity,
      task: taskCreated,
      message: taskCreated 
        ? 'Activity และ Task ถูกสร้างสำหรับผู้ดูแลเรียบร้อย' 
        : 'Activity ถูกสร้างแล้ว (ยังไม่มีการมอบหมายงาน)'
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
