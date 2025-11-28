import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requireFamily } from '../../middleware/auth';

const router = Router();

// GET /api/family/bills
router.get('/', authenticateToken, requireFamily, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { elderId, isPaid } = req.query;
    const where: any = {};
    if (elderId) {
      where.elderId = String(elderId);
    } else {
      // If no elderId, filter by user's elders
      where.elder = { familyUserId: userId };
    }
    if (isPaid !== undefined) where.isPaid = isPaid === 'true';
    const bills = await prisma.bill.findMany({
      where,
      include: {
        elder: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(bills);
  } catch (error: any) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Failed to fetch bills', message: error.message });
  }
});

// POST /api/family/bills
router.post('/', async (req: Request, res: Response) => {
  try {
    const { description, amount, category, elderId } = req.body;

    const bill = await prisma.bill.create({
      data: {
        description,
        amount: parseFloat(amount),
        category,
        addedBy: 'family',
        elderId
      }
    });

    res.status(201).json(bill);
  } catch (error: any) {
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Failed to create bill', message: error.message });
  }
});

// PATCH /api/family/bills/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, amount, category } = req.body;

    const bill = await prisma.bill.update({
      where: { id },
      data: {
        description,
        amount: amount ? parseFloat(amount) : undefined,
        category
      }
    });

    res.json(bill);
  } catch (error: any) {
    console.error('Update bill error:', error);
    res.status(500).json({ error: 'Failed to update bill', message: error.message });
  }
});

// DELETE /api/family/bills/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.bill.delete({
      where: { id }
    });

    res.json({ message: 'Bill deleted successfully' });
  } catch (error: any) {
    console.error('Delete bill error:', error);
    res.status(500).json({ error: 'Failed to delete bill', message: error.message });
  }
});

// PATCH /api/family/bills/:id/toggle-paid
router.patch('/:id/toggle-paid', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const updated = await prisma.bill.update({
      where: { id },
      data: { isPaid: !bill.isPaid }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Toggle paid error:', error);
    res.status(500).json({ error: 'Failed to toggle paid status', message: error.message });
  }
});

export default router;
