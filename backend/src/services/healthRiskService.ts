import prisma from '../lib/prisma';

/**
 * Health Risk Score Calculation Service
 * คำนวณคะแนนความเสี่ยงสุขภาพ 0-100
 * - 0-30: ดี (Green)
 * - 31-60: ปานกลาง (Yellow)
 * - 61-100: เสี่ยงสูง (Red)
 */

export interface HealthRiskScore {
  score: number;           // 0-100
  level: 'good' | 'moderate' | 'high';
  color: 'green' | 'yellow' | 'red';
  factors: {
    name: string;
    score: number;
    reason: string;
  }[];
  recommendations: string[];
}

/**
 * คำนวณคะแนนความเสี่ยงสุขภาพ
 */
export async function calculateHealthRiskScore(elderId: string): Promise<HealthRiskScore> {
  const factors: { name: string; score: number; reason: string }[] = [];
  const recommendations: string[] = [];
  
  // 1️⃣ ตรวจสอบ SOS ล่าสุด (7 วัน)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sosCount = await prisma.notification.count({
    where: {
      user: {
        elders: {
          some: { id: elderId }
        }
      },
      type: 'sos',
      createdAt: { gte: sevenDaysAgo }
    }
  });
  
  if (sosCount > 0) {
    const sosScore = Math.min(sosCount * 15, 30); // สูงสุด 30 คะแนน
    factors.push({
      name: 'การแจ้งเหตุฉุกเฉิน',
      score: sosScore,
      reason: `มีการแจ้ง SOS ${sosCount} ครั้งใน 7 วัน`
    });
    recommendations.push('ติดตามอาการอย่างใกล้ชิด');
    recommendations.push('พิจารณาปรึกษาแพทย์');
  }
  
  // 2️⃣ ตรวจสอบความดันโลหิต (3 วันล่าสุด)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const recentVitals = await prisma.healthRecord.findMany({
    where: {
      elderId,
      type: 'vital-sign',
      recordedAt: { gte: threeDaysAgo },
      OR: [
        { systolic: { not: null } },
        { diastolic: { not: null } }
      ]
    },
    orderBy: { recordedAt: 'desc' },
    take: 5
  });
  
  const highBpCount = recentVitals.filter(v => 
    (v.systolic && v.systolic > 140) || (v.diastolic && v.diastolic > 90)
  ).length;
  
  if (highBpCount > 0) {
    const bpScore = Math.min(highBpCount * 10, 25); // สูงสุด 25 คะแนน
    factors.push({
      name: 'ความดันโลหิตสูง',
      score: bpScore,
      reason: `ความดันสูง ${highBpCount} ครั้งใน 3 วัน`
    });
    recommendations.push('ควบคุมความดันโลหิต');
    recommendations.push('ลดการบริโภคเกลือ');
  }
  
  // 3️⃣ ตรวจสอบการพลาดกินยา (7 วัน)
  const missedMeds = await prisma.medicationIntake.count({
    where: {
      medication: { elderId },
      status: 'missed',
      scheduledTime: { gte: sevenDaysAgo }
    }
  });
  
  if (missedMeds > 0) {
    const medScore = Math.min(missedMeds * 5, 20); // สูงสุด 20 คะแนน
    factors.push({
      name: 'การพลาดกินยา',
      score: medScore,
      reason: `พลาดกินยา ${missedMeds} ครั้งใน 7 วัน`
    });
    recommendations.push('ตั้งเตือนกินยา');
    recommendations.push('ตรวจสอบสาเหตุการพลาดยา');
  }
  
  // 4️⃣ ตรวจสอบอารมณ์ (7 วัน)
  const negativeMoods = await prisma.mood.count({
    where: {
      elderId,
      recordedAt: { gte: sevenDaysAgo },
      mood: { in: ['หงุดหงิด', 'ซึม', 'นอนไม่หลับ'] }
    }
  });
  
  if (negativeMoods > 3) {
    const moodScore = Math.min((negativeMoods - 3) * 3, 15); // สูงสุด 15 คะแนน
    factors.push({
      name: 'อารมณ์ไม่แจ่มใส',
      score: moodScore,
      reason: `มีอารมณ์เชิงลบ ${negativeMoods} ครั้งใน 7 วัน`
    });
    recommendations.push('ให้กำลังใจและพูดคุย');
    recommendations.push('จัดกิจกรรมที่ชอบ');
  }
  
  // 5️⃣ ตรวจสอบการบันทึกสุขภาพ
  const healthRecordsCount = await prisma.healthRecord.count({
    where: {
      elderId,
      recordedAt: { gte: sevenDaysAgo }
    }
  });
  
  if (healthRecordsCount === 0) {
    factors.push({
      name: 'ไม่มีบันทึกสุขภาพ',
      score: 10,
      reason: 'ไม่มีการบันทึกสุขภาพใน 7 วัน'
    });
    recommendations.push('บันทึกสุขภาพอย่างสม่ำเสมอ');
  }
  
  // 6️⃣ ตรวจสอบอายุ (คนสูงอายุมีความเสี่ยงมากขึ้น)
  const elder = await prisma.elder.findUnique({
    where: { id: elderId },
    select: { age: true }
  });
  
  if (elder && elder.age >= 80) {
    factors.push({
      name: 'อายุสูง',
      score: 10,
      reason: `อายุ ${elder.age} ปี`
    });
    recommendations.push('เฝ้าระวังสุขภาพอย่างใกล้ชิด');
  }
  
  // คำนวณคะแนนรวม
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  
  // กำหนดระดับความเสี่ยง
  let level: 'good' | 'moderate' | 'high';
  let color: 'green' | 'yellow' | 'red';
  
  if (totalScore <= 30) {
    level = 'good';
    color = 'green';
  } else if (totalScore <= 60) {
    level = 'moderate';
    color = 'yellow';
  } else {
    level = 'high';
    color = 'red';
  }
  
  // เพิ่มคำแนะนำตามระดับ
  if (level === 'high') {
    recommendations.unshift('⚠️ ควรพบแพทย์โดยเร็ว');
  } else if (level === 'moderate') {
    recommendations.unshift('ติดตามอาการอย่างใกล้ชิด');
  } else {
    recommendations.unshift('✅ สุขภาพดี รักษาต่อไป');
  }
  
  return {
    score: Math.min(totalScore, 100),
    level,
    color,
    factors,
    recommendations
  };
}

