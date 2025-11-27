import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/family/notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const notifications = await prisma.notification.findMany({
      where: userId ? { userId: String(userId) } : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(notifications);
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message });
  }
});

// PATCH /api/family/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(notification);
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read', message: error.message });
  }
});

export default router;
