import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// POST /api/caregiver/expenses - เพิ่มรายการค่าใช้จ่าย
router.post('/', async (req: Request, res: Response) => {
  try {
    const { item, description, amount, category, elderId, caregiverId, caregiverName, date } = req.body;

    // Get caregiver name if caregiverId is provided
    let addedByName = caregiverName;
    if (caregiverId && !addedByName) {
      const caregiver = await prisma.caregiver.findUnique({
        where: { id: caregiverId },
        select: { name: true }
      });
      addedByName = caregiver?.name || 'ผู้ดูแล';
    }

    const bill = await prisma.bill.create({
      data: {
        description: item || description, // Accept either 'item' or 'description'
        amount: parseFloat(amount),
        category: category || 'other',
        addedBy: 'caregiver',
        addedByName: addedByName,
        addedById: caregiverId || null,
        date: date ? new Date(date) : new Date(),
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

// DELETE /api/caregiver/expenses/:id - ลบรายการค่าใช้จ่าย
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if bill exists and was added by caregiver
    const bill = await prisma.bill.findFirst({
      where: { 
        id,
        addedBy: 'caregiver'
      }
    });

    if (!bill) {
      return res.status(404).json({ error: 'Expense not found or not added by caregiver' });
    }

    await prisma.bill.delete({
      where: { id }
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense', message: error.message });
  }
});

export default router;
