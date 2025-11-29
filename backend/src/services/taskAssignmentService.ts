import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * 🧠 Smart Task Assignment Service
 * 
 * ระบบแบ่งงานอัจฉริยะที่พิจารณาจาก:
 * 1. กะทำงานของ Caregiver (workSchedule)
 * 2. จำนวน Task ที่มีอยู่แล้ว (workload balancing)
 * 3. ประสบการณ์และความเหมาะสม
 */

/**
 * ตรวจสอบว่า Caregiver ทำงานในวันที่กำหนดหรือไม่
 */
function isWorkingOnDay(workSchedule: string, targetDate: Date): boolean {
  try {
    // workSchedule format: "Monday - Friday, 8:00 AM - 5:00 PM" หรือ JSON
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if workSchedule mentions the day
    if (workSchedule.toLowerCase().includes(dayOfWeek.toLowerCase())) {
      return true;
    }
    
    // Check for "everyday" or "ทุกวัน"
    if (workSchedule.toLowerCase().includes('everyday') || 
        workSchedule.toLowerCase().includes('ทุกวัน') ||
        workSchedule.toLowerCase().includes('full-time')) {
      return true;
    }
    
    // Check for "Monday - Friday" patterns
    if (workSchedule.toLowerCase().includes('monday - friday') || 
        workSchedule.toLowerCase().includes('mon-fri')) {
      const day = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
      return day >= 1 && day <= 5; // Monday to Friday
    }
    
    // Try parsing as JSON (future enhancement)
    try {
      const schedule = JSON.parse(workSchedule);
      if (schedule.days && Array.isArray(schedule.days)) {
        return schedule.days.some((d: string) => 
          d.toLowerCase() === dayOfWeek.toLowerCase()
        );
      }
    } catch {
      // Not JSON, continue with string matching
    }
    
    return false; // Default: not working on this day
  } catch (error) {
    console.error('Error parsing work schedule:', error);
    return true; // Fallback: assume they can work
  }
}

/**
 * คำนวณ workload ของ caregiver ในช่วงวันที่กำหนด
 */
