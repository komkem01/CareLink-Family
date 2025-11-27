"use client";
import { useState } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Home,
  Users,
  Wallet,
  Calendar,
  User,
  Heart,
  Activity,
  Bell,
  FileText,
  TrendingUp,
  Clock,
  ChevronRight,
  Send,
  Phone,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Save,
  Copy,
  X,
  ArrowLeft,
  Download,
} from "lucide-react";
import CustomAlert from "../CustomAlert";

interface Elder {
  id: string;
  name: string;
  age: number;
  relation: string;
  profileColor: string;
}

interface Caregiver {
  id: string;
  name: string;
  phone: string;
  email: string;
  verified: boolean;
  startDate: string;
  pairingCode: string;      // โค้ด 6 หลักสำหรับจับคู่
  // ข้อมูลเพิ่มเติม
  idCard: string;           // เลขบัตรประชาชน
  address: string;          // ที่อยู่
  emergencyContact: string; // เบอร์ติดต่อฉุกเฉิน
  emergencyName: string;    // ชื่อผู้ติดต่อฉุกเฉิน
  experience: string;       // ประสบการณ์ (ปี)
  certificate: string;      // ใบรับรอง/วุฒิการศึกษา
  salary: string;           // เงินเดือน
  workSchedule: string;     // เวลาทำงาน
  idCardImage?: string;     // URL รูปบัตรประชาชน
  certificateImage?: string;// URL รูปใบรับรอง
}

interface Bill {
  id: string;
  date: string;
  description: string;
  amount: number;
  isPaid: boolean;
  category: string;
  addedBy: "caregiver" | "family"; // ระบุว่าใครเป็นคนเพิ่ม
  addedByName?: string; // ชื่อคนที่เพิ่ม
}

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  completed: boolean;
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "doctor" | "checkup" | "therapy" | "other";
  location: string;
  notes: string;
  reminder: boolean;
}

interface Props {
  selectedElder: Elder;
  onBack: () => void; // ฟังก์ชันย้อนกลับไปเลือกคุณยาย
}

