# 🗄️ CareLink Database Schema Documentation

ออกแบบฐานข้อมูลครอบคลุมทุกฟีเจอร์ในระบบ CareLink

---

## 📋 ภาพรวมโครงสร้าง

### **จำนวน Tables: 19 ตาราง**

| กลุ่ม | Tables | จำนวน |
|-------|--------|-------|
| 🔐 Authentication | FamilyUser, Caregiver, Session | 3 |
| 👴 Elder Management | Elder | 1 |
| 💰 Financial | Bill, Payroll | 2 |
| 📅 Activities & Tasks | Activity, Task, Appointment | 3 |
| 🏥 Health & Medical | HealthRecord, VitalSign, Medication, Mood | 4 |
| 📝 Reporting | DailyReport, Notification | 2 |
| ⭐ Reviews | CaregiverReview | 1 |
| 🏖️ HR | LeaveRequest | 1 |
| 🔒 Security | Session | 1 |

---

## 🔐 1. Authentication & User Management

### **FamilyUser** (ลูกหลาน)
```prisma
- ข้อมูลพื้นฐาน: email, password, name, phone, avatar
- การตั้งค่า: preferences (JSON)
- Tracking: lastLoginAt
- Relations: elders[], notifications[], sessions[]
```

**ฟีเจอร์:**
- ✅ Login/Register
- ✅ Multiple elders per user
- ✅ Notification preferences
- ✅ Avatar upload
- ✅ Session tracking

---

### **Caregiver** (ผู้ดูแล)
```prisma
ข้อมูลส่วนตัว:
- name, phone, email, password
- idCard, dateOfBirth, gender
- address (full: subDistrict, district, province, postalCode)

ผู้ติดต่อฉุกเฉิน:
- emergencyName, emergencyContact, emergencyRelation

ข้อมูลวิชาชีพ:
- experience, certificate
- specializations[] (ความเชี่ยวชาญ)
- languages[] (ภาษาที่พูดได้)

การจ้างงาน:
- salary (Decimal), salaryType (monthly/daily/hourly)
- workSchedule, employmentType (full-time/part-time)
- contractStartDate, contractEndDate

เอกสาร:
- idCardImage, certificateImage, photoUrl

ระบบจับคู่:
- pairingCode (6 หลัก unique)
- elderId (1 caregiver : 1 elder)

สถานะ:
- verified, isActive, rating (0-5)
- lastActiveAt
```

**ฟีเจอร์:**
- ✅ Pairing system
- ✅ Professional credentials
- ✅ Contract management
- ✅ Rating system
- ✅ Multiple specializations
- ✅ Document verification

---

## 👴 2. Elder Management

### **Elder** (ผู้สูงอายุ)
```prisma
ข้อมูลพื้นฐาน:
- name, age, dateOfBirth, gender
- relation (ยาย, ตา, ปู่, ย่า)
- profileColor, photoUrl

ข้อมูลสุขภาพ:
- bloodType
- allergies[] (ภูมิแพ้)
- chronicDiseases[] (โรคประจำตัว)
- currentMedications[] (ยาที่ทาน)
- medicalNotes

ที่อยู่ & ติดต่อ:
- phone, address
- emergencyContact, emergencyPhone

ประกันสุขภาพ:
- insuranceProvider, insuranceNumber

Relations:
- familyUser (เจ้าของ)
- caregiver (ผู้ดูแลคนปัจจุบัน)
- bills[], activities[], appointments[]
- healthRecords[], medications[], vitalSigns[]
```

**ฟีเจอร์:**
- ✅ Complete medical history
- ✅ Allergy tracking
- ✅ Insurance information
- ✅ Emergency contacts
- ✅ Photo profile

---

## 💰 3. Financial Management

### **Bill** (รายรับ-รายจ่าย)
```prisma
รายละเอียด:
- description, amount (Decimal)
- date, isPaid, paidAt
- category (medical, food, caregiver, supplies, transport, other)
- subcategory (รายละเอียดเพิ่มเติม)

ผู้เพิ่มข้อมูล:
- addedBy ("caregiver" | "family")
- addedByName, addedById

หลักฐาน:
- receiptUrl (รูปใบเสร็จ)
- notes

งบประมาณ:
- budgetCategory (ติดตามงบประมาณ)
```

**ฟีเจอร์:**
- ✅ ทั้ง Family และ Caregiver เพิ่มได้
- ✅ Receipt upload
- ✅ Budget tracking
- ✅ Payment status
- ✅ Category & subcategory

---

### **Payroll** (เงินเดือนผู้ดูแล)
```prisma
รอบเงินเดือน:
- month, year
- caregiverId

รายละเอียดเงินเดือน:
- baseSalary, bonus, deductions
- netSalary (เงินสุทธิ)

การจ่าย:
- isPaid, paidAt
- paymentMethod (bank_transfer, cash, check)

การทำงาน:
- workingDays, absentDays
- overtimeHours
```

