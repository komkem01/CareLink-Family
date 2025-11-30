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

// Caregiver Login - ตรวจสอบเบอร์โทรและสถานะการยืนยัน
router.post('/caregiver/login', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    const caregiver = await prisma.caregiver.findUnique({ where: { phone } });
    if (!caregiver) {
      return res.status(404).json({ 
        error: 'Phone not found', 
        message: 'ไม่พบเบอร์โทรศัพท์นี้ในระบบ\nกรุณาแจ้งครอบครัวเพื่อเพิ่มข้อมูลคุณ' 
      });
    }

    // ตรวจสอบว่าผู้ดูแลได้รับการยืนยันแล้วหรือยัง
    if (!caregiver.verified) {
      return res.status(403).json({ 
        error: 'Not verified', 
        message: 'บัญชีของคุณยังไม่ได้รับการยืนยันจากครอบครัว\nกรุณารอการอนุมัติหรือติดต่อครอบครัว' 
      });
    }

    // สร้าง token สำหรับ caregiver
    const token = generateToken(caregiver.id, 'caregiver', caregiver.name);

    res.json({
      message: 'Login successful',
      token,
      caregiver: {
        id: caregiver.id,
        name: caregiver.name,
        phone: caregiver.phone,
        elderId: caregiver.elderId, // ส่ง elderId ไปด้วยเพื่อตรวจสอบว่าจับคู่แล้วหรือยัง
      },
    });
  } catch (error: any) {
    console.error('Caregiver login error:', error);
    res.status(500).json({ error: 'Failed to login', message: error.message });
  }
});

// Verify Pairing Code - คนดูแลใส่รหัสของยาย
router.post('/caregiver/pairing', async (req: Request, res: Response) => {
  try {
    const { pairingCode, caregiverId } = req.body;

    // หายายที่มี pairingCode นี้
    const elder = await prisma.elder.findUnique({
      where: {
        pairingCode,
      },
      include: {
        familyUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!elder) {
      return res.status(404).json({ error: 'Invalid pairing code', message: 'ไม่พบรหัสจับคู่นี้' });
    }

    // อัพเดทให้คนดูแลจับคู่กับยายคนนี้
    const caregiver = await prisma.caregiver.update({
      where: { id: caregiverId },
      data: { elderId: elder.id },
      include: {
        elder: true,
      },
    });

    res.json({
      message: 'Pairing successful',
      elder,
      caregiver,
    });
  } catch (error: any) {
    console.error('Pairing error:', error);
    res.status(500).json({ error: 'Failed to verify pairing', message: error.message });
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
