import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateCaregiver } from '../../middleware/auth';

const router = Router();

// GET /api/caregiver/elder - ดึงข้อมูลผู้สูงอายุที่ดูแล
router.get('/', authenticateCaregiver, async (req: Request, res: Response) => {
  try {
    const caregiverId = req.user?.caregiverId || req.userId;
    
    if (!caregiverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // หา caregiver และ elder ที่ต้องดูแล
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId },
      include: {
        elder: {
          include: {
            familyUser: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!caregiver) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }

    if (!caregiver.elder) {
      return res.status(404).json({ error: 'No elder assigned', message: 'ยังไม่ได้จับคู่กับผู้สูงอายุ' });
    }

    // ส่งข้อมูลผู้สูงอายุ
    res.json({
      id: caregiver.elder.id,
      name: caregiver.elder.name,
      age: caregiver.elder.age,
      relation: caregiver.elder.relation,
      gender: caregiver.elder.gender,
      bloodType: caregiver.elder.bloodType,
      allergies: caregiver.elder.allergies,
      chronicDiseases: caregiver.elder.chronicDiseases,
      currentMedications: caregiver.elder.currentMedications,
      address: caregiver.elder.address,
      phone: caregiver.elder.phone,
      profileColor: caregiver.elder.profileColor,
      photoUrl: caregiver.elder.photoUrl,
      medicalNotes: caregiver.elder.medicalNotes,
      emergencyContact: caregiver.elder.emergencyContact,
      emergencyPhone: caregiver.elder.emergencyPhone,
      family: caregiver.elder.familyUser
    });

  } catch (error: any) {
    console.error('Get elder error:', error);
    res.status(500).json({ error: 'Failed to fetch elder information', message: error.message });
  }
});

export default router;