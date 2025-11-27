# CareLink Backend API

Backend API สำหรับระบบ CareLink - ระบบดูแลผู้สูงอายุแบบครบวงจร

## 🚀 Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (jsonwebtoken)
- **Password:** bcryptjs
- **File Upload:** Multer + Cloudinary

## 📦 Installation

```bash
cd backend
npm install
```

## ⚙️ Setup

1. สร้างไฟล์ `.env`:
```bash
cp .env.example .env
```

2. แก้ไขค่าใน `.env`:
```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-secret-key"
PORT=8000
FRONTEND_URL="http://localhost:3000"
```

3. Run Prisma migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. (Optional) เปิด Prisma Studio:
```bash
npm run prisma:studio
```

## 🏃 Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/family/register` - ลงทะเบียนลูกหลาน
- `POST /api/auth/family/login` - เข้าสู่ระบบลูกหลาน
- `POST /api/auth/caregiver/login` - เข้าสู่ระบบผู้ดูแล
- `POST /api/auth/caregiver/pairing` - ตรวจสอบรหัสจับคู่

### Elders
- `GET    /api/family/elders` - ดึงรายชื่อผู้สูงอายุ
- `POST   /api/family/elders` - เพิ่มผู้สูงอายุ
- `GET    /api/family/elders/:id` - ดึงข้อมูลผู้สูงอายุ
- `PATCH  /api/family/elders/:id` - แก้ไขข้อมูล
- `DELETE /api/family/elders/:id` - ลบ

### Caregivers
- `GET    /api/family/caregivers` - ดึงรายชื่อผู้ดูแล
- `POST   /api/family/caregivers` - เพิ่มผู้ดูแล
- `GET    /api/family/caregivers/:id` - ดึงข้อมูลผู้ดูแล
- `PATCH  /api/family/caregivers/:id` - แก้ไขข้อมูล
- `DELETE /api/family/caregivers/:id` - ลบ

### Bills
- `GET    /api/family/bills?elderId=xxx` - ดึงรายการบัญชี
- `POST   /api/family/bills` - เพิ่มรายการ
- `PATCH  /api/family/bills/:id` - แก้ไข
- `DELETE /api/family/bills/:id` - ลบ
- `PATCH  /api/family/bills/:id/toggle-paid` - เปลี่ยนสถานะการจ่าย

### Activities
- `GET    /api/family/activities?elderId=xxx` - ดึงกิจกรรม
- `POST   /api/family/activities` - เพิ่มกิจกรรม
- `PATCH  /api/family/activities/:id` - แก้ไข
- `DELETE /api/family/activities/:id` - ลบ
- `PATCH  /api/family/activities/:id/toggle` - เปลี่ยนสถานะ

### Appointments
- `GET    /api/family/appointments?elderId=xxx&filter=upcoming` - ดึงนัดหมาย
- `POST   /api/family/appointments` - เพิ่มนัดหมาย
- `PATCH  /api/family/appointments/:id` - แก้ไข
- `DELETE /api/family/appointments/:id` - ลบ

### Tasks (Caregiver)
- `GET   /api/caregiver/tasks?caregiverId=xxx` - ดึงงานประจำวัน
- `POST  /api/caregiver/tasks` - เพิ่มงาน
- `POST  /api/caregiver/tasks/:id/complete` - ทำเครื่องหมายเสร็จ
- `POST  /api/caregiver/tasks/:id/photo` - อัพโหลดรูปหลักฐาน

### Health Records
- `GET  /api/health/records?elderId=xxx` - ดึงประวัติสุขภาพ
- `POST /api/caregiver/health/blood-pressure` - บันทึกความดัน
- `POST /api/caregiver/health/observation` - บันทึกการสังเกต

### Moods
- `GET  /api/caregiver/moods?elderId=xxx` - ดูบันทึกอารมณ์
- `POST /api/caregiver/moods` - บันทึกอารมณ์

### Reports
- `GET  /api/family/reports?elderId=xxx` - ดึงรายงาน (Family)
- `GET  /api/family/reports/:id` - ดูรายละเอียดรายงาน
- `POST /api/caregiver/reports/daily` - ส่งสรุปประจำวัน (Caregiver)
- `GET  /api/caregiver/reports/sent` - ดูรายงานที่ส่งแล้ว

### Notifications
- `GET   /api/family/notifications` - ดึงการแจ้งเตือน
- `POST  /api/family/notifications/send` - ส่งการแจ้งเตือน
- `PATCH /api/family/notifications/:id/read` - ทำเครื่องหมายอ่านแล้ว

### Upload
- `POST /api/upload/image` - อัพโหลดรูปภาพ
- `POST /api/upload/document` - อัพโหลดเอกสาร

### Profile
- `GET  /api/profile?userId=xxx&type=family` - ดึงโปรไฟล์
- `PATCH /api/profile` - แก้ไขโปรไฟล์

## 🗄️ Database Schema

ดู Prisma schema ที่ `prisma/schema.prisma`

Models:
- FamilyUser
- Caregiver
- Elder
- Bill
- Activity
- Appointment
- Task
- HealthRecord
- Mood
- Report
- Notification

## 🚂 Deploy to Railway

1. Push code to GitHub
2. สร้าง New Project บน Railway
3. เชื่อม GitHub repo (เลือก backend/ folder)
4. เพิ่ม PostgreSQL database
5. Set environment variables
6. Deploy!

## 📝 Notes

- Errors จะถูก log แบบ TypeScript compile errors ให้รัน `npm install` ก่อนจะหายครับ
- Routes ที่มี "TODO" ยังไม่ implement เต็มรูปแบบ
- ตัวอย่างที่สมบูรณ์: `/api/auth` และ `/api/appointments`

## 🔐 Security

- JWT tokens expire ใน 7 วัน
- Passwords ถูก hash ด้วย bcrypt
- CORS configured สำหรับ frontend URL

## 📄 License

Private
