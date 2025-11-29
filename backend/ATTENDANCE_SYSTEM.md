# 📅 ระบบเช็คชื่อเข้า-ออกงาน (Attendance System)

## ภาพรวม

ระบบ Attendance เป็นฟีเจอร์สำหรับติดตามการเข้า-ออกงานของผู้ดูแล (Caregiver) เพื่อให้ครอบครัวสามารถตรวจสอบได้ว่าผู้ดูแลมาทำงานจริงหรือไม่ มาเวลาไหน และทำงานไปกี่ชั่วโมง

## คุณสมบัติหลัก

### 1. **Check-in (ลงเวลาเข้างาน)**
- ✅ บันทึกเวลาที่ผู้ดูแลเริ่มทำงาน
- ✅ บันทึกตำแหน่ง GPS (optional)
- ✅ ถ่ายรูปยืนยันตัวตน (optional)
- ✅ ตรวจจับการมาสายอัตโนมัติ (เกิน 08:15 น.)
- ✅ ป้องกันการ check-in ซ้ำในวันเดียวกัน

### 2. **Check-out (ลงเวลาออกงาน)**
- ✅ บันทึกเวลาที่ผู้ดูแลเลิกงาน
- ✅ คำนวณชั่วโมงทำงานอัตโนมัติ
- ✅ คำนวณ OT (Overtime) เมื่อทำงานเกิน 8 ชม.
- ✅ บันทึกหมายเหตุและเหตุผล (ถ้ามี)
- ✅ ป้องกันการ check-out ก่อน check-in

### 3. **ประวัติการเข้างาน**
- ✅ ดูประวัติย้อนหลังตามเดือน/ปี
- ✅ สถิติ: วันมาทำงาน, วันมาสาย, วันขาด
- ✅ รวมชั่วโมงทำงาน และ OT รายเดือน

### 4. **สำหรับครอบครัว**
- ✅ ดูประวัติการเข้างานของผู้ดูแลแต่ละคน
- ✅ ดูรายงานสรุปรายเดือน
- ✅ ตรวจสอบความตรงต่อเวลา

## Database Schema

```prisma
model Attendance {
  id          String   @id @default(uuid())
  
  // วันที่ทำงาน
  workDate    DateTime @default(now()) @db.Date
  
  // เวลาเข้า-ออกงาน
  checkInTime  DateTime?
  checkOutTime DateTime?
  
  // ตำแหน่งที่ check-in/out (GPS)
  checkInLocation  String?
  checkOutLocation String?
  
  // สถานะ
  status      String   @default("pending") 
  // pending, present, absent, late, half-day, on-leave
  
  // ชั่วโมงทำงานจริง
  hoursWorked Float?   @default(0)
  
  // หมายเหตุ
  notes       String?  @db.Text
  lateReason  String?  @db.Text
  earlyLeaveReason String? @db.Text
  
  // รูปถ่ายตอนเข้า-ออกงาน
  checkInPhoto  String?
  checkOutPhoto String?
  
  // OT
  isOvertime  Boolean  @default(false)
  overtimeHours Float? @default(0)
  overtimeApproved Boolean @default(false)
  
  // ผู้ดูแล
  caregiverId String
  caregiver   Caregiver @relation(...)
  
  // Elder ที่ดูแล
  elderId     String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([caregiverId, workDate])
}
```

## API Endpoints

### สำหรับผู้ดูแล (Caregiver)

#### 1. Check-in (ลงเวลาเข้างาน)
```http
POST /api/caregiver/attendance/check-in
Authorization: Bearer <caregiver-token>
Content-Type: application/json

{
  "location": "13.7563,100.5018",  // optional: GPS coordinates
  "photo": "base64-image-string",   // optional: selfie
  "elderId": "elder-uuid"           // optional: ถ้าดูแลหลายคน
}
```

**Response:**
```json
{
  "message": "ลงเวลาเข้างานสำเร็จ",
  "attendance": {
    "id": "att-uuid",
    "workDate": "2025-11-29",
    "checkInTime": "2025-11-29T08:05:00.000Z",
    "status": "present"
  },
  "isLate": false
}
```