**ฟีเจอร์:**
- ✅ Monthly payroll
- ✅ Bonus & deductions
- ✅ Overtime calculation
- ✅ Multiple payment methods
- ✅ Attendance tracking

---

## 📅 4. Activities & Task Management

### **Activity** (กิจกรรมผู้สูงอายุ)
```prisma
รายละเอียด:
- title, description
- time, date
- completed, completedAt

การทำซ้ำ:
- isRecurring, recurrence (daily, weekly, monthly)

ลำดับความสำคัญ:
- priority (low, normal, high)
- category (exercise, medication, meal, appointment)
```

**ฟีเจอร์:**
- ✅ Recurring activities
- ✅ Priority levels
- ✅ Categorization
- ✅ Completion tracking

---

### **Task** (งานผู้ดูแล)
```prisma
รายละเอียด:
- title, detail, instruction
- time, date
- status (done, pending, skipped)

ความสำคัญ:
- priority (low, normal, high, urgent)
- category (meal, medication, exercise, hygiene, other)

การทำงาน:
- completedAt, photoUrl (รูปหลักฐาน)
- notes (บันทึกเพิ่มเติม)

การทำซ้ำ:
- isRecurring, recurrence (daily, weekly)
```

**ฟีเจอร์:**
- ✅ Photo proof
- ✅ Detailed instructions
- ✅ Priority & category
- ✅ Recurring tasks
- ✅ Skip option

---

### **Appointment** (นัดหมาย)
```prisma
รายละเอียด:
- title, date, time, duration
- type (doctor, checkup, therapy, vaccination, other)
- location, address
- doctorName, specialty

เตรียมตัว:
- preparation (สิ่งที่ต้องเตรียม)
- notes

การแจ้งเตือน:
- reminder, reminderTime (ชั่วโมงก่อนนัด)

สถานะ:
- status (scheduled, completed, cancelled, rescheduled)
- completedAt, cancelledAt, cancelReason

Follow-up:
- isFollowUp, previousAppointmentId
```

**ฟีเจอร์:**
- ✅ Multiple reminder times
- ✅ Doctor information
- ✅ Preparation checklist
- ✅ Follow-up tracking
- ✅ Cancellation reason

---

## 🏥 5. Health & Medical Records

### **HealthRecord** (บันทึกสุขภาพ)
```prisma
ประเภท:
- type (vital-sign, observation, incident, checkup)

Vital Signs:
- systolic, diastolic, heartRate
- temperature, oxygenLevel, bloodSugar, weight

การสังเกต:
- observation, symptoms[]
- notes, severity (normal, concern, urgent)

หลักฐาน:
- photoUrls[] (รูปประกอบ)
```

**ฟีเจอร์:**
- ✅ Multiple vital signs in one record
- ✅ Symptom tracking
- ✅ Severity levels
- ✅ Photo attachments
- ✅ Observer tracking (caregiver)

---

### **VitalSign** (สัญญาณชีพ - แยกตาราง)
```prisma
ค่าต่างๆ:
- systolic, diastolic, heartRate
- temperature, oxygenLevel
- bloodSugar, weight, height

การวัด:
- measuredAt, notes
```

**ฟีเจอร์:**
- ✅ Separate vital signs tracking
- ✅ Historical data for charts
- ✅ Easy to query for trends

---

### **Medication** (ยาประจำตัว)
```prisma
รายละเอียดยา:
- name, dosage (ขนาด)
- frequency (ความถี่)
- timing[] (เวลาที่ทาน)

คำแนะนำ:
- instructions, sideEffects

กำหนดการ:
- startDate, endDate
- isActive

ใบสั่งยา:
- prescribedBy (หมอผู้สั่ง)
- prescription (URL เอกสาร)
```

**ฟีเจอร์:**
- ✅ Medication schedule
- ✅ Side effects tracking
- ✅ Prescription document
- ✅ Active/inactive status
- ✅ Doctor information

---

### **Mood** (อารมณ์)
```prisma
อารมณ์:
- mood (happy, sad, neutral, angry, anxious)
- moodLevel (1-10)
- timeOfDay (morning, afternoon, evening, night)

พฤติกรรม:
- activities[] (eating, sleeping, social)
- behaviors[] (active, quiet, talkative)

บันทึก:
- note, triggers[] (สาเหตุ)
- photoUrl (หลักฐาน)
```

**ฟีเจอร์:**
- ✅ Mood scale (1-10)
- ✅ Behavior tracking
- ✅ Trigger identification
- ✅ Photo evidence
- ✅ Time-of-day tracking

---

## 📝 6. Reporting & Communication

### **DailyReport** (รายงานประจำวัน)
```prisma
สรุป:
- date, title, summary

งาน:
- tasksCompleted, tasksTotal

สุขภาพ:
- healthStatus (normal, concern, urgent)
- healthNotes

อารมณ์:
- overallMood (happy, neutral, sad)

รายจ่าย:
- expenseTotal

เหตุการณ์:
- incidents[] (เหตุการณ์พิเศษ)
- highlights[] (เด่นๆ)
- concerns[] (ข้อกังวล)

สื่อ:
- photoUrls[]

สถานะ:
- status (draft, sent, read)
- sentAt, readAt
```