/**
 * คำนวณ Medication Compliance (% การกินยาตรงเวลา)
 */
export async function calculateMedicationCompliance(
  elderId: string,
  days: number = 7
): Promise<number> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const totalIntakes = await prisma.medicationIntake.count({
    where: {
      medication: { elderId },
      scheduledTime: { gte: startDate }
    }
  });
  
  const takenIntakes = await prisma.medicationIntake.count({
    where: {
      medication: { elderId },
      scheduledTime: { gte: startDate },
      status: 'taken'
    }
  });
  
  if (totalIntakes === 0) return 100;
  
  return Math.round((takenIntakes / totalIntakes) * 100);
}

/**
 * วิเคราะห์แนวโน้มความดันโลหิต
 */
export async function analyzeBloodPressureTrend(
  elderId: string,
  days: number = 30
): Promise<{
  trend: 'improving' | 'stable' | 'worsening';
  average: { systolic: number; diastolic: number };
  readings: number;
}> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const vitals = await prisma.healthRecord.findMany({
    where: {
      elderId,
      type: 'vital-sign',
      recordedAt: { gte: startDate },
      systolic: { not: null },
      diastolic: { not: null }
    },
    orderBy: { recordedAt: 'asc' },
    select: {
      systolic: true,
      diastolic: true,
      recordedAt: true
    }
  });
  
  if (vitals.length === 0) {
    return {
      trend: 'stable',
      average: { systolic: 0, diastolic: 0 },
      readings: 0
    };
  }
  
  // คำนวณค่าเฉลี่ย
  const avgSystolic = vitals.reduce((sum, v) => sum + (v.systolic || 0), 0) / vitals.length;
  const avgDiastolic = vitals.reduce((sum, v) => sum + (v.diastolic || 0), 0) / vitals.length;
  
  // วิเคราะห์แนวโน้ม (เปรียบเทียบครึ่งแรกกับครึ่งหลัง)
  const half = Math.floor(vitals.length / 2);
  const firstHalfAvg = vitals.slice(0, half).reduce((sum, v) => sum + (v.systolic || 0), 0) / half;
  const secondHalfAvg = vitals.slice(half).reduce((sum, v) => sum + (v.systolic || 0), 0) / (vitals.length - half);
  
  let trend: 'improving' | 'stable' | 'worsening';
  const diff = secondHalfAvg - firstHalfAvg;
  
  if (diff < -5) trend = 'improving';      // ลดลงมากกว่า 5
  else if (diff > 5) trend = 'worsening';  // เพิ่มขึ้นมากกว่า 5
  else trend = 'stable';                   // คงที่
  
  return {
    trend,
    average: {
      systolic: Math.round(avgSystolic),
      diastolic: Math.round(avgDiastolic)
    },
    readings: vitals.length
  };
}
