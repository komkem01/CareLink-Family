# 🗺️ CareLink API Endpoints Map

## 📊 สรุปภาพรวม

**Total: 52 endpoints**
- **Family APIs:** 31 endpoints
- **Caregiver APIs:** 15 endpoints  
- **Shared APIs:** 6 endpoints

---

## 👨‍👩‍👧 FAMILY APIs (31 endpoints)

### 1. Authentication (3)
```
POST   /api/auth/family/register          # ลงทะเบียนบัญชีใหม่
POST   /api/auth/family/login             # เข้าสู่ระบบ
POST   /api/auth/family/reset-password    # รีเซ็ตรหัสผ่าน
```

### 2. Elder Management (5)
```
GET    /api/family/elders                 # ดึงรายชื่อผู้สูงอายุทั้งหมด
POST   /api/family/elders                 # เพิ่มผู้สูงอายุใหม่
GET    /api/family/elders/:id             # ดึงข้อมูลผู้สูงอายุคนเดียว
PUT    /api/family/elders/:id             # แก้ไขข้อมูลผู้สูงอายุ
DELETE /api/family/elders/:id             # ลบผู้สูงอายุ
```

### 3. Caregiver Management (6)
```
GET    /api/family/caregivers             # ดึงรายชื่อผู้ดูแลทั้งหมด
POST   /api/family/caregivers             # เพิ่มผู้ดูแลใหม่ (+ generate pairing code)
GET    /api/family/caregivers/:id         # ดึงข้อมูลผู้ดูแล
PUT    /api/family/caregivers/:id         # แก้ไขข้อมูลผู้ดูแล
DELETE /api/family/caregivers/:id         # ลบผู้ดูแล
POST   /api/family/caregivers/:id/verify  # ยืนยันตัวตนผู้ดูแล
```

### 4. Bills (5)
```
GET    /api/family/bills                  # ดึงรายการบัญชีทั้งหมด (query: elderId, isPaid)
POST   /api/family/bills                  # เพิ่มรายการบัญชีใหม่
PUT    /api/family/bills/:id              # แก้ไขรายการบัญชี
DELETE /api/family/bills/:id              # ลบรายการบัญชี
PATCH  /api/family/bills/:id/toggle-paid  # เปลี่ยนสถานะการจ่าย
```

### 5. Activities (5)
```
GET    /api/family/activities             # ดึงรายการกิจกรรม (query: elderId)
POST   /api/family/activities             # เพิ่มกิจกรรมใหม่
PUT    /api/family/activities/:id         # แก้ไขกิจกรรม
DELETE /api/family/activities/:id         # ลบกิจกรรม
PATCH  /api/family/activities/:id/toggle  # เปลี่ยนสถานะการทำเสร็จ
```

### 6. Appointments (4)
```
GET    /api/family/appointments           # ดึงรายการนัดหมาย (query: elderId, filter)
POST   /api/family/appointments           # เพิ่มนัดหมายใหม่
PUT    /api/family/appointments/:id       # แก้ไขนัดหมาย
DELETE /api/family/appointments/:id       # ลบนัดหมาย
```

### 7. Reports & Notifications (3)
```
GET    /api/family/reports                # ดึงรายงานจากผู้ดูแล (query: elderId)
GET    /api/family/notifications          # ดึงการแจ้งเตือน
PATCH  /api/family/notifications/:id/read # ทำเครื่องหมายอ่านแล้ว
```

---

## 👩‍⚕️ CAREGIVER APIs (15 endpoints)

### 1. Authentication (2)
```
POST   /api/auth/caregiver/login          # เข้าสู่ระบบ
POST   /api/auth/caregiver/pairing        # ตรวจสอบรหัสจับคู่
```

### 2. Tasks (4)
```
GET    /api/caregiver/tasks               # ดึงรายการงานประจำวัน (query: date)
POST   /api/caregiver/tasks/:id/complete  # ทำเครื่องหมายงานเสร็จ
POST   /api/caregiver/tasks/:id/photo     # อัพโหลดรูปบันทึกการทำงาน
GET    /api/caregiver/tasks/next          # ดึงงานถัดไป
```

### 3. Health Records (3)
```
POST   /api/caregiver/health/blood-pressure  # บันทึกความดันโลหิต
POST   /api/caregiver/health/observation     # บันทึกการสังเกตอาการ
GET    /api/caregiver/health/history         # ดูประวัติที่บันทึก
```

