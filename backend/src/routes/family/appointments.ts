import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/appointments - Get all appointments (with filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { elderId, filter, startDate } = req.query;

    const where: any = {};
    if (elderId) where.elderId = String(elderId);
    if (startDate) where.date = { gte: new Date(String(startDate)) };

    // Filter: upcoming or past
    if (filter === 'upcoming') {
      where.date = { gte: new Date() };
    } else if (filter === 'past') {
      where.date = { lt: new Date() };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        elder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    res.json(appointments);
  } catch (error: any) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments', message: error.message });
  }
});

// POST /api/appointments - Create appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, date, time, type, location, notes, reminder, elderId } = req.body;

    const appointment = await prisma.appointment.create({
      data: {
        title,
        date: new Date(date),
        time,
        type,
        location,
        notes: notes || '',
        reminder: reminder ?? true,
        elderId,
      },
      include: {
        elder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment', message: error.message });
  }
});

// PATCH /api/appointments/:id - Update appointment
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, date, time, type, location, notes, reminder } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        time,
        type,
        location,
        notes,
        reminder,
      },
    });

    res.json(appointment);
  } catch (error: any) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment', message: error.message });
  }
});

// DELETE /api/appointments/:id - Delete appointment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.appointment.delete({
      where: { id },
    });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error: any) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Failed to delete appointment', message: error.message });
  }
});

export default router;