export default function FamilyDashboard({ selectedElder, onBack }: Props) {
  const [activeTab, setActiveTab] = useState("home");
  const [caregivers, setCaregivers] = useState<Caregiver[]>([
    {
      id: "1",
      name: "คุณมานี",
      phone: "081-234-5678",
      email: "manee@email.com",
      verified: true,
      startDate: "2024-01-15",
      pairingCode: "MN2415",
      idCard: "1234567890123",
      address: "123 ถ.สุขุมวิท กรุงเทพฯ",
      emergencyContact: "081-999-9999",
      emergencyName: "คุณสมชาย (พี่ชาย)",
      experience: "5",
      certificate: "ประกาศนียบัตรผู้ดูแลผู้สูงอายุ",
      salary: "15000",
      workSchedule: "จันทร์-ศุกร์ 8:00-17:00",
    },
  ]);
  const [bills, setBills] = useState<Bill[]>([
    { id: "1", date: "2024-11-25", description: "ค่ายา", amount: 1500, isPaid: true, category: "medical", addedBy: "caregiver", addedByName: "คุณมานี" },
    { id: "2", date: "2024-11-26", description: "ค่าอาหาร", amount: 800, isPaid: false, category: "food", addedBy: "caregiver", addedByName: "คุณมานี" },
    { id: "3", date: "2024-11-27", description: "ค่าผู้ดูแล", amount: 5000, isPaid: false, category: "caregiver", addedBy: "family" },
    { id: "4", date: "2024-11-26", description: "ค่าตรวจเลือด", amount: 2500, isPaid: false, category: "medical", addedBy: "family" },
  ]);
  const [activities, setActivities] = useState<Activity[]>([
    { id: "1", title: "กายภาพบำบัด", description: "ยืดเหยียดแขนขา 20 นาที", time: "09:00", date: "2024-11-27", completed: false },
    { id: "2", title: "ตรวจสุขภาพ", description: "วัดความดันและน้ำตาล", time: "14:00", date: "2024-11-27", completed: false },
  ]);

  type AlertType = "info" | "error" | "success";
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: AlertType;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Caregiver form states
  const [showCaregiverForm, setShowCaregiverForm] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null);
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [caregiverIdCard, setCaregiverIdCard] = useState("");
  const [caregiverAddress, setCaregiverAddress] = useState("");
  const [caregiverEmergencyContact, setCaregiverEmergencyContact] = useState("");
  const [caregiverEmergencyName, setCaregiverEmergencyName] = useState("");
  const [caregiverExperience, setCaregiverExperience] = useState("");
  const [caregiverCertificate, setCaregiverCertificate] = useState("");
  const [caregiverSalary, setCaregiverSalary] = useState("");
  const [caregiverWorkSchedule, setCaregiverWorkSchedule] = useState("");
  const [caregiverIdCardImage, setCaregiverIdCardImage] = useState("");
  const [caregiverCertificateImage, setCaregiverCertificateImage] = useState("");

  // Bill form states
  const [showBillForm, setShowBillForm] = useState(false);
  const [billDesc, setBillDesc] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billCategory, setBillCategory] = useState("");

  // Activity form states
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [activityTime, setActivityTime] = useState("");

  // Calendar & Appointments states
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: "1", title: "พบหมอ - ตรวจสุขภาพประจำเดือน", date: "2024-12-05", time: "10:00", type: "doctor", location: "โรงพยาบาลกรุงเทพ", notes: "นำเอกสารสิทธิ์การรักษาไปด้วย", reminder: true },
    { id: "2", title: "ตรวจเลือด", date: "2024-11-30", time: "08:00", type: "checkup", location: "คลินิกใกล้บ้าน", notes: "งดอาหารก่อน 8 ชม.", reminder: true },
    { id: "3", title: "กายภาพบำบัด", date: "2024-12-01", time: "14:00", type: "therapy", location: "ศูนย์ฟื้นฟู", notes: "", reminder: false },
  ]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<"doctor" | "checkup" | "therapy" | "other">("doctor");
  const [appointmentLocation, setAppointmentLocation] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [appointmentReminder, setAppointmentReminder] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Reports modal
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports] = useState([
    { id: "1", time: "10:30", date: "2024-11-27", title: "คุณยายอารมณ์ดี", status: "success", details: "รับประทานอาหารเสร็จ พูดคุยเรื่องเก่าๆ อารมณ์ดี" },
    { id: "2", time: "08:00", date: "2024-11-27", title: "ทานยาเรียบร้อย", status: "success", details: "ทานยา 3 เม็ด พร้อมน้ำอุ่น 1 แก้ว" },
    { id: "3", time: "07:30", date: "2024-11-27", title: "ความดัน 130/85", status: "warning", details: "ความดันสูงกว่าปกติเล็กน้อย ควรสังเกตอาการ" },
    { id: "4", time: "22:00", date: "2024-11-26", title: "นอนหลับสนิท", status: "success", details: "นอนเวลา 22:00 น. หลับสนิทตลอดคืน" },
    { id: "5", time: "18:00", date: "2024-11-26", title: "ออกกำลังกาย", status: "success", details: "เดินในสวน 15 นาที กับคุณมานี" },
    { id: "6", time: "14:30", date: "2024-11-26", title: "อาการปวดหัวเล็กน้อย", status: "warning", details: "ปวดหัวจากแดด ให้พักผ่อนแล้วดีขึ้น" },
  ]);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: "1", title: "คุณมานีส่งรายงานแล้ว", message: "รายงานประจำวันของคุณยายสมศรี", time: "10 นาทีที่แล้ว", isRead: false },
    { id: "2", title: "เตือนจ่ายค่าผู้ดูแล", message: "ค่าผู้ดูแลประจำเดือนพ.ย. ยังไม่ได้จ่าย", time: "1 ชั่วโมงที่แล้ว", isRead: false },
    { id: "3", title: "กิจกรรมวันนี้", message: "มี 2 กิจกรรมที่ยังไม่เสร็จ", time: "3 ชั่วโมงที่แล้ว", isRead: true },
    { id: "4", title: "ความดันปกติ", message: "วัดความดัน 120/80 mmHg", time: "เมื่อวาน", isRead: true },
  ]);

  // Health Report Export
  const [showHealthReport, setShowHealthReport] = useState(false);

  const generateHealthReport = () => {
    const reportData = {
      elder: selectedElder,
      date: new Date().toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      caregivers: caregivers,
      recentReports: reports.slice(0, 10),
      activities: activities,
    };
    
    return reportData;
  };

  const exportHealthReport = () => {
    const report = generateHealthReport();
    
    // สร้าง PDF
    const doc = new jsPDF();
    
    let yPos = 20;
    
    // === Header ===
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('รายงานสุขภาพ', 105, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(16);
    doc.text(report.elder.name, 105, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`วันที่ออกรายงาน: ${report.date}`, 105, yPos, { align: 'center' });
    
    // === Separator Line ===
    yPos += 5;
    doc.setDrawColor(66, 153, 225);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    
    yPos += 10;
    
    // === ข้อมูลผู้สูงอายุ ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('ข้อมูลผู้สูงอายุ', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    doc.text(`ชื่อ: ${report.elder.name}`, 25, yPos);
    yPos += 6;
    doc.text(`อายุ: ${report.elder.age} ปี`, 25, yPos);
    yPos += 6;
    doc.text(`ความสัมพันธ์: ${report.elder.relation}`, 25, yPos);
    
    yPos += 12;
    
    // === ผู้ดูแล ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('ผู้ดูแล', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    report.caregivers.forEach((caregiver, index) => {
      doc.text(`${index + 1}. ${caregiver.name}`, 25, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.text(`   โทร: ${caregiver.phone}`, 25, yPos);
      yPos += 4;
      doc.text(`   รหัสจับคู่: ${caregiver.pairingCode}`, 25, yPos);
      yPos += 6;
      doc.setFontSize(10);
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    yPos += 6;
    
    // === บันทึกสุขภาพล่าสุด ===
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(236, 72, 153);
    doc.text('บันทึกสุขภาพล่าสุด', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    report.recentReports.forEach((record, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // Status badge
      if (record.status === 'success') {
        doc.setFillColor(187, 247, 208); // Green background
        doc.setTextColor(21, 128, 61); // Dark green text
      } else {
        doc.setFillColor(254, 243, 199); // Yellow background
        doc.setTextColor(180, 83, 9); // Dark yellow text
      }
      
      doc.roundedRect(25, yPos - 3, 12, 5, 1, 1, 'F');
      doc.setFontSize(8);
      doc.text(record.status === 'success' ? 'ปกติ' : 'เฝ้า', 26, yPos, { align: 'left' });
      
      // Record info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${record.title}`, 40, yPos);
      
      yPos += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${record.date} ${record.time}`, 40, yPos);
      
      yPos += 5;
      // Wrap long text
      const detailLines = doc.splitTextToSize(record.details, 150);
      doc.text(detailLines, 40, yPos);
      yPos += detailLines.length * 4 + 4;
    });
    
    yPos += 6;
    
    // === กิจกรรมที่กำหนดไว้ ===
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    const pendingActivities = report.activities.filter(a => !a.completed);
    
    if (pendingActivities.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text('กิจกรรมที่กำหนดไว้', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      pendingActivities.forEach((activity, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${activity.time} - ${activity.title}`, 25, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const activityLines = doc.splitTextToSize(activity.description, 160);
        doc.text(activityLines, 25, yPos);
        yPos += activityLines.length * 4 + 5;
        doc.setFontSize(10);
      });
    }
    
    // === Footer ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`หน้า ${i} จาก ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('สร้างโดยระบบ CareLink', 105, 285, { align: 'center' });
    }
    
    // บันทึกไฟล์
    const fileName = `รายงานสุขภาพ-${selectedElder.name.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showAlertMessage("ส่งออกสำเร็จ", "ดาวน์โหลดรายงานสุขภาพ PDF เรียบร้อย", "success");
  };

  const showAlertMessage = (title: string, message: string, type: AlertType = "info") => {
    setAlert({ isOpen: true, title, message, type });
  };

  // Generate unique 6-digit pairing code
  const generatePairingCode = (name: string): string => {
    // ใช้ตัวอักษรแรกของชื่อ + ตัวเลข random
    const initials = name.replace(/\s/g, '').substring(0, 2).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 หลัก
    return `${initials}${randomNum}`;
  };

  // Copy pairing code to clipboard
  const copyPairingCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code).then(() => {
      showAlertMessage("คัดลอกแล้ว", `คัดลอกรหัสจับคู่ของ ${name} แล้ว: ${code}`, "success");
    });
  };

  const handleAddCaregiver = () => {
    if (!caregiverName || !caregiverPhone || !caregiverEmail || !caregiverIdCard || !caregiverAddress) {
      showAlertMessage("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน", "error");
      return;
    }

    if (editingCaregiver) {
      // Update existing caregiver
      setCaregivers(
        caregivers.map((c) =>
          c.id === editingCaregiver.id
            ? {
                ...c,
                name: caregiverName,
                phone: caregiverPhone,
                email: caregiverEmail,
                idCard: caregiverIdCard,
                address: caregiverAddress,
                emergencyContact: caregiverEmergencyContact,
                emergencyName: caregiverEmergencyName,
                experience: caregiverExperience,
                certificate: caregiverCertificate,
                salary: caregiverSalary,
                workSchedule: caregiverWorkSchedule,
                idCardImage: caregiverIdCardImage,
                certificateImage: caregiverCertificateImage,
              }
            : c
        )
      );
      showAlertMessage("แก้ไขสำเร็จ", `แก้ไขข้อมูล ${caregiverName} เรียบร้อย`, "success");
    } else {
      // Add new caregiver
      const pairingCode = generatePairingCode(caregiverName);
      const newCaregiver: Caregiver = {
        id: Date.now().toString(),
        name: caregiverName,
        phone: caregiverPhone,
        email: caregiverEmail,
        verified: false,
        startDate: new Date().toISOString().split("T")[0],
        pairingCode: pairingCode,
        idCard: caregiverIdCard,
        address: caregiverAddress,
        emergencyContact: caregiverEmergencyContact,
        emergencyName: caregiverEmergencyName,
        experience: caregiverExperience,
        certificate: caregiverCertificate,
        salary: caregiverSalary,
        workSchedule: caregiverWorkSchedule,
        idCardImage: caregiverIdCardImage,
        certificateImage: caregiverCertificateImage,
      };

      setCaregivers([...caregivers, newCaregiver]);
      showAlertMessage("เพิ่มสำเร็จ", `เพิ่มผู้ดูแล ${caregiverName} เรียบร้อย\nรหัสจับคู่: ${pairingCode}`, "success");
    }

    // Reset form
    setCaregiverName("");
    setCaregiverPhone("");
    setCaregiverEmail("");
    setCaregiverIdCard("");
    setCaregiverAddress("");
    setCaregiverEmergencyContact("");
    setCaregiverEmergencyName("");
    setCaregiverExperience("");
    setCaregiverCertificate("");
    setCaregiverSalary("");
    setCaregiverWorkSchedule("");
    setCaregiverIdCardImage("");
    setCaregiverCertificateImage("");
    setEditingCaregiver(null);
    setShowCaregiverForm(false);
  };

  const handleEditCaregiver = (caregiver: Caregiver) => {
    setEditingCaregiver(caregiver);
    setCaregiverName(caregiver.name);
    setCaregiverPhone(caregiver.phone);
    setCaregiverEmail(caregiver.email);
    setCaregiverIdCard(caregiver.idCard);
    setCaregiverAddress(caregiver.address);
    setCaregiverEmergencyContact(caregiver.emergencyContact);
    setCaregiverEmergencyName(caregiver.emergencyName);
    setCaregiverExperience(caregiver.experience);
    setCaregiverCertificate(caregiver.certificate);
    setCaregiverSalary(caregiver.salary);
    setCaregiverWorkSchedule(caregiver.workSchedule);
    setCaregiverIdCardImage(caregiver.idCardImage || "");
    setCaregiverCertificateImage(caregiver.certificateImage || "");
    setShowCaregiverForm(true);
  };

  const handleCancelCaregiverForm = () => {
    setCaregiverName("");
    setCaregiverPhone("");
    setCaregiverEmail("");
    setCaregiverIdCard("");
    setCaregiverAddress("");
    setCaregiverEmergencyContact("");
    setCaregiverEmergencyName("");
    setCaregiverExperience("");
    setCaregiverCertificate("");
    setCaregiverSalary("");
    setCaregiverWorkSchedule("");
    setCaregiverIdCardImage("");
    setCaregiverCertificateImage("");
    setEditingCaregiver(null);
    setShowCaregiverForm(false);
  };

  const handleDeleteCaregiver = (id: string) => {
    setCaregivers(caregivers.filter((c) => c.id !== id));
    showAlertMessage("ลบแล้ว", "ลบผู้ดูแลเรียบร้อย", "info");
  };

  const handleAddBill = () => {
    if (!billDesc || !billAmount || !billCategory) {
      showAlertMessage("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
      return;
    }

    const newBill: Bill = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      description: billDesc,
      amount: parseFloat(billAmount),
      isPaid: false,
      category: billCategory,
      addedBy: "family", // ลูกหลานเป็นคนเพิ่ม
    };

    setBills([...bills, newBill]);
    setBillDesc("");
    setBillAmount("");
    setBillCategory("");
    setShowBillForm(false);
    showAlertMessage("เพิ่มสำเร็จ", "เพิ่มรายการบัญชีเรียบร้อย", "success");
  };

  const toggleBillPaid = (id: string) => {
    setBills(bills.map((b) => (b.id === id ? { ...b, isPaid: !b.isPaid } : b)));
  };

  const handleDeleteBill = (id: string) => {
    setBills(bills.filter((b) => b.id !== id));
    showAlertMessage("ลบแล้ว", "ลบรายการบัญชีเรียบร้อย", "info");
  };

  const handleAddActivity = () => {
    if (!activityTitle || !activityDesc || !activityTime) {
      showAlertMessage("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
      return;
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      title: activityTitle,
      description: activityDesc,
      time: activityTime,
      date: new Date().toISOString().split("T")[0],
      completed: false,
    };

    setActivities([...activities, newActivity]);
    setActivityTitle("");
    setActivityDesc("");
    setActivityTime("");
    setShowActivityForm(false);
    showAlertMessage("เพิ่มสำเร็จ", "เพิ่มกิจกรรมเรียบร้อย", "success");
  };

  const toggleActivityComplete = (id: string) => {
    setActivities(activities.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)));
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter((a) => a.id !== id));
    showAlertMessage("ลบแล้ว", "ลบกิจกรรมเรียบร้อย", "info");
  };

  // Appointment Functions
  const handleAddAppointment = () => {
    if (!appointmentTitle || !appointmentDate || !appointmentTime) {
      showAlertMessage("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบถ้วน", "error");
      return;
    }

    if (editingAppointment) {
      // แก้ไขนัดหมาย
      setAppointments(appointments.map(apt =>
        apt.id === editingAppointment.id
          ? {
              ...apt,
              title: appointmentTitle,
              date: appointmentDate,
              time: appointmentTime,
              type: appointmentType,
              location: appointmentLocation,
              notes: appointmentNotes,
              reminder: appointmentReminder,
            }
          : apt
      ));
      showAlertMessage("แก้ไขสำเร็จ", "แก้ไขนัดหมายเรียบร้อย", "success");
    } else {
      // เพิ่มนัดหมายใหม่
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        title: appointmentTitle,
        date: appointmentDate,
        time: appointmentTime,
        type: appointmentType,
        location: appointmentLocation,
        notes: appointmentNotes,
        reminder: appointmentReminder,
      };
      setAppointments([...appointments, newAppointment]);
      showAlertMessage("เพิ่มสำเร็จ", "เพิ่มนัดหมายเรียบร้อย", "success");
    }

    handleCancelAppointmentForm();
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setAppointmentTitle(appointment.title);
    setAppointmentDate(appointment.date);
    setAppointmentTime(appointment.time);
    setAppointmentType(appointment.type);
    setAppointmentLocation(appointment.location);
    setAppointmentNotes(appointment.notes);
    setAppointmentReminder(appointment.reminder);
    setShowAppointmentForm(true);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter(apt => apt.id !== id));
    showAlertMessage("ลบแล้ว", "ลบนัดหมายเรียบร้อย", "info");
  };

  const handleCancelAppointmentForm = () => {
    setAppointmentTitle("");
    setAppointmentDate("");
    setAppointmentTime("");
    setAppointmentType("doctor");
    setAppointmentLocation("");
    setAppointmentNotes("");
    setAppointmentReminder(true);
    setEditingAppointment(null);
    setShowAppointmentForm(false);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getAppointmentsForDate = (date: string) => {
    return appointments.filter(apt => apt.date === date);
  };

  const formatThaiMonth = (date: Date) => {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${months[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  const changeMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const getAppointmentTypeLabel = (type: string) => {
    const labels = {
      doctor: "นัดหมอ",
      checkup: "ตรวจสุขภาพ",
      therapy: "กายภาพบำบัด",
      other: "อื่นๆ"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAppointmentTypeColor = (type: string) => {
    const colors = {
      doctor: "bg-red-100 text-red-700 border-red-200",
      checkup: "bg-blue-100 text-blue-700 border-blue-200",
      therapy: "bg-green-100 text-green-700 border-green-200",
      other: "bg-gray-100 text-gray-700 border-gray-200"
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  // Get upcoming appointments (next 7 days)
  const getUpcomingAppointments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= today && aptDate <= nextWeek;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);
  const unpaidBills = bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  const todayActivities = activities.filter((a) => !a.completed).length;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-b-3xl shadow-md flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors active:scale-95"
            title="กลับไปเลือกผู้สูงอายุ"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <div className={`w-12 h-12 rounded-full ${selectedElder.profileColor} border-2 border-white/30 flex items-center justify-center text-white font-bold text-xl`}>
            {selectedElder.name.charAt(selectedElder.name.indexOf("คุ") + 2)}
          </div>
          <div>
            <p className="text-purple-100 text-xs">กำลังดูแล:</p>
            <p className="text-white text-lg font-bold">{selectedElder.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHealthReport(true)}
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-2 rounded-full shadow-lg active:scale-95 flex items-center gap-2 border border-white/30 transition-all"
            title="ส่งออกรายงานสุขภาพ"
          >
            <Download size={18} />
          </button>
          <button 
            onClick={() => setShowNotifications(true)}
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-full shadow-lg active:scale-95 flex items-center gap-2 border border-white/30 transition-all relative"
          >
            <Bell size={18} />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 pb-24">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="animate-in fade-in duration-300 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={20} className="text-red-500" />
                  <p className="text-gray-500 text-xs font-medium">สุขภาพ</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">ปกติ</p>
                <p className="text-xs text-green-600 font-medium mt-1">อัพเดท 2 ชม. ที่แล้ว</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-blue-500" />
                  <p className="text-gray-500 text-xs font-medium">กิจกรรม</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">{todayActivities}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">รอทำวันนี้</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-orange-100 text-sm mb-1">บัญชีค้างจ่าย</p>
                  <h2 className="text-4xl font-bold">{unpaidBills.toLocaleString()}</h2>
                  <p className="text-sm text-orange-100 mt-1">บาท</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl">
                  <DollarSign size={28} />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-orange-100">รวมทั้งหมด: {totalBills.toLocaleString()} บาท</span>
              </div>
            </div>

            {/* Latest Reports */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileText size={20} className="text-blue-500" />
                  รายงานล่าสุด
                </h3>
                <button 
                  onClick={() => setShowReportsModal(true)}
                  className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:text-blue-700 active:scale-95 transition-all"
                >
                  ดูทั้งหมด <ChevronRight size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {reports.slice(0, 3).map((report, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${report.status === "success" ? "bg-green-100" : "bg-yellow-100"}`}>
                      {report.status === "success" ? <CheckCircle2 size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-yellow-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">{report.title}</p>
                      <p className="text-xs text-gray-500">{report.time} น.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Caregiver */}
            <button
              onClick={() => showAlertMessage("โทรหาผู้ดูแล", "กำลังโทรหา คุณมานี...", "info")}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-5 rounded-3xl shadow-lg flex items-center justify-center gap-3 hover:from-green-600 hover:to-emerald-700 transition-all active:scale-95"
            >
              <Phone size={24} />
              โทรหาผู้ดูแล
            </button>
          </div>
        )}

        {/* CAREGIVERS TAB */}
        {activeTab === "caregivers" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">ผู้ดูแล</h2>
              <button
                onClick={() => {
                  handleCancelCaregiverForm();
                  setShowCaregiverForm(!showCaregiverForm);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 font-bold transition-all active:scale-95 text-sm"
              >
                <Plus size={16} /> เพิ่มผู้ดูแล
              </button>
            </div>

            {/* Add/Edit Form */}
            {showCaregiverForm && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-purple-200 mb-6 max-h-[600px] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b">
                  <h3 className="text-lg font-bold text-gray-800">
                    {editingCaregiver ? "แก้ไขข้อมูลผู้ดูแล" : "เพิ่มผู้ดูแลใหม่"}
                  </h3>
                  <button
                    onClick={handleCancelCaregiverForm}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* ข้อมูลพื้นฐาน */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <User size={16} /> ข้อมูลพื้นฐาน
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="ชื่อ-นามสกุล *"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverName}
                        onChange={(e) => setCaregiverName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="เลขบัตรประชาชน 13 หลัก *"
                        maxLength={13}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverIdCard}
                        onChange={(e) => setCaregiverIdCard(e.target.value.replace(/\D/g, ''))}
                      />
                      <textarea
                        placeholder="ที่อยู่ *"
                        rows={3}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 resize-none"
                        value={caregiverAddress}
                        onChange={(e) => setCaregiverAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ข้อมูลติดต่อ */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <Phone size={16} /> ข้อมูลติดต่อ
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="tel"
                        placeholder="เบอร์โทรศัพท์"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverPhone}
                        onChange={(e) => setCaregiverPhone(e.target.value)}
                      />
                      <input
                        type="email"
                        placeholder="อีเมล"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverEmail}
                        onChange={(e) => setCaregiverEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ผู้ติดต่อฉุกเฉิน */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <AlertCircle size={16} /> ผู้ติดต่อฉุกเฉิน
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="ชื่อผู้ติดต่อฉุกเฉิน (เช่น คุณสมชาย - พี่ชาย)"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverEmergencyName}
                        onChange={(e) => setCaregiverEmergencyName(e.target.value)}
                      />
                      <input
                        type="tel"
                        placeholder="เบอร์โทรศัพท์ฉุกเฉิน"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverEmergencyContact}
                        onChange={(e) => setCaregiverEmergencyContact(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ข้อมูลการทำงาน */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <Activity size={16} /> ข้อมูลการทำงาน
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="ประสบการณ์ (ปี)"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverExperience}
                        onChange={(e) => setCaregiverExperience(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="ใบรับรอง/วุฒิการศึกษา"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverCertificate}
                        onChange={(e) => setCaregiverCertificate(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="เวลาทำงาน (เช่น จันทร์-ศุกร์ 8:00-17:00)"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverWorkSchedule}
                        onChange={(e) => setCaregiverWorkSchedule(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="เงินเดือน (บาท)"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverSalary}
                        onChange={(e) => setCaregiverSalary(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* หลักฐาน */}
                  <div className="pb-2">
                    <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <FileText size={16} /> หลักฐาน (URL)
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="URL รูปบัตรประชาชน"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverIdCardImage}
                        onChange={(e) => setCaregiverIdCardImage(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="URL รูปใบรับรอง/วุฒิการศึกษา"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverCertificateImage}
                        onChange={(e) => setCaregiverCertificateImage(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">* ระบบอัพโหลดรูปจะเพิ่มในอนาคต</p>
                    </div>
                  </div>

                  {/* ปุ่ม */}
                  <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t">
                    <button
                      onClick={handleCancelCaregiverForm}
                      className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleAddCaregiver}
                      className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {editingCaregiver ? (
                        <>
                          <Save size={18} /> บันทึก
                        </>
                      ) : (
                        <>
                          <Plus size={18} /> เพิ่ม
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Caregiver List */}
            <div className="space-y-4">
              {caregivers.map((caregiver) => (
                <div key={caregiver.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 font-bold text-xl">
                        {caregiver.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{caregiver.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {caregiver.verified ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> ยืนยันแล้ว
                            </span>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">
                              รอยืนยัน
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCaregiver(caregiver)}
                        className="p-2 bg-blue-50 rounded-xl hover:bg-blue-100 text-blue-600 transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCaregiver(caregiver.id)}
                        className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* ข้อมูลหลัก */}
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="shrink-0" />
                      <span className="truncate">{caregiver.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Send size={14} className="shrink-0" />
                      <span className="truncate">{caregiver.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User size={14} className="shrink-0" />
                      <span className="truncate">บัตร: {caregiver.idCard.slice(0, 3)}***{caregiver.idCard.slice(-4)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={14} className="shrink-0" />
                      <span className="truncate">เริ่ม: {caregiver.startDate}</span>
                    </div>
                  </div>

                  {/* Pairing Code */}
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-3 mb-3 border-2 border-dashed border-purple-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-purple-700 font-medium mb-1">รหัสจับคู่ (Pairing Code)</p>
                        <p className="text-2xl font-bold text-purple-900 tracking-widest">{caregiver.pairingCode}</p>
                        <p className="text-xs text-purple-600 mt-2">ผู้ดูแลใช้รหัสนี้เพื่อจับคู่กับผู้สูงอายุ</p>
                      </div>
                      <button
                        onClick={() => copyPairingCode(caregiver.pairingCode, caregiver.name)}
                        className="bg-white hover:bg-purple-50 p-3 rounded-xl transition-colors border border-purple-200 active:scale-95"
                        title="คัดลอกรหัส"
                      >
                        <Copy size={20} className="text-purple-600" />
                      </button>
                    </div>
                  </div>

                  {/* รายละเอียดเพิ่มเติม - Collapsible */}
                  <details className="group">
                    <summary className="cursor-pointer text-purple-600 font-bold text-sm flex items-center gap-1 hover:text-purple-700 transition-colors">
                      <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
                      ดูรายละเอียดเพิ่มเติม
                    </summary>
                    <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium mb-1">ที่อยู่</p>
                        <p className="text-gray-700">{caregiver.address}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-xs text-gray-500 font-medium mb-1">ผู้ติดต่อฉุกเฉิน</p>
                          <p className="text-gray-700 font-bold text-xs">{caregiver.emergencyName}</p>
                          <p className="text-gray-600 text-xs">{caregiver.emergencyContact}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-xs text-gray-500 font-medium mb-1">ประสบการณ์</p>
                          <p className="text-gray-700 font-bold">{caregiver.experience} ปี</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium mb-1">วุฒิการศึกษา</p>
                        <p className="text-gray-700">{caregiver.certificate}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 p-3 rounded-xl">
                          <p className="text-xs text-blue-600 font-medium mb-1">เงินเดือน</p>
                          <p className="text-blue-900 font-bold">{parseInt(caregiver.salary).toLocaleString()} บาท</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-xl">
                          <p className="text-xs text-purple-600 font-medium mb-1">เวลาทำงาน</p>
                          <p className="text-purple-900 text-xs font-medium">{caregiver.workSchedule}</p>
                        </div>
                      </div>

                      {(caregiver.idCardImage || caregiver.certificateImage) && (
                        <div className="bg-green-50 p-3 rounded-xl">
                          <p className="text-xs text-green-700 font-medium mb-2 flex items-center gap-1">
                            <FileText size={14} /> หลักฐานที่อัพโหลด
                          </p>
                          <div className="space-y-1">
                            {caregiver.idCardImage && (
                              <a href={caregiver.idCardImage} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block">
                                📄 บัตรประชาชน
                              </a>
                            )}
                            {caregiver.certificateImage && (
                              <a href={caregiver.certificateImage} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block">
                                📄 ใบรับรอง
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BILLS TAB */}
        {activeTab === "bills" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">บัญชี</h2>
              <button
                onClick={() => setShowBillForm(!showBillForm)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 font-bold transition-all active:scale-95 text-sm"
              >
                <Plus size={16} /> เพิ่มรายการ
              </button>
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 p-2 rounded-full shrink-0">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-blue-900 font-bold text-sm mb-1">ℹ️ เกี่ยวกับบัญชี</p>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    • <strong>รายการที่ผู้ดูแลเพิ่ม</strong> (สีน้ำเงิน): ทั้ง 2 ฝั่งเห็นและแก้ไขได้<br />
                    • <strong>รายการที่ครอบครัวเพิ่ม</strong> (สีม่วง): เฉพาะครอบครัวเห็น ผู้ดูแลไม่เห็น
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <p className="text-blue-700 text-sm font-medium mb-1">รวมทั้งหมด</p>
                <p className="text-3xl font-bold text-blue-900">{totalBills.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">บาท</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                <p className="text-red-700 text-sm font-medium mb-1">ค้างจ่าย</p>
                <p className="text-3xl font-bold text-red-900">{unpaidBills.toLocaleString()}</p>
                <p className="text-xs text-red-600 mt-1">บาท</p>
              </div>
            </div>

            {/* Add Form */}
            {showBillForm && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-green-200 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">เพิ่มรายการใหม่</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="รายละเอียด (เช่น ค่ายา)"
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                    value={billDesc}
                    onChange={(e) => setBillDesc(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="จำนวนเงิน (บาท)"
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                  />
                  <select
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                    value={billCategory}
                    onChange={(e) => setBillCategory(e.target.value)}
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    <option value="medical">ค่ารักษาพยาบาล</option>
                    <option value="food">ค่าอาหาร</option>
                    <option value="caregiver">ค่าผู้ดูแล</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBillForm(false)}
                      className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleAddBill}
                      className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bill List */}
            <div className="space-y-3">
              {bills.map((bill) => (
                <div key={bill.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${bill.isPaid ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`text-lg font-bold ${bill.isPaid ? "text-gray-500 line-through" : "text-gray-800"}`}>
                          {bill.description}
                        </h3>
                        {bill.isPaid && <CheckCircle2 size={20} className="text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-500">{bill.date}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{bill.amount.toLocaleString()} บาท</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleBillPaid(bill.id)}
                        className={`p-2 rounded-xl ${bill.isPaid ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-600"} hover:opacity-80`}
                      >
                        {bill.isPaid ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${bill.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {bill.isPaid ? "✓ จ่ายแล้ว" : "✗ ยังไม่จ่าย"}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                      {bill.category === "medical" ? "💊 รักษาพยาบาล" : bill.category === "food" ? "🍚 อาหาร" : bill.category === "caregiver" ? "👩‍⚕️ ผู้ดูแล" : "📌 อื่นๆ"}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      bill.addedBy === "caregiver" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-purple-100 text-purple-700"
                    }`}>
                      {bill.addedBy === "caregiver" 
                        ? `👤 ${bill.addedByName || "ผู้ดูแล"}` 
                        : "👨‍👩‍👧 ครอบครัว"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === "calendar" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">ปฏิทินนัดหมาย</h2>
              <button
                onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 font-bold transition-all active:scale-95 text-sm"
              >
                <Plus size={16} /> เพิ่มนัดหมาย
              </button>
            </div>

            {/* Upcoming Appointments Alert */}
            {getUpcomingAppointments().length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Bell size={24} className="text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-orange-800 mb-1">นัดหมายที่ใกล้ถึง ({getUpcomingAppointments().length})</h3>
                    {getUpcomingAppointments().slice(0, 2).map(apt => (
                      <p key={apt.id} className="text-sm text-orange-700 mb-1">
                        • {apt.title} - {new Date(apt.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} เวลา {apt.time} น.
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Add/Edit Appointment Form */}
            {showAppointmentForm && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-purple-200 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {editingAppointment ? "แก้ไขนัดหมาย" : "เพิ่มนัดหมายใหม่"}
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="ชื่อนัดหมาย (เช่น พบหมอประจำเดือน)"
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                    value={appointmentTitle}
                    onChange={(e) => setAppointmentTitle(e.target.value)}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                    />
                    <input
                      type="time"
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                    />
                  </div>

                  <select
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value as "doctor" | "checkup" | "therapy" | "other")}
                  >
                    <option value="doctor">นัดหมอ</option>
                    <option value="checkup">ตรวจสุขภาพ</option>
                    <option value="therapy">กายภาพบำบัด</option>
                    <option value="other">อื่นๆ</option>
                  </select>

                  <input
                    type="text"
                    placeholder="สถานที่ (เช่น โรงพยาบาลกรุงเทพ)"
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                    value={appointmentLocation}
                    onChange={(e) => setAppointmentLocation(e.target.value)}
                  />

                  <textarea
                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 h-20 resize-none"
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                  />

                  <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appointmentReminder}
                      onChange={(e) => setAppointmentReminder(e.target.checked)}
                      className="w-5 h-5 accent-purple-600"
                    />
                    <span className="text-gray-700 font-medium">แจ้งเตือนล่วงหน้า 1 วัน</span>
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelAppointmentForm}
                      className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleAddAppointment}
                      className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700"
                    >
                      {editingAppointment ? "บันทึก" : "เพิ่ม"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
              {/* Month Header */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronRight size={24} className="text-gray-600 rotate-180" />
                </button>
                <h3 className="text-xl font-bold text-gray-800">
                  {formatThaiMonth(currentMonth)}
                </h3>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronRight size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day) => (
                  <div key={day} className="text-center text-sm font-bold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
                  const days = [];
                  
                  // Empty cells before first day
                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(<div key={`empty-${i}`} className="aspect-square" />);
                  }
                  
                  // Days of month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayAppointments = getAppointmentsForDate(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    
                    days.push(
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setAppointmentDate(dateStr);
                          if (dayAppointments.length === 0) {
                            setShowAppointmentForm(true);
                          }
                        }}
                        className={`aspect-square p-1 rounded-xl text-sm font-medium transition-all relative ${
                          isToday 
                            ? "bg-purple-600 text-white font-bold" 
                            : dayAppointments.length > 0
                            ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <span>{day}</span>
                          {dayAppointments.length > 0 && (
                            <div className="flex gap-0.5 mt-1">
                              {dayAppointments.slice(0, 2).map((_, i) => (
                                <div key={i} className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-purple-500"}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  }
                  
                  return days;
                })()}
              </div>
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText size={20} />
                นัดหมายทั้งหมด ({appointments.length})
              </h3>
              
              {appointments.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">ยังไม่มีนัดหมาย</p>
                  <p className="text-sm text-gray-400 mt-1">กดปุ่ม "เพิ่มนัดหมาย" เพื่อเริ่มต้น</p>
                </div>
              ) : (
                appointments
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((appointment) => {
                    const aptDate = new Date(appointment.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isUpcoming = aptDate >= today;

                    return (
                      <div 
                        key={appointment.id} 
                        className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${
                          isUpcoming ? "border-purple-200" : "border-gray-100 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${getAppointmentTypeColor(appointment.type)}`}>
                              {getAppointmentTypeLabel(appointment.type)}
                            </div>
                            {appointment.reminder && isUpcoming && (
                              <Bell size={16} className="text-orange-500 mt-1" />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAppointment(appointment)}
                              className="p-2 bg-blue-50 rounded-xl hover:bg-blue-100 text-blue-600"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-lg font-bold text-gray-800 mb-2">{appointment.title}</h4>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span>
                              {new Date(appointment.date).toLocaleDateString('th-TH', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            <span>{appointment.time} น.</span>
                          </div>
                          {appointment.location && (
                            <div className="flex items-center gap-2">
                              <ChevronRight size={16} className="text-gray-400" />
                              <span>{appointment.location}</span>
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-600">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* ACTIVITIES TAB */}
        {activeTab === "activities" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">กิจกรรม</h2>
              <button
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 font-bold transition-all active:scale-95 text-sm"
              >
                <Plus size={16} /> เพิ่มกิจกรรม
              </button>
            </div>

            {/* Add Form */}
            {showActivityForm && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-blue-200 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">เพิ่มกิจกรรมใหม่</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="ชื่อกิจกรรม (เช่น กายภาพบำบัด)"
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="รายละเอียด"
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 h-24 resize-none"
                    value={activityDesc}
                    onChange={(e) => setActivityDesc(e.target.value)}
                  />
                  <input
                    type="time"
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    value={activityTime}
                    onChange={(e) => setActivityTime(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowActivityForm(false)}
                      className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleAddActivity}
                      className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Activity List */}
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className={`bg-white rounded-2xl p-5 shadow-sm border ${activity.completed ? "border-blue-200 bg-blue-50/30" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleActivityComplete(activity.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activity.completed ? "bg-blue-500" : "bg-gray-100 hover:bg-gray-200"} transition-colors`}
                      >
                        {activity.completed && <CheckCircle2 size={24} className="text-white" />}
                      </button>
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${activity.completed ? "text-gray-500 line-through" : "text-gray-800"}`}>
                          {activity.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{activity.time} น.</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-100 flex justify-around py-3 pb-6 sm:pb-3 sticky bottom-0 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-2xl shrink-0">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${activeTab === "home" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className={`p-1 rounded-xl mb-1 ${activeTab === "home" ? "bg-purple-50" : ""}`}>
            <Home size={26} strokeWidth={activeTab === "home" ? 2.5 : 2} />
          </div>
          <span className="text-xs font-bold">หน้าหลัก</span>
        </button>
        <button
          onClick={() => setActiveTab("caregivers")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${activeTab === "caregivers" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className={`p-1 rounded-xl mb-1 ${activeTab === "caregivers" ? "bg-purple-50" : ""}`}>
            <Users size={26} strokeWidth={activeTab === "caregivers" ? 2.5 : 2} />
          </div>
          <span className="text-xs font-bold">ผู้ดูแล</span>
        </button>
        <button
          onClick={() => setActiveTab("bills")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${activeTab === "bills" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className={`p-1 rounded-xl mb-1 ${activeTab === "bills" ? "bg-purple-50" : ""}`}>
            <Wallet size={26} strokeWidth={activeTab === "bills" ? 2.5 : 2} />
          </div>
          <span className="text-xs font-bold">บัญชี</span>
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${activeTab === "activities" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className={`p-1 rounded-xl mb-1 ${activeTab === "activities" ? "bg-purple-50" : ""}`}>
            <Activity size={26} strokeWidth={activeTab === "activities" ? 2.5 : 2} />
          </div>
          <span className="text-xs font-bold">กิจกรรม</span>
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${activeTab === "calendar" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className={`p-1 rounded-xl mb-1 ${activeTab === "calendar" ? "bg-purple-50" : ""}`}>
            <Calendar size={26} strokeWidth={activeTab === "calendar" ? 2.5 : 2} />
          </div>
          <span className="text-xs font-bold">ปฏิทิน</span>
        </button>
      </div>

      <CustomAlert
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />

      {/* Reports Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-blue-50 to-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 pb-8 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                    <FileText size={28} />
                    รายงานทั้งหมด
                  </h2>
                  <p className="text-blue-100 text-sm">ประวัติการดูแล {reports.length} รายการ</p>
                </div>
                <button
                  onClick={() => setShowReportsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={28} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-5 space-y-4">
              {reports.map((report, index) => (
                <div 
                  key={report.id} 
                  className={`bg-white rounded-2xl p-5 shadow-md border-2 transition-all hover:shadow-lg ${
                    report.status === "success" 
                      ? "border-green-200 hover:border-green-300" 
                      : "border-yellow-200 hover:border-yellow-300"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      report.status === "success" 
                        ? "bg-gradient-to-br from-green-400 to-emerald-500" 
                        : "bg-gradient-to-br from-yellow-400 to-orange-500"
                    }`}>
                      {report.status === "success" ? (
                        <CheckCircle2 size={28} className="text-white" />
                      ) : (
                        <AlertCircle size={28} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{report.title}</h3>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={14} />
                        <span className="text-sm">{report.time} น.</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm">{report.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-xl p-4 ${
                    report.status === "success" ? "bg-green-50" : "bg-yellow-50"
                  }`}>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {report.details}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 flex justify-end">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                      report.status === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {report.status === "success" ? "✓ ปกติ" : "⚠ ต้องติดตาม"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => setShowReportsModal(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-3 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Bell size={24} className="text-purple-500" />
                การแจ้งเตือน
              </h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`rounded-2xl p-4 border transition-all ${notification.isRead ? "bg-gray-50 border-gray-100" : "bg-purple-50 border-purple-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.isRead ? "bg-gray-200" : "bg-purple-500"}`}>
                      <Bell size={20} className={notification.isRead ? "text-gray-500" : "text-white"} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${notification.isRead ? "text-gray-600" : "text-gray-800"} mb-1`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{notification.time}</span>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowNotifications(false)}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Health Report Modal */}
      {showHealthReport && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-green-50 to-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 pb-8 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                    <FileText size={28} />
                    รายงานสุขภาพ
                  </h2>
                  <p className="text-green-100 text-sm">สำหรับนำไปให้แพทย์</p>
                </div>
                <button
                  onClick={() => setShowHealthReport(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={28} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-200px)] p-5 space-y-4">
              {/* Elder Info */}
              <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-green-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User size={20} className="text-green-600" />
                  ข้อมูลผู้สูงอายุ
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ชื่อ:</span>
                    <span className="font-bold text-gray-800">{selectedElder.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">อายุ:</span>
                    <span className="font-bold text-gray-800">{selectedElder.age} ปี</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ความสัมพันธ์:</span>
                    <span className="font-bold text-gray-800">{selectedElder.relation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">วันที่ออกรายงาน:</span>
                    <span className="font-bold text-gray-800">
                      {new Date().toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Caregivers */}
              <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-blue-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  ผู้ดูแล ({caregivers.length} คน)
                </h3>
                <div className="space-y-2">
                  {caregivers.map(c => (
                    <div key={c.id} className="bg-blue-50 p-3 rounded-xl">
                      <p className="font-bold text-gray-800">{c.name}</p>
                      <p className="text-sm text-gray-600">โทร: {c.phone}</p>
                      <p className="text-xs text-gray-500">รหัส: {c.pairingCode}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Health Reports */}
              <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-purple-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Activity size={20} className="text-purple-600" />
                  บันทึกสุขภาพล่าสุด (10 รายการ)
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reports.slice(0, 10).map(r => (
                    <div key={r.id} className={`p-3 rounded-xl ${r.status === 'success' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${r.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                          {r.status === 'success' ? <CheckCircle2 size={14} className="text-white" /> : <AlertCircle size={14} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-800">{r.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{r.details}</p>
                          <p className="text-xs text-gray-400 mt-1">{r.date} {r.time} น.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-indigo-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  กิจกรรมที่ต้องทำ
                </h3>
                <div className="space-y-2">
                  {activities.filter(a => !a.completed).length > 0 ? (
                    activities.filter(a => !a.completed).map(a => (
                      <div key={a.id} className="bg-indigo-50 p-3 rounded-xl">
                        <p className="font-bold text-sm text-gray-800">{a.title}</p>
                        <p className="text-xs text-gray-600">{a.description}</p>
                        <p className="text-xs text-gray-500 mt-1">เวลา: {a.time} น.</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">ไม่มีกิจกรรมค้าง</p>
                  )}
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-bold text-sm mb-1">ℹ️ เกี่ยวกับรายงาน</p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      รายงานนี้รวม: ข้อมูลผู้สูงอายุ, ผู้ดูแล, บันทึกสุขภาพ และกิจกรรม<br />
                      <strong className="text-blue-800">* ไม่รวมข้อมูลค่ารักษาพยาบาล</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] space-y-3">
              <button
                onClick={exportHealthReport}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
              >
                <Download size={20} />
                ดาวน์โหลดรายงาน PDF
              </button>
              <button
                onClick={() => setShowHealthReport(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