#### 2. Check-out (ลงเวลาออกงาน)
```http
POST /api/caregiver/attendance/check-out
Authorization: Bearer <caregiver-token>
Content-Type: application/json

{
  "location": "13.7563,100.5018",  // optional
  "photo": "base64-image-string",   // optional
  "notes": "งานเสร็จเรียบร้อย"      // optional
}
```

**Response:**
```json
{
  "message": "ลงเวลาออกงานสำเร็จ",
  "attendance": {
    "id": "att-uuid",
    "checkInTime": "2025-11-29T08:05:00.000Z",
    "checkOutTime": "2025-11-29T17:15:00.000Z",
    "hoursWorked": 9.17,
    "isOvertime": true,
    "overtimeHours": 1.17
  },
  "hoursWorked": 9.17,
  "overtime": 1.17
}
```

#### 3. ดูสถานะวันนี้
```http
GET /api/caregiver/attendance/today
Authorization: Bearer <caregiver-token>
```

**Response:**
```json
{
  "hasCheckedIn": true,
  "hasCheckedOut": false,
  "attendance": {
    "id": "att-uuid",
    "workDate": "2025-11-29",
    "checkInTime": "2025-11-29T08:05:00.000Z",
    "checkOutTime": null,
    "status": "present"
  }
}
```

#### 4. ดูประวัติการเข้างาน
```http
GET /api/caregiver/attendance/history?month=11&year=2025
Authorization: Bearer <caregiver-token>
```

**Response:**
```json
{
  "attendances": [
    {
      "id": "att-1",
      "workDate": "2025-11-29",
      "checkInTime": "2025-11-29T08:05:00.000Z",
      "checkOutTime": "2025-11-29T17:00:00.000Z",
      "hoursWorked": 8.92,
      "status": "present"
    }
  ],
  "summary": {
    "totalDays": 20,
    "presentDays": 18,
    "lateDays": 2,
    "absentDays": 2,
    "totalHours": 160.5,
    "totalOvertimeHours": 5.25
  }
}
```

### สำหรับครอบครัว (Family)

#### ดูประวัติผู้ดูแล
```http
GET /api/caregiver/attendance/caregiver/:caregiverId?month=11&year=2025
Authorization: Bearer <family-token>
```

## การใช้งาน

### 1. เช้าวัน - ผู้ดูแล Check-in
```javascript
// ในแอป Caregiver
const checkIn = async () => {
  const position = await getCurrentPosition(); // GPS
  const photo = await takeSelfie(); // Camera
  
  const response = await fetch('/api/caregiver/attendance/check-in', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location: `${position.coords.latitude},${position.coords.longitude}`,
      photo: photo,
      elderId: selectedElderId,
    }),
  });
  
  const data = await response.json();
  
  if (data.isLate) {
    alert('คุณมาสาย กรุณาระบุเหตุผล');
  } else {
    alert('ลงเวลาเข้างานสำเร็จ');
  }
};
```

### 2. เย็นวัน - ผู้ดูแล Check-out
```javascript
const checkOut = async () => {
  const position = await getCurrentPosition();
  
  const response = await fetch('/api/caregiver/attendance/check-out', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location: `${position.coords.latitude},${position.coords.longitude}`,
      notes: 'งานเสร็จเรียบร้อย ผู้สูงอายุทานยาครบแล้ว',
    }),
  });
  
  const data = await response.json();
  alert(`ทำงานไป ${data.hoursWorked} ชั่วโมง`);
};
```

### 3. ครอบครัวตรวจสอบ
```javascript
// ในแอป Family
const viewCaregiverAttendance = async (caregiverId) => {
  const response = await fetch(
    `/api/caregiver/attendance/caregiver/${caregiverId}?month=11&year=2025`,
    {
      headers: { 'Authorization': `Bearer ${familyToken}` },
    }
  );
  
  const data = await response.json();
  
  console.log('ผู้ดูแล:', data.caregiver.name);
  console.log('มาทำงาน:', data.attendances.length, 'วัน');
  
  data.attendances.forEach(att => {
    console.log(
      `${att.workDate}: เข้า ${att.checkInTime} - ออก ${att.checkOutTime} (${att.hoursWorked} ชม.)`
    );
  });
};
```

