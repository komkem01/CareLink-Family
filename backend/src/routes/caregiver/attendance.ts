import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateCaregiver } from "../../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// ============================================
// CHECK-IN (ผู้ดูแลลงเวลาเข้างาน)
// ============================================
router.post("/check-in", authenticateCaregiver, async (req: Request, res: Response) => {
  try {
    const caregiverId = (req as any).user?.caregiverId;
    if (!caregiverId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { location, photo, elderId } = req.body;

    // ตรวจสอบว่าวันนี้ check-in แล้วหรือยัง
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        caregiverId,
        workDate: today,
      },
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return res.status(400).json({ 
        message: "คุณลงเวลาเข้างานวันนี้แล้ว",
        attendance: existingAttendance 
      });
    }

    const checkInTime = new Date();

    // ตรวจสอบการมาสาย (สมมติว่างานเริ่ม 08:00)
    const workStartHour = 8;
    const isLate = checkInTime.getHours() > workStartHour || 
                   (checkInTime.getHours() === workStartHour && checkInTime.getMinutes() > 15);

    const attendance = existingAttendance
      ? await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkInTime,
            checkInLocation: location || null,
            checkInPhoto: photo || null,
            status: isLate ? "late" : "present",
            elderId: elderId || null,
          },
        })
      : await prisma.attendance.create({
          data: {
            caregiverId,
            workDate: today,
            checkInTime,
            checkInLocation: location || null,
            checkInPhoto: photo || null,
            status: isLate ? "late" : "present",
            elderId: elderId || null,
          },
        });

    // อัปเดต lastActiveAt ของผู้ดูแล
    await prisma.caregiver.update({
      where: { id: caregiverId },
      data: { lastActiveAt: new Date() },
    });

    return res.json({
      message: isLate ? "ลงเวลาเข้างานสำเร็จ (มาสาย)" : "ลงเวลาเข้างานสำเร็จ",
      attendance,
      isLate,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ============================================
// CHECK-OUT (ผู้ดูแลลงเวลาออกงาน)
// ============================================
router.post("/check-out", authenticateCaregiver, async (req: Request, res: Response) => {
  try {
    const caregiverId = (req as any).user?.caregiverId;
    if (!caregiverId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { location, photo, notes } = req.body;

    // หาการ check-in ของวันนี้
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        caregiverId,
        workDate: today,
      },
    });

    if (!attendance) {
      return res.status(400).json({ message: "ยังไม่ได้ลงเวลาเข้างานวันนี้" });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ 
        message: "คุณลงเวลาออกงานวันนี้แล้ว",
        attendance 
      });
    }

    const checkOutTime = new Date();

    // คำนวณชั่วโมงทำงาน
    let hoursWorked = 0;
    let overtimeHours = 0;
    let isOvertime = false;

    if (attendance.checkInTime) {
      const workDuration = checkOutTime.getTime() - attendance.checkInTime.getTime();
      hoursWorked = workDuration / (1000 * 60 * 60); // แปลงเป็นชั่วโมง
      
      // สมมติว่างานปกติ 8 ชม.
      const standardHours = 8;
      if (hoursWorked > standardHours) {
        overtimeHours = hoursWorked - standardHours;
        isOvertime = true;
      }
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        checkOutLocation: location || null,
        checkOutPhoto: photo || null,
        hoursWorked: Math.round(hoursWorked * 100) / 100, // ปัดเป็น 2 ทศนิยม
        isOvertime,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        notes: notes || attendance.notes,
      },
    });

    // อัปเดต lastActiveAt
    await prisma.caregiver.update({
      where: { id: caregiverId },
      data: { lastActiveAt: new Date() },
    });

    return res.json({
      message: "ลงเวลาออกงานสำเร็จ",
      attendance: updatedAttendance,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      overtime: isOvertime ? Math.round(overtimeHours * 100) / 100 : 0,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ============================================
// GET TODAY'S ATTENDANCE (ดูสถานะการเข้างานวันนี้)
// ============================================
router.get("/today", authenticateCaregiver, async (req: Request, res: Response) => {
  try {
    const caregiverId = (req as any).user?.caregiverId;
    if (!caregiverId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        caregiverId,
        workDate: today,
      },
    });

    if (!attendance) {
      return res.json({ 
        hasCheckedIn: false,
        hasCheckedOut: false,
        attendance: null 
      });
    }

    return res.json({
      hasCheckedIn: !!attendance.checkInTime,
      hasCheckedOut: !!attendance.checkOutTime,
      attendance,
    });
  } catch (error) {
    console.error("Get today attendance error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ============================================
// GET ATTENDANCE HISTORY (ประวัติการเข้างาน)
// ============================================
router.get("/history", authenticateCaregiver, async (req: Request, res: Response) => {
  try {
    const caregiverId = (req as any).user?.caregiverId;
    if (!caregiverId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { month, year } = req.query;

    let whereClause: any = { caregiverId };

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      
      whereClause.workDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { workDate: 'desc' },
      take: 31, // จำกัดไม่เกิน 31 วัน
    });

    // คำนวณสถิติ
    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
    const lateDays = attendances.filter(a => a.status === 'late').length;
    const absentDays = attendances.filter(a => a.status === 'absent').length;
    const totalHours = attendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    const totalOvertimeHours = attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

    return res.json({
      attendances,
      summary: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        totalHours: Math.round(totalHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Get attendance history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ============================================
// FAMILY: VIEW CAREGIVER ATTENDANCE
// ============================================
router.get("/caregiver/:caregiverId", async (req: Request, res: Response) => {
  try {
    const { caregiverId } = req.params;
    const { month, year, startDate, endDate } = req.query;

    let whereClause: any = { caregiverId };

    if (startDate && endDate) {
      whereClause.workDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0);
      whereClause.workDate = {
        gte: start,
        lte: end,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { workDate: 'desc' },
      take: 100,
    });

    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId },
      select: { name: true, phone: true },
    });

    return res.json({
      caregiver,
      attendances,
    });
  } catch (error) {
    console.error("Get caregiver attendance error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