### 4. Moods (2)
```
POST   /api/caregiver/moods               # บันทึกอารมณ์/อาการผู้สูงอายุ
GET    /api/caregiver/moods               # ดูบันทึกอารมณ์
```

### 5. Expenses (2)
```
POST   /api/caregiver/expenses            # เพิ่มรายการค่าใช้จ่าย
GET    /api/caregiver/expenses            # ดูรายการที่เพิ่ม
```

### 6. Reports (2)
```
POST   /api/caregiver/reports/daily       # ส่งสรุปรายงานประจำวัน
GET    /api/caregiver/reports/sent        # ดูรายงานที่ส่งแล้ว
```

---

## 🔄 SHARED APIs (6 endpoints)

### Upload (2)
```
POST   /api/upload/image                  # อัพโหลดรูปภาพ
POST   /api/upload/document               # อัพโหลดเอกสาร
```

### Health (Read-only for Family) (2)
```
GET    /api/health/records                # ดึงประวัติสุขภาพ (query: elderId)
GET    /api/health/latest                 # ดึงข้อมูลล่าสุด (query: elderId)
```

### Profile (2)
```
GET    /api/profile                       # ดึงข้อมูลโปรไฟล์ (ทั้ง family & caregiver)
PUT    /api/profile                       # แก้ไขโปรไฟล์
```

---

## 📋 สรุปตาม HTTP Methods

| Method | Family | Caregiver | Shared | Total |
|--------|--------|-----------|--------|-------|
| GET    | 13     | 6         | 4      | 23    |
| POST   | 10     | 7         | 2      | 19    |
| PUT    | 4      | 1         | 0      | 5     |
| DELETE | 3      | 0         | 0      | 3     |
| PATCH  | 1      | 1         | 0      | 2     |
| **Total** | **31** | **15** | **6** | **52** |

---

## 🔐 Authorization

### Family JWT Token:
```json
{
  "userId": "family-user-id",
  "type": "family"
}
```

### Caregiver JWT Token:
```json
{
  "userId": "caregiver-id", 
  "type": "caregiver"
}
```

### Middleware จะตรวจสอบ:
- `/api/family/*` → ต้องมี token type: "family"
- `/api/caregiver/*` → ต้องมี token type: "caregiver"
- `/api/upload/*`, `/api/health/*`, `/api/profile` → ใช้ได้ทั้ง 2 type

---

## 📱 ตัวอย่างการใช้งาน

### Family เพิ่มนัดหมาย:
```bash
POST /api/family/appointments
Authorization: Bearer <family-jwt-token>

{
  "elderId": "elder-123",
  "title": "พบหมอ",
  "date": "2024-12-05",
  "time": "10:00",
  "type": "doctor",
  "location": "โรงพยาบาล"
}
```

### Caregiver บันทึกความดัน:
```bash
POST /api/caregiver/health/blood-pressure
Authorization: Bearer <caregiver-jwt-token>

{
  "elderId": "elder-123",
  "systolic": 130,
  "diastolic": 85,
  "notes": "ปกติดี"
}
```

---

## 🎯 Route Naming Convention

✅ **ใช้:**
- `/api/family/*` - เฉพาะ Family
- `/api/caregiver/*` - เฉพาะ Caregiver
- `/api/auth/family/*` - Auth สำหรับ Family
- `/api/auth/caregiver/*` - Auth สำหรับ Caregiver
- `/api/<resource>` - Shared resources

❌ **ไม่ใช้:**
- `/api/elders` (ไม่ชัดว่าใครใช้)
- `/api/bills` (ไม่รู้ว่า family หรือ caregiver)


<!-- # Database
DATABASE_URL="postgresql://postgres:1234@localhost:5432/care-link?schema=public"

# JWT Secret
JWT_SECRET="eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTc2NDI2MTE1OCwiaWF0IjoxNzY0MjYxMTU4fQ.URLGMc8siPrWFFlODBQSr9KpY28MOf_xq_Qz_utFFsA"

# Port
PORT=8080

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000" || "https://care-link-family.vercel.app" || "http://192.168.1.44:3000"

# Cloudinary (for image upload - optional)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET="" -->

<!-- NEXT_PUBLIC_BASE_URL=http://localhost:8080/api -->
