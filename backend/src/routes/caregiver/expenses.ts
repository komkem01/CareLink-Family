import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// POST /api/caregiver/expenses - เพิ่มรายการค่าใช้จ่าย
router.post('/', async (req: Request, res: Response) => {
  try {
    const { description, amount, category, elderId, caregiverName } = req.body;

    const bill = await prisma.bill.create({
      data: {
        description,
        amount: parseFloat(amount),
        category,
        addedBy: 'caregiver',
        addedByName: caregiverName,
        elderId
      }
    });

    res.status(201).json(bill);
  } catch (error: any) {
    console.error('Add expense error:', error);
    res.status(500).json({ error: 'Failed to add expense', message: error.message });
  }
});

// GET /api/caregiver/expenses - ดูรายการที่เพิ่ม
router.get('/', async (req: Request, res: Response) => {
  try {
    const { caregiverName, elderId } = req.query;

    const where: any = { addedBy: 'caregiver' };
    if (caregiverName) where.addedByName = String(caregiverName);
    if (elderId) where.elderId = String(elderId);

    const expenses = await prisma.bill.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    });

    res.json(expenses);
  } catch (error: any) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses', message: error.message });
  }
});

export default router;
