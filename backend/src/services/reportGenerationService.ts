import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * 📊 Weekly Report Generation Service
 * 
 * สร้างรายงานสรุปประจำสัปดาห์สำหรับครอบครัว
 * รวมข้อมูล: กิจกรรม, สุขภาพ, ยา, อารมณ์, ค่าใช้จ่าย
 */

interface WeeklyReportData {
  elder: {
    name: string;
    age: number;
  };
  period: {
    start: Date;
    end: Date;
  };
  activities: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
    topActivities: { title: string; count: number }[];
  };
  health: {
    totalRecords: number;
    avgBloodPressure: { systolic: number; diastolic: number } | null;
    avgHeartRate: number | null;
    avgTemperature: number | null;
    alertCount: number;
  };
  medications: {
    compliance: number; // percentage
    totalIntakes: number;
    takenOnTime: number;
    missed: number;
    lowStockAlerts: string[];
  };
  moods: {
    distribution: { [key: string]: number };
    averageScore: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  expenses: {
    total: number;
    byCategory: { category: string; amount: number }[];
    topExpenses: { description: string; amount: number; date: Date }[];
  };
  highlights: string[];
  concerns: string[];
}

/**
 * รวบรวมข้อมูลสำหรับรายงานประจำสัปดาห์
 */
export async function generateWeeklyReportData(
  elderId: string,
  weekStart?: Date
): Promise<WeeklyReportData> {
  // คำนวณช่วงวันที่ (7 วันล่าสุด)
  const endDate = weekStart ? new Date(weekStart) : new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  console.log(`📊 Generating report for ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);

  // ดึงข้อมูล Elder
  const elder = await prisma.elder.findUnique({
    where: { id: elderId },
    select: { name: true, age: true }
  });

  if (!elder) {
    throw new Error('Elder not found');
  }

  // 1. กิจกรรม
  const activities = await prisma.activity.findMany({
    where: {
      elderId,
      date: { gte: startDate, lte: endDate }
    }
  });

  // นับ tasks ที่เสร็จสำหรับแต่ละกิจกรรม
  const completedActivitiesCount = await prisma.task.count({
    where: {
      elderId,
      date: { gte: startDate, lte: endDate },
      status: 'completed'
    }
  });

  const activityStats = {
    total: activities.length,
    completed: activities.filter(a => a.completed).length,
    pending: activities.filter(a => !a.completed).length,
    completionRate: 0,
    topActivities: [] as { title: string; count: number }[]
  };

  if (activityStats.total > 0) {
    activityStats.completionRate = Math.round(
      (activityStats.completed / activityStats.total) * 100
    );
  }

  // นับ top activities
  const activityCounts = activities.reduce((acc, a) => {
    acc[a.title] = (acc[a.title] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  activityStats.topActivities = Object.entries(activityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count]) => ({ title, count }));

  // 2. สุขภาพ
  const healthRecords = await prisma.healthRecord.findMany({
    where: {
      elderId,
      recordedAt: { gte: startDate, lte: endDate }
    }
  });

  const healthStats = {
    totalRecords: healthRecords.length,
    avgBloodPressure: null as { systolic: number; diastolic: number } | null,
    avgHeartRate: null as number | null,
    avgTemperature: null as number | null,
    alertCount: 0
  };

  if (healthRecords.length > 0) {
    const bpRecords = healthRecords.filter(h => h.systolic && h.diastolic);
    if (bpRecords.length > 0) {
      healthStats.avgBloodPressure = {
        systolic: Math.round(
          bpRecords.reduce((sum, h) => sum + (h.systolic || 0), 0) / bpRecords.length
        ),
        diastolic: Math.round(
          bpRecords.reduce((sum, h) => sum + (h.diastolic || 0), 0) / bpRecords.length
        )
      };
    }

    const hrRecords = healthRecords.filter(h => h.heartRate);
    if (hrRecords.length > 0) {
      healthStats.avgHeartRate = Math.round(
        hrRecords.reduce((sum, h) => sum + (h.heartRate || 0), 0) / hrRecords.length
      );
    }

    const tempRecords = healthRecords.filter(h => h.temperature);
    if (tempRecords.length > 0) {
      healthStats.avgTemperature = parseFloat(
        (tempRecords.reduce((sum, h) => sum + (h.temperature || 0), 0) / tempRecords.length).toFixed(1)
      );
    }

    // นับ alerts (BP > 140/90 or HR > 100 or Temp > 37.5)
    healthStats.alertCount = healthRecords.filter(h =>
      (h.systolic && h.systolic > 140) ||
      (h.heartRate && h.heartRate > 100) ||
      (h.temperature && h.temperature > 37.5)
    ).length;
  }

  // 3. การทานยา
  const medicationIntakes = await (prisma as any).medicationIntake.findMany({
    where: {
      medication: { elderId },
      scheduledTime: { gte: startDate, lte: endDate }
    },
    include: {
      medication: true
    }
  });

  const medicationStats = {
    compliance: 0,
    totalIntakes: medicationIntakes.length,
    takenOnTime: medicationIntakes.filter((i: any) => i.status === 'taken').length,
    missed: medicationIntakes.filter((i: any) => i.status === 'missed').length,
    lowStockAlerts: [] as string[]
  };

  if (medicationStats.totalIntakes > 0) {
    medicationStats.compliance = Math.round(
      (medicationStats.takenOnTime / medicationStats.totalIntakes) * 100
    );
  }

  // ตรวจสอบยาที่ใกล้หมด
  const medications = await prisma.medication.findMany({
    where: {
      elderId,
      isActive: true
    }
  });

  medicationStats.lowStockAlerts = medications
    .filter((m: any) => m.currentStock !== null && m.minStock !== null && m.currentStock <= m.minStock)
    .map((m: any) => `${m.name} (เหลือ ${m.currentStock} ${m.unit || 'เม็ด'})`);
  // 4. อารมณ์
  const moods = await prisma.mood.findMany({
    where: {
      elderId,
      recordedAt: { gte: startDate, lte: endDate }
    }
  });

  const moodStats = {
    distribution: {} as { [key: string]: number },
    averageScore: 0,
    trend: 'stable' as 'improving' | 'stable' | 'declining'
  };

  if (moods.length > 0) {
    // นับแต่ละประเภท
    moods.forEach(m => {
      moodStats.distribution[m.mood] = (moodStats.distribution[m.mood] || 0) + 1;
    });

    // คำนวณคะแนนเฉลี่ย (happy=5, calm=4, neutral=3, sad=2, anxious=1, angry=1)
    const moodScores: { [key: string]: number } = {
      'happy': 5,
      'calm': 4,
      'ปกติ': 3,
      'neutral': 3,
      'sad': 2,
      'anxious': 1,
      'angry': 1
    };

    moodStats.averageScore = parseFloat(
      (moods.reduce((sum, m) => sum + (moodScores[m.mood] || 3), 0) / moods.length).toFixed(1)
    );

    // หา trend (เปรียบเทียบครึ่งแรก vs ครึ่งหลัง)
    const midPoint = Math.floor(moods.length / 2);
    const firstHalf = moods.slice(0, midPoint);
    const secondHalf = moods.slice(midPoint);

    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, m) => sum + (moodScores[m.mood] || 3), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + (moodScores[m.mood] || 3), 0) / secondHalf.length;

      if (secondAvg > firstAvg + 0.5) {
        moodStats.trend = 'improving';
      } else if (secondAvg < firstAvg - 0.5) {
        moodStats.trend = 'declining';
      }
    }
  }

  // 5. ค่าใช้จ่าย (ถ้ามี Expense model)
  let expenses: any[] = [];
  try {
    expenses = await (prisma as any).expense.findMany({
      where: {
        elderId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { amount: 'desc' }
    });
  } catch (error) {
    console.log('⚠️ Expense model not found, skipping expense stats');
  }

  const expenseStats = {
    total: expenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount.toString()), 0),
    byCategory: [] as { category: string; amount: number }[],
    topExpenses: expenses.slice(0, 5).map((e: any) => ({
      description: e.description,
      amount: parseFloat(e.amount.toString()),
      date: e.date
    }))
  };

  // จัดกลุ่มตามหมวดหมู่
  const categoryMap = expenses.reduce((acc: any, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount.toString());
    return acc;
  }, {} as { [key: string]: number });

  expenseStats.byCategory = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount: amount as number }))
    .sort((a, b) => b.amount - a.amount);

  // 6. Highlights & Concerns
  const highlights: string[] = [];
  const concerns: string[] = [];

  // Highlights
  if (activityStats.completionRate >= 80) {
    highlights.push(`✅ ทำกิจกรรมได้ครบ ${activityStats.completionRate}%`);
  }
  if (medicationStats.compliance >= 90) {
    highlights.push(`💊 ทานยาตรงเวลา ${medicationStats.compliance}%`);
  }
  if (moodStats.trend === 'improving') {
    highlights.push('😊 อารมณ์ดีขึ้นเรื่อยๆ');
  }
  if (healthStats.alertCount === 0) {
    highlights.push('❤️ ค่าสุขภาพอยู่ในเกณฑ์ปกติทุกครั้ง');
  }

  // Concerns
  if (healthStats.alertCount > 3) {
    concerns.push(`⚠️ ค่าสุขภาพผิดปกติ ${healthStats.alertCount} ครั้ง`);
  }
  if (medicationStats.missed > 2) {
    concerns.push(`⚠️ พลาดทานยา ${medicationStats.missed} ครั้ง`);
  }
  if (medicationStats.lowStockAlerts.length > 0) {
    concerns.push(`⚠️ ยาใกล้หมด: ${medicationStats.lowStockAlerts.join(', ')}`);
  }
  if (moodStats.trend === 'declining') {
    concerns.push('😟 อารมณ์ดูแย่ลงในช่วงนี้');
  }

  return {
    elder: { name: elder.name, age: elder.age },
    period: { start: startDate, end: endDate },
    activities: activityStats,
    health: healthStats,
    medications: medicationStats,
    moods: moodStats,
    expenses: expenseStats,
    highlights,
    concerns
  };
}

/**
 * สร้าง PDF รายงานประจำสัปดาห์
 */
export async function generateWeeklyReportPDF(
  reportData: WeeklyReportData,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('รายงานสรุปประจำสัปดาห์', { align: 'center' });
    doc.fontSize(14).text(`ผู้สูงอายุ: ${reportData.elder.name} (อายุ ${reportData.elder.age} ปี)`, { align: 'center' });
    doc.fontSize(12).text(
      `ช่วงเวลา: ${reportData.period.start.toLocaleDateString('th-TH')} - ${reportData.period.end.toLocaleDateString('th-TH')}`,
      { align: 'center' }
    );
    doc.moveDown();

    // Highlights
    if (reportData.highlights.length > 0) {
      doc.fontSize(16).fillColor('green').text('✨ ไฮไลท์', { underline: true });
      doc.fontSize(12).fillColor('black');
      reportData.highlights.forEach(h => doc.text(`  ${h}`));
      doc.moveDown();
    }

    // Concerns
    if (reportData.concerns.length > 0) {
      doc.fontSize(16).fillColor('red').text('⚠️ ข้อควรระวัง', { underline: true });
      doc.fontSize(12).fillColor('black');
      reportData.concerns.forEach(c => doc.text(`  ${c}`));
      doc.moveDown();
    }

    // Activities
    doc.fontSize(14).fillColor('blue').text('📋 กิจกรรม', { underline: true });
    doc.fontSize(12).fillColor('black');
    doc.text(`  ทั้งหมด: ${reportData.activities.total} กิจกรรม`);
    doc.text(`  ทำสำเร็จ: ${reportData.activities.completed} (${reportData.activities.completionRate}%)`);
    if (reportData.activities.topActivities.length > 0) {
      doc.text('  กิจกรรมยอดนิยม:');
      reportData.activities.topActivities.forEach(a => doc.text(`    - ${a.title} (${a.count} ครั้ง)`));
    }
    doc.moveDown();

    // Health
    doc.fontSize(14).fillColor('blue').text('❤️ สุขภาพ', { underline: true });
    doc.fontSize(12).fillColor('black');
    doc.text(`  บันทึกสุขภาพ: ${reportData.health.totalRecords} ครั้ง`);
    if (reportData.health.avgBloodPressure) {
      doc.text(`  ค่าเฉลี่ยความดัน: ${reportData.health.avgBloodPressure.systolic}/${reportData.health.avgBloodPressure.diastolic} mmHg`);
    }
    if (reportData.health.avgHeartRate) {
      doc.text(`  ค่าเฉลี่ยชีพจร: ${reportData.health.avgHeartRate} bpm`);
    }
    if (reportData.health.avgTemperature) {
      doc.text(`  ค่าเฉลี่ยอุณหภูมิ: ${reportData.health.avgTemperature}°C`);
    }
    doc.text(`  ค่าผิดปกติ: ${reportData.health.alertCount} ครั้ง`);
    doc.moveDown();

    // Medications
    doc.fontSize(14).fillColor('blue').text('💊 การทานยา', { underline: true });
    doc.fontSize(12).fillColor('black');
    doc.text(`  ทานตรงเวลา: ${reportData.medications.takenOnTime}/${reportData.medications.totalIntakes} (${reportData.medications.compliance}%)`);
    doc.text(`  พลาด: ${reportData.medications.missed} ครั้ง`);
    if (reportData.medications.lowStockAlerts.length > 0) {
      doc.text('  ยาใกล้หมด:');
      reportData.medications.lowStockAlerts.forEach(alert => doc.text(`    - ${alert}`));
    }
    doc.moveDown();

    // Moods
    doc.fontSize(14).fillColor('blue').text('😊 อารมณ์', { underline: true });
    doc.fontSize(12).fillColor('black');
    doc.text(`  คะแนนเฉลี่ย: ${reportData.moods.averageScore}/5`);
    doc.text(`  แนวโน้ม: ${reportData.moods.trend === 'improving' ? '📈 ดีขึ้น' : reportData.moods.trend === 'declining' ? '📉 แย่ลง' : '➡️ คงที่'}`);
    if (Object.keys(reportData.moods.distribution).length > 0) {
      doc.text('  การกระจาย:');
      Object.entries(reportData.moods.distribution).forEach(([type, count]) => {
        doc.text(`    - ${type}: ${count} ครั้ง`);
      });
    }
    doc.moveDown();

    // Expenses
    doc.fontSize(14).fillColor('blue').text('💰 ค่าใช้จ่าย', { underline: true });
    doc.fontSize(12).fillColor('black');
    doc.text(`  ยอดรวม: ${reportData.expenses.total.toLocaleString('th-TH')} บาท`);
    if (reportData.expenses.byCategory.length > 0) {
      doc.text('  แบ่งตามหมวดหมู่:');
      reportData.expenses.byCategory.forEach(cat => {
        doc.text(`    - ${cat.category}: ${cat.amount.toLocaleString('th-TH')} บาท`);
      });
    }
    doc.moveDown();

    // Footer
    doc.fontSize(10).fillColor('gray').text(
      `สร้างโดย CareLink Family | ${new Date().toLocaleString('th-TH')}`,
      { align: 'center' }
    );

    doc.end();

    stream.on('finish', () => {
      console.log('✅ PDF report generated:', outputPath);
      resolve(outputPath);
    });

    stream.on('error', reject);
  });
}

/**
 * สร้าง HTML รายงาน (สำหรับส่งอีเมล)
 */
export function generateWeeklyReportHTML(reportData: WeeklyReportData): string {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงานประจำสัปดาห์</title>
  <style>
    body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #9333ea; text-align: center; }
    h2 { color: #7e22ce; border-bottom: 2px solid #9333ea; padding-bottom: 5px; }
    .period { text-align: center; color: #666; margin-bottom: 20px; }
    .highlight { background: #d1fae5; padding: 10px; border-left: 4px solid #10b981; margin: 10px 0; }
    .concern { background: #fee2e2; padding: 10px; border-left: 4px solid #ef4444; margin: 10px 0; }
    .stat { margin: 10px 0; }
    .progress { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 5px 0; }
    .progress-bar { background: #9333ea; height: 100%; text-align: center; color: white; font-size: 12px; line-height: 20px; }
    .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📊 รายงานสรุปประจำสัปดาห์</h1>
  <div class="period">
    <strong>${reportData.elder.name}</strong> (อายุ ${reportData.elder.age} ปี)<br>
    ${reportData.period.start.toLocaleDateString('th-TH')} - ${reportData.period.end.toLocaleDateString('th-TH')}
  </div>

  ${reportData.highlights.length > 0 ? `
    <h2>✨ ไฮไลท์</h2>
    ${reportData.highlights.map(h => `<div class="highlight">${h}</div>`).join('')}
  ` : ''}

  ${reportData.concerns.length > 0 ? `
    <h2>⚠️ ข้อควรระวัง</h2>
    ${reportData.concerns.map(c => `<div class="concern">${c}</div>`).join('')}
  ` : ''}

  <h2>📋 กิจกรรม</h2>
  <div class="stat">ทั้งหมด: <strong>${reportData.activities.total}</strong> กิจกรรม</div>
  <div class="stat">ทำสำเร็จ: <strong>${reportData.activities.completed}</strong> (${reportData.activities.completionRate}%)</div>
  <div class="progress">
    <div class="progress-bar" style="width: ${reportData.activities.completionRate}%">${reportData.activities.completionRate}%</div>
  </div>

  <h2>❤️ สุขภาพ</h2>
  <div class="stat">บันทึกสุขภาพ: <strong>${reportData.health.totalRecords}</strong> ครั้ง</div>
  ${reportData.health.avgBloodPressure ? `
    <div class="stat">ความดันเฉลี่ย: <strong>${reportData.health.avgBloodPressure.systolic}/${reportData.health.avgBloodPressure.diastolic}</strong> mmHg</div>
  ` : ''}
  ${reportData.health.avgHeartRate ? `
    <div class="stat">ชีพจรเฉลี่ย: <strong>${reportData.health.avgHeartRate}</strong> bpm</div>
  ` : ''}
  <div class="stat">ค่าผิดปกติ: <strong>${reportData.health.alertCount}</strong> ครั้ง</div>

  <h2>💊 การทานยา</h2>
  <div class="stat">ทานตรงเวลา: <strong>${reportData.medications.takenOnTime}/${reportData.medications.totalIntakes}</strong> (${reportData.medications.compliance}%)</div>
  <div class="progress">
    <div class="progress-bar" style="width: ${reportData.medications.compliance}%">${reportData.medications.compliance}%</div>
  </div>
  <div class="stat">พลาด: <strong>${reportData.medications.missed}</strong> ครั้ง</div>

  <h2>😊 อารมณ์</h2>
  <div class="stat">คะแนนเฉลี่ย: <strong>${reportData.moods.averageScore}/5</strong></div>
  <div class="stat">แนวโน้ม: ${reportData.moods.trend === 'improving' ? '📈 ดีขึ้น' : reportData.moods.trend === 'declining' ? '📉 แย่ลง' : '➡️ คงที่'}</div>

  <h2>💰 ค่าใช้จ่าย</h2>
  <div class="stat">ยอดรวม: <strong>${reportData.expenses.total.toLocaleString('th-TH')}</strong> บาท</div>
  ${reportData.expenses.byCategory.length > 0 ? `
    <ul>
      ${reportData.expenses.byCategory.map(cat => `<li>${cat.category}: ${cat.amount.toLocaleString('th-TH')} บาท</li>`).join('')}
    </ul>
  ` : ''}

  <div class="footer">
    สร้างโดย CareLink Family | ${new Date().toLocaleString('th-TH')}
  </div>
</body>
</html>
  `.trim();
}