**ฟีเจอร์:**
- ✅ Daily summary
- ✅ Task completion stats
- ✅ Health summary
- ✅ Expense tracking
- ✅ Photo gallery
- ✅ Read receipts

---

### **Notification** (การแจ้งเตือน)
```prisma
เนื้อหา:
- title, message
- type (info, warning, success, error, urgent)

หมวดหมู่:
- category (appointment, health, task, bill, report)

เชื่อมโยง:
- relatedId, relatedType (อ้างอิงถึงข้อมูลอื่น)
- actionUrl, actionText (ปุ่ม action)

สถานะ:
- isRead, readAt
- priority (low, normal, high, urgent)

กำหนดการ:
- scheduledFor (แจ้งเตือนล่วงหน้า)
- expiresAt (ลบอัตโนมัติ)
```

**ฟีเจอร์:**
- ✅ Multiple notification types
- ✅ Deep linking
- ✅ Scheduled notifications
- ✅ Auto-expiry
- ✅ Priority levels

---

## ⭐ 7. Review & Rating

### **CaregiverReview** (รีวิวผู้ดูแล)
```prisma
คะแนน:
- rating (1-5 stars)

คะแนนแยกย่อย:
- professionalismRating (ความเป็นมืออาชีพ)
- punctualityRating (ตรงเวลา)
- careQualityRating (คุณภาพการดูแล)
- communicationRating (การสื่อสาร)

รีวิว:
- title, comment
- wouldRecommend (แนะนำหรือไม่)

รอบรีวิว:
- reviewMonth, reviewYear
```

**ฟีเจอร์:**
- ✅ Multi-aspect rating
- ✅ Monthly reviews
- ✅ Recommendation system
- ✅ Detailed feedback

---

## 🏖️ 8. Leave Management

### **LeaveRequest** (ขอลางาน)
```prisma
รายละเอียด:
- type (sick, personal, annual, emergency)
- startDate, endDate, days
- reason

สถานะ:
- status (pending, approved, rejected)
- approvedBy, approvedAt
- rejectReason
```

**ฟีเจอร์:**
- ✅ Leave type classification
- ✅ Approval workflow
- ✅ Rejection reason
- ✅ Leave balance tracking

---

## 🔒 9. Security

### **Session** (Session Management)
```prisma
- token (unique JWT)
- userId
- userAgent, ipAddress
- expiresAt
```

**ฟีเจอร์:**
- ✅ Multi-device login
- ✅ Session expiry
- ✅ Device tracking
- ✅ Security audit

---

## 📊 Database Relationships (ER Diagram)

```
FamilyUser (1) ─── (M) Elder (1) ─── (1) Caregiver
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
  Bills            Appointments         Activities
    │                    │                    │
VitalSigns         Medications         HealthRecords
    │                    │                    │
  Moods            DailyReports       Notifications
```

---

## 🔍 Key Indexes

สร้าง indexes สำหรับ query ที่ใช้บ่อย:

```prisma
// User lookups
@@index([email])  // FamilyUser
@@index([phone])  // Caregiver
@@index([pairingCode])  // Caregiver

// Data queries
@@index([elderId])  // ทุกตารางที่เชื่อมกับ Elder
@@index([caregiverId])  // ทุกตารางที่เชื่อมกับ Caregiver
@@index([date])  // Bills, Appointments, Activities
@@index([recordedAt])  // Health records
@@index([isRead])  // Notifications
@@index([status])  // Tasks, Appointments, LeaveRequests
```

---

## 💡 Best Practices ที่ใช้

1. **Soft Delete**: ใช้ `isActive` แทนการลบจริง
2. **Timestamps**: ทุก table มี `createdAt`, `updatedAt`
3. **Decimal for Money**: ใช้ `Decimal` สำหรับเงิน (ไม่ใช้ Float)
4. **Text for Long Content**: ใช้ `@db.Text` สำหรับข้อความยาว
5. **Arrays**: ใช้ `String[]` สำหรับ list items
6. **Cascade Delete**: `onDelete: Cascade` เมื่อลบ Elder ลบข้อมูลที่เกี่ยวข้องด้วย
7. **Unique Constraints**: ป้องกันข้อมูลซ้ำ (email, phone, pairingCode)
8. **Relations**: ใช้ foreign keys ถูกต้องทุกที่

---

## 🚀 Next Steps

1. Run migration: `npx prisma migrate dev`
2. Generate client: `npx prisma generate`
3. Open Prisma Studio: `npx prisma studio`
4. Implement API endpoints
5. Create seed data

---

**จำนวนทั้งหมด: 19 Tables | ครอบคลุม 100% ของฟีเจอร์ที่มีในหน้าบ้าน! ✅**
