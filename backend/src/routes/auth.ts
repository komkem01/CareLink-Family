import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken } from '../lib/auth';
import { authenticateToken } from '../middleware/auth';

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

    // Generate token with name
    const token = generateToken(user.id, 'family', user.name);

    // Extract request details for session tracking
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';

    // Create session record for new registration
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

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

    // Generate token with name
    const token = generateToken(user.id, 'family', user.name);

    // Extract request details for session tracking
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';

    // Create session record with detailed information
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

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

// Caregiver Login (with password)
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

    const token = generateToken(caregiver.id, 'caregiver', caregiver.name);

    res.json({
      message: 'Login successful',
      token,
      caregiver: {
        id: caregiver.id,
        name: caregiver.name,
        phone: caregiver.phone,
        elderId: caregiver.elderId,
      },
    });
  } catch (error: any) {
    console.error('Caregiver login error:', error);
    res.status(500).json({ error: 'Failed to login', message: error.message });
  }
});

// Caregiver Login with Pairing Code
router.post('/caregiver/login-pairing', async (req: Request, res: Response) => {
  try {
    const { phone, pairingCode } = req.body;

    if (!phone || !pairingCode) {
      return res.status(400).json({ error: 'Phone and pairing code are required' });
    }

    // หาผู้ดูแลจากเบอร์โทรและรหัสจับคู่
    const caregiver = await prisma.caregiver.findFirst({
      where: {
        phone,
        pairingCode,
      },
      include: {
        elder: {
          select: {
            id: true,
            name: true,
            age: true,
            relation: true,
          },
        },
      },
    });

    if (!caregiver) {
      return res.status(401).json({ error: 'เบอร์โทรศัพท์หรือรหัสจับคู่ไม่ถูกต้อง' });
    }

    // สร้าง token
    const token = generateToken(caregiver.id, 'caregiver', caregiver.name);

    // อัปเดต lastActiveAt
    await prisma.caregiver.update({
      where: { id: caregiver.id },
      data: { lastActiveAt: new Date() },
    });

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      caregiver: {
        id: caregiver.id,
        name: caregiver.name,
        phone: caregiver.phone,
        elderId: caregiver.elderId,
        elder: caregiver.elder,
        verified: caregiver.verified,
      },
    });
  } catch (error: any) {
    console.error('Caregiver login with pairing code error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', message: error.message });
  }
});

// Verify Pairing Code - เชื่อมต่อผู้ดูแลกับผู้สูงอายุ
router.post('/caregiver/pairing', async (req: Request, res: Response) => {
  try {
    const { pairingCode } = req.body;

    if (!pairingCode) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสจับคู่' });
    }

    // ตรวจสอบว่ามีรหัสนี้ในระบบหรือไม่
    const caregiver = await prisma.caregiver.findFirst({
      where: {
        pairingCode: pairingCode.toUpperCase(),
      },
      include: {
        elder: {
          select: {
            id: true,
            name: true,
            age: true,
            relation: true,
            allergies: true,
            chronicDiseases: true,
            currentMedications: true,
          },
        },
      },
    });

    if (!caregiver) {
      return res.status(404).json({ error: 'รหัสจับคู่ไม่ถูกต้อง' });
    }

    // ตรวจสอบว่าผู้ดูแลได้รับการยืนยันแล้วหรือไม่
    if (!caregiver.verified) {
      return res.status(403).json({ 
        error: 'ผู้ดูแลยังไม่ได้รับการยืนยัน',
        message: 'กรุณารอให้ครอบครัวยืนยันตัวตนของคุณก่อน'
      });
    }

    // สร้าง token สำหรับผู้ดูแล
    const token = generateToken(caregiver.id, 'caregiver', caregiver.name);

    // อัปเดต lastActiveAt
    await prisma.caregiver.update({
      where: { id: caregiver.id },
      data: { lastActiveAt: new Date() },
    });

    res.json({
      message: 'เชื่อมต่อสำเร็จ',
      token,
      caregiver: {
        id: caregiver.id,
        name: caregiver.name,
        phone: caregiver.phone,
        verified: caregiver.verified,
        elderId: caregiver.elderId,
        elder: caregiver.elder,
      },
    });
  } catch (error: any) {
    console.error('Pairing error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', message: error.message });
  }
});

// Logout - Delete session from database
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // ลบ session ที่ใช้ token นี้ออกจากฐานข้อมูล
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout', message: error.message });
  }
});

export default router;