async function calculateWorkload(caregiverId: string, targetDate: Date): Promise<number> {
  // นับ tasks ที่ pending หรือ in-progress ใน ±3 วัน
  const threeDaysBefore = new Date(targetDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  const threeDaysAfter = new Date(targetDate);
  threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
  
  const taskCount = await prisma.task.count({
    where: {
      caregiverId,
      date: {
        gte: threeDaysBefore,
        lte: threeDaysAfter
      },
      status: {
        in: ['pending', 'in-progress']
      }
    }
  });
  
  return taskCount;
}

/**
 * คำนวณคะแนนความเหมาะสมของ caregiver สำหรับ task
 */
async function calculateSuitabilityScore(
  caregiver: any,
  taskDate: Date,
  taskType?: string
): Promise<number> {
  let score = 0;
  
  // 1. ทำงานในวันนั้นหรือไม่ (+50 คะแนน)
  if (isWorkingOnDay(caregiver.workSchedule, taskDate)) {
    score += 50;
  } else {
    return 0; // ถ้าไม่ทำงานในวันนั้น ไม่เหมาะสมเลย
  }
  
  // 2. Workload ต่ำ (+30 คะแนน สูงสุด)
  const workload = await calculateWorkload(caregiver.id, taskDate);
  if (workload === 0) {
    score += 30;
  } else if (workload < 3) {
    score += 20;
  } else if (workload < 5) {
    score += 10;
  }
  // มาก = 0 คะแนน
  
  // 3. ประสบการณ์ (+10 คะแนน)
  const yearsExp = parseInt(caregiver.experience) || 0;
  if (yearsExp >= 5) {
    score += 10;
  } else if (yearsExp >= 2) {
    score += 5;
  }
  
  // 4. Full-time workers ได้เปรียบ (+10 คะแนน)
  if (caregiver.employmentType === 'full-time') {
    score += 10;
  }
  
  return score;
}

/**
 * 🎯 เลือก Caregiver ที่เหมาะสมที่สุดสำหรับ Task
 */
export async function selectBestCaregiver(
  elderId: string,
  taskDate: Date,
  taskType?: string
): Promise<string | null> {
  // ดึง caregivers ทั้งหมดที่ verified สำหรับ elder นี้
  const elder = await prisma.elder.findUnique({
    where: { id: elderId },
    include: {
      caregivers: {
        where: { verified: true }
      }
    }
  });
  
  if (!elder || elder.caregivers.length === 0) {
    console.log('⚠️ No verified caregivers found for elder:', elderId);
    return null;
  }
  
  // คำนวณคะแนนสำหรับแต่ละ caregiver
  const caregiverScores = await Promise.all(
    elder.caregivers.map(async (caregiver: any) => {
      const score = await calculateSuitabilityScore(caregiver, taskDate, taskType);
      const workload = await calculateWorkload(caregiver.id, taskDate);
      
      console.log(`📊 Caregiver ${caregiver.name}: score=${score}, workload=${workload}`);
      
      return {
        caregiver,
        score,
        workload
      };
    })
  );
  
  // เรียงตามคะแนน (สูงสุดก่อน)
  caregiverScores.sort((a: any, b: any) => {
    if (b.score !== a.score) {
      return b.score - a.score; // คะแนนสูงกว่า
    }
    return a.workload - b.workload; // workload ต่ำกว่า (tie-breaker)
  });
  
  const best = caregiverScores[0];
  
  if (best && best.score > 0) {
    console.log(`🎯 Best caregiver selected: ${best.caregiver.name} (score: ${best.score})`);
    return best.caregiver.id;
  }
  
  console.log('⚠️ No suitable caregiver found for this task date');
  return null;
}

/**
 * 📋 แบ่งงานให้ caregivers หลายคน (สำหรับ recurring tasks)
 */
export async function distributeTasks(
  elderId: string,
  taskDates: Date[],
  taskTitle: string,
  taskDescription: string
): Promise<{ assigned: number; failed: number; details: any[] }> {
  const results = {
    assigned: 0,
    failed: 0,
    details: [] as any[]
  };
  
  for (const date of taskDates) {
    const caregiverId = await selectBestCaregiver(elderId, date);
    
    if (caregiverId) {
      try {
        const task = await prisma.task.create({
          data: {
            title: taskTitle,
            detail: taskDescription,
            instruction: taskDescription,
            time: '09:00', // Default time
            date: date,
            caregiverId,
            elderId,
            status: 'pending'
          }
        });
        
        results.assigned++;
        results.details.push({
          date: date.toISOString(),
          caregiverId,
          taskId: task.id,
          success: true
        });
      } catch (error: any) {
        console.error('Failed to create task:', error);
        results.failed++;
        results.details.push({
          date: date.toISOString(),
          error: error.message,
          success: false
        });
      }
    } else {
      results.failed++;
      results.details.push({
        date: date.toISOString(),
        error: 'No suitable caregiver found',
        success: false
      });
    }
  }
  
  return results;
}

/**
 * 🔄 Rebalance tasks - แบ่งงานใหม่ถ้ามีคนทำงานไม่สมดุล
 */
export async function rebalanceTasks(elderId: string, dateRange: { from: Date; to: Date }): Promise<{
  rebalanced: number;
  message: string;
}> {
  // ดึง tasks ที่ pending ในช่วงเวลาที่กำหนด
  const tasks = await prisma.task.findMany({
    where: {
      elderId,
      date: {
        gte: dateRange.from,
        lte: dateRange.to
      },
      status: 'pending'
    },
    include: {
      caregiver: true
    }
  });
  
  if (tasks.length === 0) {
    return { rebalanced: 0, message: 'No pending tasks to rebalance' };
  }
  
  // นับงานของแต่ละคน
  const workloadMap = new Map<string, number>();
  tasks.forEach((task: any) => {
    if (task.caregiverId) {
      const current = workloadMap.get(task.caregiverId) || 0;
      workloadMap.set(task.caregiverId, current + 1);
    }
  });
  
  const workloads = Array.from(workloadMap.values());
  const avgWorkload = workloads.reduce((a, b) => a + b, 0) / workloads.length;
  const maxWorkload = Math.max(...workloads);
  const minWorkload = Math.min(...workloads);
  
  // ถ้าส่วนต่างมาก (>3 tasks) ให้ rebalance
  if (maxWorkload - minWorkload <= 3) {
    return { rebalanced: 0, message: 'Workload is already balanced' };
  }
  
  console.log(`⚖️ Rebalancing tasks: max=${maxWorkload}, min=${minWorkload}, avg=${avgWorkload}`);
  
  // TODO: Implement actual rebalancing logic
  // For now, just return analysis
  return {
    rebalanced: 0,
    message: `Workload variance detected: max=${maxWorkload}, min=${minWorkload}. Manual reassignment recommended.`
  };
}
