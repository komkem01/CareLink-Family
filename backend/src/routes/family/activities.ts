import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/family/activities
router.get('/', async (req: Request, res: Response) => {
  try {
    const { elderId } = req.query;

    const activities = await prisma.activity.findMany({
      where: elderId ? { elderId: String(elderId) } : undefined,
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
    const { title, description, time, date, elderId } = req.body;

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        time,
        date: new Date(date),
        elderId
      }
    });

    res.status(201).json(activity);
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

    const updated = await prisma.activity.update({
      where: { id },
      data: { completed: !activity.completed }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Toggle activity error:', error);
    res.status(500).json({ error: 'Failed to toggle activity', message: error.message });
  }
});

export default router;
