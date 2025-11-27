import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken } from '../lib/auth';

const router = Router();

// Family Register
router.post('/family/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    // Check if user exists
    const existing = await prisma.familyUser.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.familyUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
      },
    });

    // Generate token
    const token = generateToken(user.id, 'family');

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user', message: error.message });
  }
});

// Family Login
router.post('/family/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.familyUser.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, 'family');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login', message: error.message });
  }
});

// Caregiver Login
router.post('/caregiver/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    const caregiver = await prisma.caregiver.findUnique({ where: { phone } });
    if (!caregiver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, caregiver.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(caregiver.id, 'caregiver');

    res.json({
      message: 'Login successful',
      token,
      caregiver: {
        id: caregiver.id,
        name: caregiver.name,
        phone: caregiver.phone,
      },
    });
  } catch (error: any) {
    console.error('Caregiver login error:', error);
    res.status(500).json({ error: 'Failed to login', message: error.message });
  }
});

// Verify Pairing Code
router.post('/caregiver/pairing', async (req: Request, res: Response) => {
  try {
    const { pairingCode, caregiverId } = req.body;

    const caregiver = await prisma.caregiver.findFirst({
      where: {
        id: caregiverId,
        pairingCode,
      },
      include: {
        elder: true,
      },
    });

    if (!caregiver) {
      return res.status(404).json({ error: 'Invalid pairing code' });
    }

    res.json({
      message: 'Pairing verified',
      caregiver,
    });
  } catch (error: any) {
    console.error('Pairing error:', error);
    res.status(500).json({ error: 'Failed to verify pairing', message: error.message });
  }
});

export default router;