## Business Logic

### การตรวจจับมาสาย
```typescript
const workStartHour = 8; // งานเริ่ม 08:00
const gracePeriodMinutes = 15; // ยกเว้น 15 นาที

const isLate = 
  checkInTime.getHours() > workStartHour || 
  (checkInTime.getHours() === workStartHour && 
   checkInTime.getMinutes() > gracePeriodMinutes);
```

### การคำนวณ OT
```typescript
const standardHours = 8; // ชั่วโมงมาตรฐาน
const workDuration = (checkOutTime - checkInTime) / (1000 * 60 * 60);

if (workDuration > standardHours) {
  overtimeHours = workDuration - standardHours;
  isOvertime = true;
}
```

### Unique Constraint
- หนึ่งผู้ดูแลสามารถมี Attendance ได้เพียง 1 record ต่อวัน
- `@@unique([caregiverId, workDate])`

## Integration กับระบบอื่น

### 1. Payroll System
```typescript
// คำนวณเงินเดือนจาก Attendance
const calculateMonthlyPay = async (caregiverId, month, year) => {
  const attendances = await prisma.attendance.findMany({
    where: {
      caregiverId,
      workDate: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0),
      },
    },
  });
  
  const workingDays = attendances.filter(
    a => a.status === 'present' || a.status === 'late'
  ).length;
  
  const totalOT = attendances.reduce(
    (sum, a) => sum + (a.overtimeHours || 0), 
    0
  );
  
  // บันทึก Payroll
  await prisma.payroll.create({
    data: {
      caregiverId,
      month,
      year,
      workingDays,
      overtimeHours: totalOT,
      // ... คำนวณเงินเดือน
    },
  });
};
```

### 2. Notification System
```typescript
// แจ้งเตือนเมื่อผู้ดูแลมาสาย
if (isLate) {
  await prisma.notification.create({
    data: {
      userId: familyUserId,
      title: 'ผู้ดูแลมาสาย',
      message: `${caregiver.name} เข้างาน ${checkInTime} (สาย ${lateMinutes} นาที)`,
      type: 'warning',
      category: 'attendance',
    },
  });
}

// แจ้งเตือนเมื่อผู้ดูแลไม่มาทำงาน
// (ต้องมี Cron Job ตรวจสอบทุก 09:00)
```

## Next Steps

### ฟีเจอร์ที่ควรเพิ่ม:

1. **Face Recognition**
   - ใช้ AI ตรวจจับใบหน้าตอน check-in/out
   - ป้องกันการแอบ check-in ให้กัน

2. **Geofencing**
   - กำหนดพื้นที่ที่สามารถ check-in ได้
   - แจ้งเตือนถ้า check-in นอกพื้นที่

3. **Auto Check-out**
   - ถ้าผู้ดูแลลืม check-out
   - ระบบจะ auto check-out ตามเวลากำหนด

4. **Leave Request Integration**
   - ถ้าผู้ดูแลลาล่วงหน้า
   - ระบบจะไม่นับเป็นขาดงาน

5. **Shift Management**
   - รองรับกะทำงานหลายช่วงเวลา
   - Part-time, Full-time, Flexible

## สรุป

ระบบ Attendance ช่วยให้:
- ✅ ครอบครัวมั่นใจว่าผู้ดูแลมาทำงานจริง
- ✅ คำนวณเงินเดือนได้แม่นยำตามชั่วโมงจริง
- ✅ ตรวจสอบความตรงต่อเวลา
- ✅ มีหลักฐานการทำงานครบถ้วน
- ✅ จัดการ OT ได้โปร่งใส

---

**เอกสารนี้อธิบายระบบ Attendance ที่ช่วยติดตามการเข้า-ออกงานของผู้ดูแล**
