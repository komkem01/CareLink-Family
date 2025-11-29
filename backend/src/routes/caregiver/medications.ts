import { Router, Request, Response } from "express";
import prisma from "../../lib/prisma";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

// GET /api/caregiver/medications/today - ยาที่ต้องดูแลวันนี้
router.get("/today", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { elderId } = req.query;

    if (!elderId) {
      return res.status(400).json({ error: "elderId is required" });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const intakes = await prisma.medicationIntake.findMany({
      where: {
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        medication: {
          elderId: String(elderId),
          isActive: true,
        },
      },
      include: {
        medication: true,
      },
      orderBy: { scheduledTime: "asc" },
    });

    res.json(intakes);
  } catch (error: any) {
    console.error("💊 Get today medications error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch medications", message: error.message });
  }
});

// GET /api/caregiver/medications/upcoming - ยาที่ใกล้ถึงเวลา
router.get(
  "/upcoming",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { elderId, hours = 1 } = req.query;

      if (!elderId) {
        return res.status(400).json({ error: "elderId is required" });
      }

      const now = new Date();
      const upcoming = new Date(now.getTime() + Number(hours) * 60 * 60 * 1000);

      const intakes = await prisma.medicationIntake.findMany({
        where: {
          scheduledTime: {
            gte: now,
            lte: upcoming,
          },
          status: "pending",
          medication: {
            elderId: String(elderId),
            isActive: true,
          },
        },
        include: {
          medication: true,
        },
        orderBy: { scheduledTime: "asc" },
      });

      res.json(intakes);
    } catch (error: any) {
      console.error("💊 Get upcoming medications error:", error);
      res
        .status(500)
        .json({
          error: "Failed to fetch upcoming medications",
          message: error.message,
        });
    }
  }
);

// POST /api/caregiver/medications/intake/:id/record - บันทึกการกินยา
router.post(
  "/intake/:id/record",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes, photoUrl } = req.body;
      const caregiverId = req.userId;
      const caregiverName = req.userName;

      const intake = await prisma.medicationIntake.update({
        where: { id },
        data: {
          status: status || "taken",
          actualTime: new Date(),
          takenBy: caregiverName,
          caregiverId,
          notes,
          photoUrl,
        },
        include: {
          medication: true,
        },
      });

      // ถ้ากินยาแล้ว ลดสต็อก
      if (status === "taken" && intake.medication.currentStock) {
        const newStock = intake.medication.currentStock - 1;

        await prisma.medication.update({
          where: { id: intake.medicationId },
          data: {
            currentStock: Math.max(0, newStock),
          },
        });

        // ถ้าสต็อกต่ำกว่าที่กำหนด แจ้งเตือน
        if (
          intake.medication.minStock &&
          newStock <= intake.medication.minStock
        ) {
          // TODO: ส่งการแจ้งเตือนไปยังครอบครัว
          console.log(
            `⚠️ ยา ${intake.medication.name} เหลือน้อย (${newStock} ${intake.medication.unit})`
          );
        }
      }

      console.log(`💊 บันทึกการกินยา: ${intake.medication.name} - ${status}`);

      res.json(intake);
    } catch (error: any) {
      console.error("💊 Record intake error:", error);
      res
        .status(500)
        .json({
          error: "Failed to record medication intake",
          message: error.message,
        });
    }
  }
);

// GET /api/caregiver/medications/list - รายการยาทั้งหมด
router.get("/list", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { elderId } = req.query;

    if (!elderId) {
      return res.status(400).json({ error: "elderId is required" });
    }

    const medications = await prisma.medication.findMany({
      where: {
        elderId: String(elderId),
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(medications);
  } catch (error: any) {
    console.error("💊 Get medications list error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch medications", message: error.message });
  }
});

export default router;
