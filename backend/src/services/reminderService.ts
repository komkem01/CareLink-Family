import prisma from '../lib/prisma';
import cron from 'node-cron';

/**
 * ระบบ Reminder Service
 * - ตรวจสอบนัดหมายที่ใกล้ถึงเวลา
 * - ตรวจสอบยาที่ต้องกิน
 * - ส่งการแจ้งเตือนอัตโนมัติ
 */

// ฟังก์ชันส่งการแจ้งเตือน
async function sendNotification(userId: string, notification: {
  title: string;
  message: string;
  type: string;
  category?: string;
  relatedId?: string;
  relatedType?: string;
  priority?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        category: notification.category,
        relatedId: notification.relatedId,
        relatedType: notification.relatedType,
        priority: notification.priority || 'normal',
        isRead: false
      }
    });
    
    console.log(`📬 แจ้งเตือน: ${notification.title} → User ${userId}`);
  } catch (error) {
    console.error('❌ Send notification error:', error);
  }
}

// 1️⃣ ตรวจสอบนัดหมายที่ใกล้ถึง
export async function checkUpcomingAppointments() {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    // นัดหมายในอีก 24 ชั่วโมง
    const appointments24h = await prisma.appointment.findMany({
      where: {
        date: {
          gte: now,
          lte: next24Hours
        },
        status: 'scheduled',
        reminder: true
      },
      include: {
        elder: {
          include: {
            familyUser: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    for (const apt of appointments24h) {
      // ตรวจสอบว่าส่งแจ้งเตือนไปแล้วหรือยัง (ดูจาก notifications ที่มี relatedId)
      const existing = await prisma.notification.findFirst({
        where: {
          relatedId: apt.id,
          relatedType: 'appointment',
          category: 'appointment',
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // ใน 24 ชม.ที่ผ่านมา
          }
        }
      });
      
      if (!existing) {
        const appointmentDate = new Date(apt.date);
        const timeStr = apt.time;
        const hoursUntil = Math.round((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        await sendNotification(apt.elder.familyUser.id, {
          title: '📅 เตือนนัดหมาย',
          message: `${apt.title} ในอีก ${hoursUntil} ชั่วโมง\nเวลา: ${timeStr} น.\nสถานที่: ${apt.location}`,
          type: 'info',
          category: 'appointment',
          relatedId: apt.id,
          relatedType: 'appointment',
          priority: 'high'
        });
      }
    }
    
    // นัดหมายในอีก 2 ชั่วโมง (แจ้งเตือนครั้งที่ 2)
    const appointments2h = await prisma.appointment.findMany({
      where: {
        date: {
          gte: now,
          lte: next2Hours
        },
        status: 'scheduled',
        reminder: true
      },
      include: {
        elder: {
          include: {
            familyUser: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    for (const apt of appointments2h) {
      await sendNotification(apt.elder.familyUser.id, {
        title: '⏰ นัดหมายใกล้เข้ามา!',
        message: `${apt.title} อีก 2 ชั่วโมง!\nเวลา: ${apt.time} น.\nสถานที่: ${apt.location}\n${apt.preparation ? `\n📝 เตรียม: ${apt.preparation}` : ''}`,
        type: 'warning',
        category: 'appointment',
        relatedId: apt.id,
        relatedType: 'appointment',
        priority: 'urgent'
      });
    }
    
    console.log(`✅ ตรวจสอบนัดหมาย: พบ ${appointments24h.length} นัดใน 24 ชม., ${appointments2h.length} นัดใน 2 ชม.`);
  } catch (error) {
    console.error('❌ Check appointments error:', error);
  }
}

// 2️⃣ ตรวจสอบยาที่ต้องกิน
export async function checkMedicationReminders() {
  try {
    const now = new Date();
    const next30Min = new Date(now.getTime() + 30 * 60 * 1000);
    const next1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    
    // ยาที่ใกล้ถึงเวลากิน (ใน 30 นาที-1 ชั่วโมง)
    const upcomingIntakes = await (prisma as any).medicationIntake.findMany({
      where: {
        scheduledTime: {
          gte: next30Min,
          lte: next1Hour
        },
        status: 'pending',
        reminderSent: false,
        medication: {
          reminderEnabled: true,
          isActive: true
        }
      },
      include: {
        medication: {
          include: {
            elder: {
              include: {
                familyUser: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    for (const intake of upcomingIntakes) {
      const minutesUntil = Math.round((intake.scheduledTime.getTime() - now.getTime()) / (1000 * 60));
      
      // ส่งแจ้งเตือนไปยังครอบครัว
      await sendNotification(intake.medication.elder.familyUser.id, {
        title: '💊 เตือนกินยา',
        message: `${intake.medication.elder.name} ควรกินยา "${intake.medication.name}"\nขนาด: ${intake.medication.dosage}\nอีก ${minutesUntil} นาที (${intake.scheduledTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})`,
        type: 'info',
        category: 'medication',
        relatedId: intake.id,
        relatedType: 'medication_intake',
        priority: 'high'
      });
      
      // ทำเครื่องหมายว่าส่งแจ้งเตือนแล้ว
      await (prisma as any).medicationIntake.update({
        where: { id: intake.id },
        data: { reminderSent: true }
      });
    }
    
    console.log(`✅ ตรวจสอบยา: พบ ${upcomingIntakes.length} รายการที่ต้องแจ้งเตือน`);
  } catch (error) {
    console.error('❌ Check medications error:', error);
  }
}

// 3️⃣ ตรวจสอบยาที่พลาด
export async function checkMissedMedications() {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // ยาที่พลาดกิน (เลยเวลามา 1 ชั่วโมง แต่ยังเป็น pending)
    const missedIntakes = await (prisma as any).medicationIntake.findMany({
      where: {
        scheduledTime: {
          lt: oneHourAgo
        },
        status: 'pending',
        medication: {
          isActive: true
        }
      },
      include: {
        medication: {
          include: {
            elder: {
              include: {
                familyUser: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    for (const intake of missedIntakes) {
      // เปลี่ยนสถานะเป็น missed
      await (prisma as any).medicationIntake.update({
        where: { id: intake.id },
        data: { status: 'missed' }
      });
      
      // แจ้งเตือนครอบครัว
      await sendNotification(intake.medication.elder.familyUser.id, {
        title: '⚠️ พลาดกินยา',
        message: `${intake.medication.elder.name} พลาดกินยา "${intake.medication.name}"\nเวลาที่ควรกิน: ${intake.scheduledTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
        type: 'warning',
        category: 'medication',
        relatedId: intake.id,
        relatedType: 'medication_intake',
        priority: 'high'
      });
    }
    
    console.log(`✅ ตรวจสอบยาพลาด: พบ ${missedIntakes.length} รายการ`);
  } catch (error) {
    console.error('❌ Check missed medications error:', error);
  }
}

// 4️⃣ ตรวจสอบยาใกล้หมด
export async function checkLowStockMedications() {
  try {
    const lowStockMeds = await prisma.medication.findMany({
      where: {
        isActive: true
      },
      include: {
        elder: {
          include: {
            familyUser: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    for (const med of lowStockMeds) {
      const medAny = med as any;
      if (medAny.currentStock !== null && medAny.minStock !== null && medAny.currentStock <= medAny.minStock) {
        // ตรวจสอบว่าเคยแจ้งเตือนแล้วหรือยัง (ใน 7 วันที่ผ่านมา)
        const recentNotif = await prisma.notification.findFirst({
          where: {
            relatedId: med.id,
            relatedType: 'medication_stock',
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        });
        
        if (!recentNotif) {
          await sendNotification(med.elder.familyUser.id, {
            title: '📦 ยาใกล้หมด',
            message: `ยา "${med.name}" ของ ${med.elder.name} เหลือเพียง ${medAny.currentStock} ${medAny.unit || 'เม็ด'}\nควรซื้อเพิ่ม`,
            type: 'warning',
            category: 'medication',
            relatedId: med.id,
            relatedType: 'medication_stock',
            priority: 'normal'
          });
        }
      }
    }
    
    console.log(`✅ ตรวจสอบยาใกล้หมด: เสร็จสิ้น`);
  } catch (error) {
    console.error('❌ Check low stock error:', error);
  }
}

// 🚀 เริ่ม Cron Jobs
export function startReminderService() {
  console.log('🔔 เริ่มระบบแจ้งเตือนอัตโนมัติ...');
  
  // ตรวจสอบนัดหมาย - ทุกๆ 1 ชั่วโมง
  cron.schedule('0 * * * *', () => {
    console.log('⏰ [CRON] ตรวจสอบนัดหมาย...');
    checkUpcomingAppointments();
  });
  
  // ตรวจสอบยา - ทุกๆ 15 นาที
  cron.schedule('*/15 * * * *', () => {
    console.log('⏰ [CRON] ตรวจสอบยาที่ต้องกิน...');
    checkMedicationReminders();
  });
  
  // ตรวจสอบยาพลาด - ทุกๆ 30 นาที
  cron.schedule('*/30 * * * *', () => {
    console.log('⏰ [CRON] ตรวจสอบยาที่พลาด...');
    checkMissedMedications();
  });
  
  // ตรวจสอบยาใกล้หมด - ทุกวันเวลา 09:00
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ [CRON] ตรวจสอบยาใกล้หมด...');
    checkLowStockMedications();
  });
  
  console.log('✅ ระบบแจ้งเตือนพร้อมทำงาน');
  
  // รันทันทีตอนเริ่ม (สำหรับ testing)
  setTimeout(() => {
    checkUpcomingAppointments();
    checkMedicationReminders();
  }, 5000);
}
