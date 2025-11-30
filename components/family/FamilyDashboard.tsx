"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  MapPin,
  Pill,
} from "lucide-react";
import CustomAlert from "../CustomAlert";

interface Elder {
  id: string;
  name: string;
  age: number;
  relation: string;
  profileColor: string;
  pairingCode: string; // รหัสสำหรับให้ผู้ดูแลจับคู่
}

interface Caregiver {
  id: string;
  name: string;
  phone: string;
  email: string;
  verified: boolean;
  startDate: string;
  pairingCode: string;
  // ข้อมูลส่วนตัว
  idCard: string;
  dateOfBirth?: string;
  gender?: string; // male, female, other
  address: string;
  subDistrict?: string; // ตำบล
  district?: string; // อำเภอ
  province?: string; // จังหวัด
  postalCode?: string; // รหัสไปรษณีย์
  // ผู้ติดต่อฉุกเฉิน
  emergencyContact: string;
  emergencyName: string;
  emergencyRelation?: string;
  // ข้อมูลการทำงาน
  experience: string;
  certificate: string;
  // การจ้างงาน
  salary: string;
  salaryType: string; // monthly, daily, hourly
  workSchedule: string;
  employmentType: string; // full-time, part-time, contract
  contractStartDate?: string; // วันที่เริ่มสัญญา
  contractEndDate?: string; // วันที่สิ้นสุดสัญญา (สำหรับ contract)
  // รูปภาพ
  idCardImage?: string;
  certificateImage?: string;
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
  completedAt?: string | null;
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

interface Attendance {
  id: string;
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  hoursWorked: number;
  overtimeHours: number;
  isOvertime: boolean;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

interface Props {
  selectedElder: Elder;
  onBack: () => void; // ฟังก์ชันย้อนกลับไปเลือกคุณยาย
}

export default function FamilyDashboard({ selectedElder, onBack }: Props) {
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteActivityId, setConfirmDeleteActivityId] = useState<
    string | null
  >(null);
  const [confirmDeleteBillId, setConfirmDeleteBillId] = useState<string | null>(
    null
  );
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loadingCaregivers, setLoadingCaregivers] = useState(false);
  // Bills: API states
  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);

  // กิจกรรม: API states
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityDate, setActivityDate] = useState("");

  // Appointment & Activity Functions (API)
  // const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";
  // ดึง token จาก cookie
  const token = typeof window !== "undefined" ? Cookies.get("token") || "" : "";

  // ดึงบัญชีจาก backend เมื่อเปลี่ยน elder
  React.useEffect(() => {
    if (!selectedElder?.id) return;
    setLoadingBills(true);
    fetch(`${BASE_URL}/family/bills?elderId=${selectedElder.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // แปลง amount เป็น number เพื่อป้องกันการต่อ string
        const billsData = Array.isArray(data)
          ? data.map((bill: any) => ({
              ...bill,
              amount: Number(bill.amount),
            }))
          : [];
        setBills(billsData);
        setLoadingBills(false);
      })
      .catch(() => {
        setBills([]);
        setLoadingBills(false);
      });
  }, [selectedElder?.id, BASE_URL, token]);

  // ดึงกิจกรรมจาก backend เมื่อเปลี่ยน elder
  React.useEffect(() => {
    if (!selectedElder?.id) return;
    setLoadingActivities(true);
    fetch(`${BASE_URL}/family/activities?elderId=${selectedElder.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setActivities(Array.isArray(data) ? data : []);
        setLoadingActivities(false);
      })
      .catch(() => {
        setActivities([]);
        setLoadingActivities(false);
      });
  }, [selectedElder?.id, BASE_URL, token]);

  // ดึงรายชื่อผู้ดูแลจาก backend (เฉพาะของผู้สูงอายุที่เลือก)
  React.useEffect(() => {
    if (!selectedElder?.id) {
      setCaregivers([]);
      return;
    }
    setLoadingCaregivers(true);
    fetch(`${BASE_URL}/family/caregivers?elderId=${selectedElder.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setCaregivers(Array.isArray(data) ? data : []);
        setLoadingCaregivers(false);
      })
      .catch(() => {
        setCaregivers([]);
        setLoadingCaregivers(false);
      });
  }, [selectedElder?.id, BASE_URL, token]);

  // ดึง notifications จาก backend
  React.useEffect(() => {
    setLoadingNotifications(true);
    fetch(`${BASE_URL}/family/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoadingNotifications(false);
      })
      .catch(() => {
        setNotifications([]);
        setLoadingNotifications(false);
      });
  }, [BASE_URL, token]);

  // ดึงข้อมูลสุขภาพล่าสุด
  React.useEffect(() => {
    if (!selectedElder?.id) {
      setLatestHealth(null);
      setHealthRecords([]);
      return;
    }
    setLoadingHealth(true);
    // Fetch latest health record
    fetch(`${BASE_URL}/health/latest?elderId=${selectedElder.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setLatestHealth(data);
      })
      .catch(() => {
        setLatestHealth(null);
      });
    
    // Fetch all health records
    fetch(`${BASE_URL}/health/records?elderId=${selectedElder.id}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setHealthRecords(Array.isArray(data) ? data : []);
        setLoadingHealth(false);
      })
      .catch(() => {
        setHealthRecords([]);
        setLoadingHealth(false);
      });
  }, [selectedElder?.id, BASE_URL, token]);

  // ดึงข้อมูล Daily Reports สำหรับแสดง mood
  React.useEffect(() => {
    if (!selectedElder?.id) {
      setReports([]);
      return;
    }
    setLoadingReports(true);
    fetch(`${BASE_URL}/family/reports?elderId=${selectedElder.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoadingReports(false);
      })
      .catch(() => {
        setReports([]);
        setLoadingReports(false);
      });
  }, [selectedElder?.id, BASE_URL, token]);

  // ดึงข้อมูล attendance ของผู้ดูแลทั้งหมด
  React.useEffect(() => {
    if (!caregivers.length) {
      setCaregiverAttendances({});
      return;
    }

    setLoadingAttendances(true);
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // ดึงข้อมูล attendance ของแต่ละผู้ดูแล
    Promise.all(
      caregivers.map(async (caregiver) => {
        try {
          const res = await fetch(
            `${BASE_URL}/caregiver/attendance/caregiver/${caregiver.id}?month=${month}&year=${year}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          return {
            caregiverId: caregiver.id,
            attendances: data.attendances || [],
          };
        } catch {
          return { caregiverId: caregiver.id, attendances: [] };
        }
      })
    ).then((results) => {
      const attendanceMap: { [key: string]: Attendance[] } = {};
      results.forEach(({ caregiverId, attendances }) => {
        attendanceMap[caregiverId] = attendances;
      });
      setCaregiverAttendances(attendanceMap);
      setLoadingAttendances(false);
    });
  }, [caregivers, BASE_URL, token]);

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
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(
    null
  );
  const [confirmDeleteCaregiverId, setConfirmDeleteCaregiverId] = useState<
    string | null
  >(null);
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [caregiverGender, setCaregiverGender] = useState("");
  const [caregiverDateOfBirth, setCaregiverDateOfBirth] = useState("");
  const [caregiverIdCard, setCaregiverIdCard] = useState("");
  const [caregiverAddress, setCaregiverAddress] = useState("");
  const [caregiverSubDistrict, setCaregiverSubDistrict] = useState("");
  const [caregiverDistrict, setCaregiverDistrict] = useState("");
  const [caregiverProvince, setCaregiverProvince] = useState("");
  const [caregiverPostalCode, setCaregiverPostalCode] = useState("");
  const [caregiverEmergencyContact, setCaregiverEmergencyContact] =
    useState("");
  const [caregiverEmergencyName, setCaregiverEmergencyName] = useState("");
  const [caregiverEmergencyRelation, setCaregiverEmergencyRelation] =
    useState("");
  const [caregiverExperience, setCaregiverExperience] = useState("");
  const [caregiverCertificate, setCaregiverCertificate] = useState("");
  const [caregiverSalary, setCaregiverSalary] = useState("");
  const [caregiverSalaryType, setCaregiverSalaryType] = useState("monthly");
  const [caregiverEmploymentType, setCaregiverEmploymentType] =
    useState("full-time");
  const [caregiverWorkSchedule, setCaregiverWorkSchedule] = useState("");
  const [caregiverContractStartDate, setCaregiverContractStartDate] =
    useState("");
  const [caregiverContractEndDate, setCaregiverContractEndDate] = useState("");
  const [caregiverWorkDays, setCaregiverWorkDays] = useState<string[]>([]);
  const [caregiverWorkTimeStart, setCaregiverWorkTimeStart] = useState("");
  const [caregiverWorkTimeEnd, setCaregiverWorkTimeEnd] = useState("");
  const [caregiverIdCardImage, setCaregiverIdCardImage] = useState("");
  const [caregiverCertificateImage, setCaregiverCertificateImage] =
    useState("");

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<
    "doctor" | "checkup" | "therapy" | "other"
  >("doctor");
  const [appointmentLocation, setAppointmentLocation] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [appointmentReminder, setAppointmentReminder] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Health Status
  const [latestHealth, setLatestHealth] = useState<any>(null);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Daily Reports for mood tracking
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Caregiver Attendance
  const [caregiverAttendances, setCaregiverAttendances] = useState<{
    [key: string]: Attendance[];
  }>({});
  const [loadingAttendances, setLoadingAttendances] = useState(false);
  const [selectedCaregiverForAttendance, setSelectedCaregiverForAttendance] =
    useState<string | null>(null);

  // Health Report Export
  const [showHealthReport, setShowHealthReport] = useState(false);

  const showAlertMessage = (
    title: string,
    message: string,
    type: AlertType = "info"
  ) => {
    setAlert({ isOpen: true, title, message, type });
  };

  // Generate unique 6-digit pairing code
  const generatePairingCode = (name: string): string => {
    // ใช้ตัวอักษรแรกของชื่อ + ตัวเลข random
    const initials = name.replace(/\s/g, "").substring(0, 2).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 หลัก
    return `${initials}${randomNum}`;
  };

  // Copy pairing code to clipboard
  const copyPairingCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code).then(() => {
      showAlertMessage(
        "คัดลอกแล้ว",
        `คัดลอกรหัสจับคู่ของ ${name} แล้ว: ${code}`,
        "success"
      );
    });
  };

  const handleAddCaregiver = async () => {
    if (
      !caregiverName ||
      !caregiverPhone ||
      !caregiverEmail ||
      !caregiverIdCard ||
      !caregiverAddress
    ) {
      showAlertMessage(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน",
        "error"
      );
      return;
    }

    // Validate contract-specific fields
    if (caregiverEmploymentType === "contract") {
      if (!caregiverContractStartDate || !caregiverContractEndDate) {
        showAlertMessage(
          "ข้อมูลไม่ครบ",
          "กรุณาระบุวันที่เริ่มงานและวันที่สิ้นสุดสำหรับสัญญาจ้าง",
          "error"
        );
        return;
      }
    } else {
      if (!caregiverContractStartDate) {
        showAlertMessage("ข้อมูลไม่ครบ", "กรุณาระบุวันที่เริ่มงาน", "error");
        return;
      }
    }

    if (caregiverWorkDays.length === 0) {
      showAlertMessage("ข้อมูลไม่ครบ", "กรุณาเลือกวันทำงาน", "error");
      return;
    }

    if (!caregiverWorkTimeStart || !caregiverWorkTimeEnd) {
      showAlertMessage("ข้อมูลไม่ครบ", "กรุณาระบุเวลาทำงาน", "error");
      return;
    }

    // Build workSchedule string
    const daysMap: { [key: string]: string } = {
      mon: "จ",
      tue: "อ",
      wed: "พ",
      thu: "พฤ",
      fri: "ศ",
      sat: "ส",
      sun: "อา",
    };
    const selectedDaysText = caregiverWorkDays
      .map((d) => daysMap[d])
      .join(", ");
    const workScheduleText = `${selectedDaysText} ${caregiverWorkTimeStart}-${caregiverWorkTimeEnd}`;

    try {
      if (editingCaregiver) {
        // Update existing caregiver
        const res = await fetch(
          `${BASE_URL}/family/caregivers/${editingCaregiver.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: caregiverName,
              phone: caregiverPhone,
              email: caregiverEmail,
              gender: caregiverGender || null,
              dateOfBirth: caregiverDateOfBirth || null,
              idCard: caregiverIdCard,
              address: caregiverAddress,
              subDistrict: caregiverSubDistrict || null,
              district: caregiverDistrict || null,
              province: caregiverProvince || null,
              postalCode: caregiverPostalCode || null,
              emergencyContact: caregiverEmergencyContact,
              emergencyName: caregiverEmergencyName,
              emergencyRelation: caregiverEmergencyRelation || null,
              experience: caregiverExperience,
              certificate: caregiverCertificate,
              salary: caregiverSalary ? parseFloat(caregiverSalary) : null, // แปลงเป็น decimal
              salaryType: caregiverSalaryType,
              employmentType: caregiverEmploymentType,
              workSchedule: workScheduleText,
              contractStartDate: caregiverContractStartDate || null,
              contractEndDate:
                caregiverEmploymentType === "contract"
                  ? caregiverContractEndDate
                  : null,
              idCardImage: caregiverIdCardImage || null,
              certificateImage: caregiverCertificateImage || null,
            }),
          }
        );
        const data = await res.json();
        if (res.ok && data.id) {
          showAlertMessage(
            "แก้ไขสำเร็จ",
            `แก้ไขข้อมูล ${caregiverName} เรียบร้อย`,
            "success"
          );
          setLoadingCaregivers(true);
          setTimeout(() => {
            fetch(`${BASE_URL}/family/caregivers?elderId=${selectedElder.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((res) => res.json())
              .then((data) => {
                setCaregivers(Array.isArray(data) ? data : []);
                setLoadingCaregivers(false);
              });
          }, 300);
        } else {
          showAlertMessage(
            "แก้ไขล้มเหลว",
            data.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล",
            "error"
          );
        }
      } else {
        // Add new caregiver
        const res = await fetch(`${BASE_URL}/family/caregivers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: caregiverName,
            phone: caregiverPhone,
            email: caregiverEmail,
            gender: caregiverGender || null,
            dateOfBirth: caregiverDateOfBirth || null,
            idCard: caregiverIdCard,
            address: caregiverAddress,
            subDistrict: caregiverSubDistrict || null,
            district: caregiverDistrict || null,
            province: caregiverProvince || null,
            postalCode: caregiverPostalCode || null,
            emergencyContact: caregiverEmergencyContact,
            emergencyName: caregiverEmergencyName,
            emergencyRelation: caregiverEmergencyRelation || null,
            experience: caregiverExperience,
            certificate: caregiverCertificate,
            salary: caregiverSalary ? parseFloat(caregiverSalary) : null, // แปลงเป็น decimal
            salaryType: caregiverSalaryType,
            employmentType: caregiverEmploymentType,
            workSchedule: workScheduleText,
            contractStartDate: caregiverContractStartDate || null,
            contractEndDate:
              caregiverEmploymentType === "contract"
                ? caregiverContractEndDate
                : null,
            idCardImage: caregiverIdCardImage || null,
            certificateImage: caregiverCertificateImage || null,
            elderId: selectedElder.id,
          }),
        });
        const data = await res.json();
        if (res.ok && data.id) {
          showAlertMessage(
            "เพิ่มสำเร็จ",
            `เพิ่มผู้ดูแล ${caregiverName} เรียบร้อย\nกรุณาให้ผู้ดูแลใช้รหัส ${selectedElder.pairingCode} เพื่อจับคู่ในแอพผู้ดูแล`,
            "success"
          );
          setLoadingCaregivers(true);
          setTimeout(() => {
            fetch(`${BASE_URL}/family/caregivers?elderId=${selectedElder.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((res) => res.json())
              .then((data) => {
                setCaregivers(Array.isArray(data) ? data : []);
                setLoadingCaregivers(false);
              });
          }, 300);
        } else {
          showAlertMessage(
            "เพิ่มล้มเหลว",
            data.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล",
            "error"
          );
        }
      }

      // Reset form
      handleCancelCaregiverForm();
    } catch {
      showAlertMessage(
        "ข้อผิดพลาด",
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error"
      );
    }
  };

  const handleEditCaregiver = (caregiver: Caregiver) => {
    setEditingCaregiver(caregiver);
    setCaregiverName(caregiver.name);
    setCaregiverPhone(caregiver.phone);
    setCaregiverEmail(caregiver.email);
    setCaregiverGender(caregiver.gender || "");

    // แปลง DateTime เป็น YYYY-MM-DD สำหรับ input type="date"
    const formatDateForInput = (dateString?: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    setCaregiverDateOfBirth(formatDateForInput(caregiver.dateOfBirth));
    setCaregiverIdCard(caregiver.idCard);
    setCaregiverAddress(caregiver.address);
    setCaregiverSubDistrict(caregiver.subDistrict || "");
    setCaregiverDistrict(caregiver.district || "");
    setCaregiverProvince(caregiver.province || "");
    setCaregiverPostalCode(caregiver.postalCode || "");
    setCaregiverEmergencyContact(caregiver.emergencyContact);
    setCaregiverEmergencyName(caregiver.emergencyName);
    setCaregiverEmergencyRelation(caregiver.emergencyRelation || "");
    setCaregiverExperience(caregiver.experience);
    setCaregiverCertificate(caregiver.certificate);
    setCaregiverSalary(caregiver.salary);
    setCaregiverSalaryType(caregiver.salaryType);
    setCaregiverEmploymentType(caregiver.employmentType);
    setCaregiverContractStartDate(
      formatDateForInput(caregiver.contractStartDate)
    );
    setCaregiverContractEndDate(formatDateForInput(caregiver.contractEndDate));
    setCaregiverIdCardImage(caregiver.idCardImage || "");
    setCaregiverCertificateImage(caregiver.certificateImage || "");

    // Parse workSchedule to extract days and time
    if (caregiver.workSchedule) {
      // Format: "จ, อ, พ 08:00-17:00"
      const parts = caregiver.workSchedule.split(" ");
      if (parts.length >= 2) {
        const daysText = parts.slice(0, -1).join(" ");
        const timeRange = parts[parts.length - 1];

        // Map Thai days back to English
        const reverseDaysMap: { [key: string]: string } = {
          จ: "mon",
          อ: "tue",
          พ: "wed",
          พฤ: "thu",
          ศ: "fri",
          ส: "sat",
          อา: "sun",
        };
        const daysList = daysText
          .split(",")
          .map((d) => d.trim())
          .map((d) => reverseDaysMap[d])
          .filter(Boolean);
        setCaregiverWorkDays(daysList);

        if (timeRange.includes("-")) {
          const [start, end] = timeRange.split("-");
          setCaregiverWorkTimeStart(start);
          setCaregiverWorkTimeEnd(end);
        }
      }
    } else {
      setCaregiverWorkDays([]);
      setCaregiverWorkTimeStart("");
      setCaregiverWorkTimeEnd("");
    }

    setShowCaregiverForm(true);
  };

  const handleCancelCaregiverForm = () => {
    setCaregiverName("");
    setCaregiverPhone("");
    setCaregiverEmail("");
    setCaregiverGender("");
    setCaregiverDateOfBirth("");
    setCaregiverIdCard("");
    setCaregiverAddress("");
    setCaregiverSubDistrict("");
    setCaregiverDistrict("");
    setCaregiverProvince("");
    setCaregiverPostalCode("");
    setCaregiverEmergencyContact("");
    setCaregiverEmergencyName("");
    setCaregiverEmergencyRelation("");
    setCaregiverExperience("");
    setCaregiverCertificate("");
    setCaregiverSalary("");
    setCaregiverSalaryType("monthly");
    setCaregiverEmploymentType("full-time");
    setCaregiverWorkSchedule("");
    setCaregiverContractStartDate("");
    setCaregiverContractEndDate("");
    setCaregiverWorkDays([]);
    setCaregiverWorkTimeStart("");
    setCaregiverWorkTimeEnd("");
    setCaregiverIdCardImage("");
    setCaregiverCertificateImage("");
    setEditingCaregiver(null);
    setShowCaregiverForm(false);
  };

  const handleDeleteCaregiver = (id: string) => {
    setConfirmDeleteCaregiverId(id);
  };

  const handleDeleteCaregiverConfirmed = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/family/caregivers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlertMessage("ลบแล้ว", "ลบผู้ดูแลเรียบร้อย", "info");
        setLoadingCaregivers(true);
        setTimeout(() => {
          fetch(`${BASE_URL}/family/caregivers?elderId=${selectedElder.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((data) => {
              setCaregivers(Array.isArray(data) ? data : []);
              setLoadingCaregivers(false);
            });
        }, 300);
      } else {
        showAlertMessage(
          "ลบล้มเหลว",
          data.message || "เกิดข้อผิดพลาดในการลบข้อมูล",
          "error"
        );
      }
    } catch {
      showAlertMessage("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    }
  };

  // ยืนยันตัวตนผู้ดูแล
  const handleVerifyCaregiver = async (id: string, name: string) => {
    try {
      const res = await fetch(`${BASE_URL}/family/caregivers/${id}/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlertMessage(
          "ยืนยันสำเร็จ",
          `ยืนยันตัวตน ${name} เรียบร้อย`,
          "success"
        );
        setLoadingCaregivers(true);
        setTimeout(() => {
          fetch(`${BASE_URL}/family/caregivers?elderId=${selectedElder.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((data) => {
              setCaregivers(Array.isArray(data) ? data : []);
              setLoadingCaregivers(false);
            });
        }, 300);
      } else {
        showAlertMessage(
          "ยืนยันล้มเหลว",
          data.message || "เกิดข้อผิดพลาดในการยืนยันตัวตน",
          "error"
        );
      }
    } catch {
      showAlertMessage("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการยืนยันตัวตน", "error");
    }
  };

  // เพิ่มบัญชีผ่าน API
  const handleAddBill = async () => {
    if (!billDesc || !billAmount || !billCategory) {
      showAlertMessage("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
      return;
    }
    try {
      let res, data;
      if (editingBill) {
        // กรณีแก้ไขบิล
        res = await fetch(`${BASE_URL}/family/bills/${editingBill.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: billDesc,
            amount: parseFloat(billAmount),
            category: billCategory,
          }),
        });
        data = await res.json();
        if (res.ok && data.id) {
          setBillDesc("");
          setBillAmount("");
          setBillCategory("");
          setEditingBill(null);
          setShowBillForm(false);
          showAlertMessage(
            "แก้ไขสำเร็จ",
            "แก้ไขรายการบัญชีเรียบร้อย",
            "success"
          );
          setLoadingBills(true);
          setTimeout(() => reloadBills(), 300);
        } else {
          showAlertMessage(
            "แก้ไขล้มเหลว",
            data.message || "เกิดข้อผิดพลาดในการแก้ไขรายการ",
            "error"
          );
        }
      } else {
        // กรณีเพิ่มบิลใหม่
        res = await fetch(`${BASE_URL}/family/bills`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: billDesc,
            amount: parseFloat(billAmount),
            category: billCategory,
            elderId: selectedElder.id,
          }),
        });
        data = await res.json();
        if (res.ok && data.id) {
          setBillDesc("");
          setBillAmount("");
          setBillCategory("");
          setShowBillForm(false);
          showAlertMessage(
            "เพิ่มสำเร็จ",
            "เพิ่มรายการบัญชีเรียบร้อย",
            "success"
          );
          setLoadingBills(true);
          setTimeout(() => reloadBills(), 300);
        } else {
          showAlertMessage(
            "เพิ่มล้มเหลว",
            data.message || "เกิดข้อผิดพลาดในการเพิ่มรายการ",
            "error"
          );
        }
      }
    } catch {
      showAlertMessage(
        "ข้อผิดพลาด",
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error"
      );
    }
  };

  // โหลดบัญชีใหม่
  const reloadBills = () => {
    fetch(`${BASE_URL}/family/bills?elderId=${selectedElder.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // แปลง amount เป็น number เพื่อป้องกันการต่อ string
        const billsData = Array.isArray(data)
          ? data.map((bill: any) => ({
              ...bill,
              amount: Number(bill.amount),
            }))
          : [];
        setBills(billsData);
        setLoadingBills(false);
      });
  };

  // toggle paid status ผ่าน API
  const toggleBillPaid = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/family/bills/${id}/toggle-paid`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setLoadingBills(true);
        setTimeout(() => reloadBills(), 300);
      } else {
        showAlertMessage(
          "เปลี่ยนสถานะล้มเหลว",
          data.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ",
          "error"
        );
      }
    } catch {
      showAlertMessage(
        "ข้อผิดพลาด",
        "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ",
        "error"
      );
    }
  };

  // ลบบัญชีผ่าน API
  const handleDeleteBill = (id: string) => {
    setConfirmDeleteBillId(id);
  };

  const handleDeleteBillConfirmed = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/family/bills/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlertMessage("ลบแล้ว", "ลบรายการบัญชีเรียบร้อย", "info");
        setLoadingBills(true);
        setTimeout(() => reloadBills(), 300);
      } else {
        showAlertMessage(
          "ลบล้มเหลว",
          data.message || "เกิดข้อผิดพลาดในการลบ",
          "error"
        );
      }
    } catch {
      showAlertMessage("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    } finally {
      setConfirmDeleteBillId(null);
    }
  };

  // เพิ่มหรือแก้ไขกิจกรรมผ่าน API
  const handleAddActivity = async () => {
    if (!activityTitle || !activityDesc || !activityTime) {
      showAlertMessage("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
      return;
    }
    try {
      if (editingActivity) {
        // PATCH
        const res = await fetch(
          `${BASE_URL}/family/activities/${editingActivity.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: activityTitle,
              description: activityDesc,
              time: activityTime,
              date: activityDate || editingActivity.date,
            }),
          }
        );
        const data = await res.json();
        if (res.ok && data.id) {
          showAlertMessage("แก้ไขสำเร็จ", "แก้ไขกิจกรรมเรียบร้อย", "success");
          setEditingActivity(null);
          setActivityTitle("");
          setActivityDesc("");
          setActivityTime("");
          setActivityDate("");
          setShowActivityForm(false);
          setLoadingActivities(true);
          setTimeout(() => reloadActivities(), 300);
        } else {
          showAlertMessage(
            "แก้ไขล้มเหลว",
            data.message || "เกิดข้อผิดพลาดในการแก้ไขกิจกรรม",
            "error"
          );
        }
      } else {
        // POST
        const res = await fetch(`${BASE_URL}/family/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: activityTitle,
            description: activityDesc,
            time: activityTime,
            date: new Date().toISOString().split("T")[0],
            elderId: selectedElder.id,
          }),
        });
        const data = await res.json();
        if (res.ok && data.activity) {
          setActivityTitle("");
          setActivityDesc("");
          setActivityTime("");
          setActivityDate("");
          setShowActivityForm(false);
          showAlertMessage(
            "เพิ่มสำเร็จ",
            data.message || "เพิ่มกิจกรรมเรียบร้อย",
            "success"
          );
          setLoadingActivities(true);
          setTimeout(() => reloadActivities(), 300);
        } else {
          showAlertMessage(
            "เพิ่มล้มเหลว",
            data.message || "เกิดข้อผิดพลาดในการเพิ่มกิจกรรม",
            "error"
          );
        }
      }
    } catch {
      showAlertMessage(
        "ข้อผิดพลาด",
        "เกิดข้อผิดพลาดในการบันทึกกิจกรรม",
        "error"
      );
    }
  };

  // โหลดกิจกรรมใหม่
  const reloadActivities = () => {
    fetch(`${BASE_URL}/family/activities?elderId=${selectedElder.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setActivities(Array.isArray(data) ? data : []);
        setLoadingActivities(false);
      });
  };

  // toggle completed ผ่าน API
  const toggleActivityComplete = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/family/activities/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setLoadingActivities(true);
        setTimeout(() => reloadActivities(), 300);
      } else {
        showAlertMessage(
          "เปลี่ยนสถานะล้มเหลว",
          data.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะกิจกรรม",
          "error"
        );
      }
    } catch {
      showAlertMessage(
        "ข้อผิดพลาด",
        "เกิดข้อผิดพลาดในการเปลี่ยนสถานะกิจกรรม",
        "error"
      );
    }
  };

  // ลบกิจกรรมผ่าน API
  const handleDeleteActivity = (id: string) => {
    setConfirmDeleteActivityId(id);
  };

  // ฟังก์ชันลบจริงหลังยืนยัน
  const handleDeleteActivityConfirmed = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/family/activities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlertMessage("ลบแล้ว", "ลบกิจกรรมเรียบร้อย", "info");
        setLoadingActivities(true);
        setTimeout(() => reloadActivities(), 300);
      } else {
        showAlertMessage(
          "ลบล้มเหลว",
          data.message || "เกิดข้อผิดพลาดในการลบกิจกรรม",
          "error"
        );
      }
    } catch {
      showAlertMessage("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการลบกิจกรรม", "error");
    }
    setConfirmDeleteActivityId(null);
  };

  // กดแก้ไขกิจกรรม
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityTitle(activity.title);
    setActivityDesc(activity.description);
    setActivityTime(activity.time);
    setActivityDate(activity.date);
    setShowActivityForm(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 100);
  };

  // ยกเลิกฟอร์มกิจกรรม
  const handleCancelActivityForm = () => {
    setEditingActivity(null);
    setActivityTitle("");
    setActivityDesc("");
    setActivityTime("");
    setActivityDate("");
    setShowActivityForm(false);
  };

  // ดึง appointments จาก backend เมื่อเปลี่ยน elder หรือเดือน
  React.useEffect(() => {
    if (!selectedElder?.id) return;
    setLoadingAppointments(true);
    // ดึงเฉพาะเดือนปัจจุบัน
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    fetch(
      `${BASE_URL}/family/appointments?elderId=${selectedElder.id}&startDate=${startDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAppointments(data);
        } else {
          setAppointments([]);
        }
        setLoadingAppointments(false);
      })
      .catch(() => {
        setAppointments([]);
        setLoadingAppointments(false);
      });
  }, [selectedElder?.id, currentMonth, BASE_URL, token]);

  // เพิ่ม/แก้ไข/ลบ appointment ผ่าน backend
  const handleAddAppointment = async () => {
    if (!appointmentTitle || !appointmentDate || !appointmentTime) {
      showAlertMessage("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบถ้วน", "error");
      return;
    }
    try {
      if (editingAppointment) {
        // PATCH
        const res = await fetch(
          `${BASE_URL}/family/appointments/${editingAppointment.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: appointmentTitle,
              date: appointmentDate,
              time: appointmentTime,
              type: appointmentType,
              location: appointmentLocation,
              notes: appointmentNotes,
              reminder: appointmentReminder,
            }),
          }
        );
        const data = await res.json();
        if (res.ok && data.id) {
          showAlertMessage("แก้ไขสำเร็จ", "แก้ไขนัดหมายเรียบร้อย", "success");
          // รีโหลดใหม่
          setEditingAppointment(null);
          setShowAppointmentForm(false);
          setAppointmentTitle("");
          setAppointmentDate("");
          setAppointmentTime("");
          setAppointmentType("doctor");
          setAppointmentLocation("");
          setAppointmentNotes("");
          setAppointmentReminder(true);
          // reload
          setLoadingAppointments(true);
          setTimeout(() => {
            // trigger reload
            setCurrentMonth(new Date(currentMonth));
          }, 300);
        } else {
          showAlertMessage(
            "แก้ไขล้มเหลว",
            data.message || "เกิดข้อผิดพลาดในการแก้ไข",
            "error"
          );
        }
      } else {
        // POST
        const res = await fetch(`${BASE_URL}/family/appointments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: appointmentTitle,
            date: appointmentDate,
            time: appointmentTime,
            type: appointmentType,
            location: appointmentLocation,
            notes: appointmentNotes,
            reminder: appointmentReminder,
            elderId: selectedElder.id,
          }),
        });
        const data = await res.json();
        if (res.ok && data.id) {
          showAlertMessage("เพิ่มสำเร็จ", "เพิ่มนัดหมายเรียบร้อย", "success");
          setShowAppointmentForm(false);
          setAppointmentTitle("");
          setAppointmentDate("");
          setAppointmentTime("");
          setAppointmentType("doctor");
          setAppointmentLocation("");
          setAppointmentNotes("");
          setAppointmentReminder(true);
          // reload
          setLoadingAppointments(true);
          setTimeout(() => {
            setCurrentMonth(new Date(currentMonth));
          }, 300);
        } else {
          showAlertMessage(
            "เพิ่มล้มเหลว",
            data.message || "เกิดข้อผิดพลาดในการเพิ่ม",
            "error"
          );
        }
      }
    } catch {
      showAlertMessage(
        "ข้อผิดพลาด",
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error"
      );
    }
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
    // Scroll to top instantly
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 100);
  };

  // ฟังก์ชันลบจริงหลังยืนยัน
  const handleDeleteAppointmentConfirmed = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/family/appointments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        showAlertMessage("ลบแล้ว", "ลบนัดหมายเรียบร้อย", "info");
        setLoadingAppointments(true);
        setTimeout(() => {
          setCurrentMonth(new Date(currentMonth));
        }, 300);
      } else {
        showAlertMessage(
          "ลบล้มเหลว",
          data.message || "เกิดข้อผิดพลาดในการลบ",
          "error"
        );
      }
    } catch {
      showAlertMessage("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    }
    setConfirmDeleteId(null);
  };

  // เรียก dialog ก่อนลบ
  const handleDeleteAppointment = (id: string) => {
    setConfirmDeleteId(id);
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
    return appointments.filter((apt) => apt.date === date);
  };

  const formatThaiMonth = (date: Date) => {
    const months = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  const changeMonth = (direction: number) => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + direction,
        1
      )
    );
  };

  // Mark notification as read
  const markNotificationAsRead = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/family/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Update local state
        setNotifications(
          notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getAppointmentTypeLabel = (type: string) => {
    const labels = {
      doctor: "นัดหมอ",
      checkup: "ตรวจสุขภาพ",
      therapy: "กายภาพบำบัด",
      other: "อื่นๆ",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAppointmentTypeColor = (type: string) => {
    const colors = {
      doctor: "bg-red-100 text-red-700 border-red-200",
      checkup: "bg-blue-100 text-blue-700 border-blue-200",
      therapy: "bg-green-100 text-green-700 border-green-200",
      other: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  // Get upcoming appointments (next 7 days)
  const getUpcomingAppointments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date);
        return aptDate >= today && aptDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Helper function to format date for display
  const formatDateDisplay = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (dateTimeString?: string | null) => {
    if (!dateTimeString) return "-";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get today's attendance for a caregiver
  const getTodayAttendance = (caregiverId: string): Attendance | null => {
    const attendances = caregiverAttendances[caregiverId] || [];
    const today = new Date().toISOString().split("T")[0];
    return (
      attendances.find((att) => att.workDate.split("T")[0] === today) || null
    );
  };

  // Get attendance status badge
  const getAttendanceStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: string } } = {
      present: {
        label: "มาทำงาน",
        color: "bg-green-100 text-green-700 border-green-200",
      },
      late: {
        label: "มาสาย",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      },
      absent: {
        label: "ขาดงาน",
        color: "bg-red-100 text-red-700 border-red-200",
      },
      "on-leave": {
        label: "ลา",
        color: "bg-blue-100 text-blue-700 border-blue-200",
      },
      pending: {
        label: "ยังไม่เข้างาน",
        color: "bg-gray-100 text-gray-600 border-gray-200",
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const totalBills = bills.reduce((sum, b) => sum + Number(b.amount), 0);
  const unpaidBills = bills
    .filter((b) => !b.isPaid)
    .reduce((sum, b) => sum + Number(b.amount), 0);
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
          <div
            className={`w-12 h-12 rounded-full ${selectedElder.profileColor} border-2 border-white/30 flex items-center justify-center text-white font-bold text-xl`}
          >
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
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {notifications.filter((n) => !n.isRead).length}
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
                {loadingHealth ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                ) : latestHealth ? (
                  <>
                    <p className="text-2xl font-bold text-gray-800">
                      {latestHealth.type === "blood_pressure" &&
                      latestHealth.bloodPressure
                        ? `${latestHealth.bloodPressure}`
                        : latestHealth.type === "blood_sugar" &&
                          latestHealth.bloodSugar
                        ? `${latestHealth.bloodSugar} mg/dL`
                        : latestHealth.type === "temperature" &&
                          latestHealth.temperature
                        ? `${latestHealth.temperature}°C`
                        : latestHealth.type === "weight" && latestHealth.weight
                        ? `${latestHealth.weight} kg`
                        : "บันทึกแล้ว"}
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      {latestHealth.type === "blood_pressure"
                        ? "ความดัน"
                        : latestHealth.type === "blood_sugar"
                        ? "น้ำตาล"
                        : latestHealth.type === "temperature"
                        ? "อุณหภูมิ"
                        : latestHealth.type === "weight"
                        ? "น้ำหนัก"
                        : "สุขภาพ"}{" "}
                      •{" "}
                      {new Date(latestHealth.recordedAt).toLocaleDateString(
                        "th-TH",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-400">-</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      ยังไม่มีข้อมูล
                    </p>
                  </>
                )}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-blue-500" />
                  <p className="text-gray-500 text-xs font-medium">กิจกรรม</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {todayActivities}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  รอทำวันนี้
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-orange-100 text-sm mb-1">บัญชีค้างจ่าย</p>
                  <h2 className="text-4xl font-bold">
                    {unpaidBills.toLocaleString()}
                  </h2>
                  <p className="text-sm text-orange-100 mt-1">บาท</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl">
                  <DollarSign size={28} />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-orange-100">
                  รวมทั้งหมด: {totalBills.toLocaleString()} บาท
                </span>
              </div>
            </div>

            {/* Contact Caregiver */}
            <button
              onClick={() =>
                showAlertMessage(
                  "โทรหาผู้ดูแล",
                  "กำลังโทรหา คุณมานี...",
                  "info"
                )
              }
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
                    {editingCaregiver
                      ? "แก้ไขข้อมูลผู้ดูแล"
                      : "เพิ่มผู้ดูแลใหม่"}
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
                      <select
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverGender}
                        onChange={(e) => setCaregiverGender(e.target.value)}
                      >
                        <option value="">-- เลือกเพศ --</option>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                      <input
                        type="date"
                        placeholder="วันเกิด"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverDateOfBirth}
                        onChange={(e) =>
                          setCaregiverDateOfBirth(e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="เลขบัตรประชาชน 13 หลัก *"
                        maxLength={13}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverIdCard}
                        onChange={(e) =>
                          setCaregiverIdCard(e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>
                  </div>

                  {/* ที่อยู่ */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <MapPin size={16} /> ที่อยู่
                    </h4>
                    <div className="space-y-3">
                      <textarea
                        placeholder="ที่อยู่ *"
                        rows={3}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 resize-none"
                        value={caregiverAddress}
                        onChange={(e) => setCaregiverAddress(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="ตำบล/แขวง"
                          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                          value={caregiverSubDistrict}
                          onChange={(e) =>
                            setCaregiverSubDistrict(e.target.value)
                          }
                        />
                        <input
                          type="text"
                          placeholder="อำเภอ/เขต"
                          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                          value={caregiverDistrict}
                          onChange={(e) => setCaregiverDistrict(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="จังหวัด"
                          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                          value={caregiverProvince}
                          onChange={(e) => setCaregiverProvince(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="รหัสไปรษณีย์"
                          maxLength={5}
                          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                          value={caregiverPostalCode}
                          onChange={(e) =>
                            setCaregiverPostalCode(
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                        />
                      </div>
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
                        placeholder="ชื่อผู้ติดต่อฉุกเฉิน (เช่น คุณสมชาย)"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverEmergencyName}
                        onChange={(e) =>
                          setCaregiverEmergencyName(e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="ความสัมพันธ์ (เช่น พี่ชาย/น้องสาว/เพื่อน)"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverEmergencyRelation}
                        onChange={(e) =>
                          setCaregiverEmergencyRelation(e.target.value)
                        }
                      />
                      <input
                        type="tel"
                        placeholder="เบอร์โทรศัพท์ฉุกเฉิน"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverEmergencyContact}
                        onChange={(e) =>
                          setCaregiverEmergencyContact(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* ข้อมูลการทำงาน */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <Activity size={16} /> ข้อมูลการทำงาน
                    </h4>
                    <div className="space-y-3">
                      <select
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverEmploymentType}
                        onChange={(e) =>
                          setCaregiverEmploymentType(e.target.value)
                        }
                      >
                        <option value="full-time">ประจำ (Full-time)</option>
                        <option value="part-time">พาร์ทไทม์ (Part-time)</option>
                        <option value="contract">สัญญาจ้าง (Contract)</option>
                      </select>

                      {/* วันที่เริ่มทำงาน (ทุกประเภท) */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          วันที่เริ่มงาน *
                        </label>
                        <input
                          type="date"
                          className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                          value={caregiverContractStartDate}
                          onChange={(e) =>
                            setCaregiverContractStartDate(e.target.value)
                          }
                        />
                      </div>

                      {/* วันที่สิ้นสุด (เฉพาะสัญญาจ้าง) */}
                      {caregiverEmploymentType === "contract" && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            วันที่สิ้นสุดสัญญา *
                          </label>
                          <input
                            type="date"
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                            value={caregiverContractEndDate}
                            onChange={(e) =>
                              setCaregiverContractEndDate(e.target.value)
                            }
                          />
                        </div>
                      )}

                      {/* เลือกวันทำงาน */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">
                          เลือกวันทำงาน *
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { key: "mon", label: "จ" },
                            { key: "tue", label: "อ" },
                            { key: "wed", label: "พ" },
                            { key: "thu", label: "พฤ" },
                            { key: "fri", label: "ศ" },
                            { key: "sat", label: "ส" },
                            { key: "sun", label: "อา" },
                          ].map((day) => (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => {
                                if (caregiverWorkDays.includes(day.key)) {
                                  setCaregiverWorkDays(
                                    caregiverWorkDays.filter(
                                      (d) => d !== day.key
                                    )
                                  );
                                } else {
                                  setCaregiverWorkDays([
                                    ...caregiverWorkDays,
                                    day.key,
                                  ]);
                                }
                              }}
                              className={`p-2 rounded-lg border-2 transition-colors ${
                                caregiverWorkDays.includes(day.key)
                                  ? "bg-purple-600 border-purple-600 text-white"
                                  : "bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300"
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* เวลาทำงาน */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            เวลาเริ่ม *
                          </label>
                          <input
                            type="time"
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                            value={caregiverWorkTimeStart}
                            onChange={(e) =>
                              setCaregiverWorkTimeStart(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            เวลาสิ้นสุด *
                          </label>
                          <input
                            type="time"
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                            value={caregiverWorkTimeEnd}
                            onChange={(e) =>
                              setCaregiverWorkTimeEnd(e.target.value)
                            }
                          />
                        </div>
                      </div>

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
                        onChange={(e) =>
                          setCaregiverCertificate(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* เงินเดือน */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                      <DollarSign size={16} /> เงินเดือน
                    </h4>
                    <div className="space-y-3">
                      <select
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverSalaryType}
                        onChange={(e) => setCaregiverSalaryType(e.target.value)}
                      >
                        <option value="monthly">รายเดือน (Monthly)</option>
                        <option value="daily">รายวัน (Daily)</option>
                        <option value="hourly">รายชั่วโมง (Hourly)</option>
                      </select>
                      <input
                        type="number"
                        placeholder="จำนวนเงิน (บาท)"
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
                        onChange={(e) =>
                          setCaregiverIdCardImage(e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="URL รูปใบรับรอง/วุฒิการศึกษา"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        value={caregiverCertificateImage}
                        onChange={(e) =>
                          setCaregiverCertificateImage(e.target.value)
                        }
                      />
                      <p className="text-xs text-gray-500">
                        * ระบบอัพโหลดรูปจะเพิ่มในอนาคต
                      </p>
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
              {loadingCaregivers ? (
                <div className="text-center py-8 text-gray-400">
                  กำลังโหลด...
                </div>
              ) : caregivers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  ยังไม่มีผู้ดูแล
                </div>
              ) : (
                caregivers.map((caregiver) => (
                  <div
                    key={caregiver.id}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 font-bold text-xl">
                          {caregiver.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {caregiver.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {caregiver.verified ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                <CheckCircle2 size={12} /> ยืนยันแล้ว
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">
                                  รอยืนยัน
                                </span>
                                <button
                                  onClick={() =>
                                    handleVerifyCaregiver(
                                      caregiver.id,
                                      caregiver.name
                                    )
                                  }
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1"
                                  title="ยืนยันตัวตนผู้ดูแล"
                                >
                                  <CheckCircle2 size={12} /> ยืนยัน
                                </button>
                              </div>
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
                        <span className="truncate">
                          บัตร: {caregiver.idCard.slice(0, 3)}***
                          {caregiver.idCard.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} className="shrink-0" />
                        <span className="truncate">
                          เริ่ม: {formatDateDisplay(caregiver.startDate)}
                        </span>
                      </div>
                    </div>

                    {/* Pairing Code - ของคุณยาย */}
                    {selectedElder && selectedElder.pairingCode && (
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-3 mb-3 border-2 border-dashed border-purple-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-purple-700 font-medium mb-1">
                              รหัสจับคู่ของ {selectedElder.name}
                            </p>
                            <p className="text-2xl font-bold text-purple-900 tracking-widest">
                              {selectedElder.pairingCode}
                            </p>
                            <p className="text-xs text-purple-600 mt-2">
                              ผู้ดูแลใช้รหัสนี้เพื่อจับคู่ในแอพผู้ดูแล
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              copyPairingCode(
                                selectedElder.pairingCode,
                                selectedElder.name
                              )
                            }
                            className="bg-white hover:bg-purple-50 p-3 rounded-xl transition-colors border border-purple-200 active:scale-95"
                            title="คัดลอกรหัส"
                          >
                            <Copy size={20} className="text-purple-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* รายละเอียดเพิ่มเติม - Collapsible */}
                    <details className="group">
                      <summary className="cursor-pointer text-purple-600 font-bold text-sm flex items-center gap-1 hover:text-purple-700 transition-colors">
                        <ChevronRight
                          size={16}
                          className="group-open:rotate-90 transition-transform"
                        />
                        ดูรายละเอียดเพิ่มเติม
                      </summary>
                      <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-xs text-gray-500 font-medium mb-1">
                            ที่อยู่
                          </p>
                          <p className="text-gray-700">{caregiver.address}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-xs text-gray-500 font-medium mb-1">
                              ผู้ติดต่อฉุกเฉิน
                            </p>
                            <p className="text-gray-700 font-bold text-xs">
                              {caregiver.emergencyName}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {caregiver.emergencyContact}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-xs text-gray-500 font-medium mb-1">
                              ประสบการณ์
                            </p>
                            <p className="text-gray-700 font-bold">
                              {caregiver.experience} ปี
                            </p>
                          </div>
                        </div>

                        {(caregiver.dateOfBirth || caregiver.gender) && (
                          <div className="grid grid-cols-2 gap-2">
                            {caregiver.dateOfBirth && (
                              <div className="bg-gray-50 p-3 rounded-xl">
                                <p className="text-xs text-gray-500 font-medium mb-1">
                                  วันเกิด
                                </p>
                                <p className="text-gray-700 font-bold text-xs">
                                  {formatDateDisplay(caregiver.dateOfBirth)}
                                </p>
                              </div>
                            )}
                            {caregiver.gender && (
                              <div className="bg-gray-50 p-3 rounded-xl">
                                <p className="text-xs text-gray-500 font-medium mb-1">
                                  เพศ
                                </p>
                                <p className="text-gray-700 font-bold">
                                  {caregiver.gender === "male"
                                    ? "ชาย"
                                    : caregiver.gender === "female"
                                    ? "หญิง"
                                    : "อื่นๆ"}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {(caregiver.subDistrict ||
                          caregiver.district ||
                          caregiver.province ||
                          caregiver.postalCode) && (
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-xs text-gray-500 font-medium mb-1">
                              ที่อยู่เพิ่มเติม
                            </p>
                            <p className="text-gray-700 text-xs">
                              {[
                                caregiver.subDistrict,
                                caregiver.district,
                                caregiver.province,
                                caregiver.postalCode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        )}

                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-xs text-gray-500 font-medium mb-1">
                            วุฒิการศึกษา
                          </p>
                          <p className="text-gray-700">
                            {caregiver.certificate}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-green-50 p-3 rounded-xl">
                            <p className="text-xs text-green-600 font-medium mb-1">
                              ประเภทการจ้าง
                            </p>
                            <p className="text-green-900 font-bold text-xs">
                              {caregiver.employmentType === "full-time"
                                ? "ประจำ"
                                : caregiver.employmentType === "part-time"
                                ? "พาร์ทไทม์"
                                : "สัญญาจ้าง"}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-xl">
                            <p className="text-xs text-green-600 font-medium mb-1">
                              ประเภทเงินเดือน
                            </p>
                            <p className="text-green-900 font-bold text-xs">
                              {caregiver.salaryType === "monthly"
                                ? "รายเดือน"
                                : caregiver.salaryType === "daily"
                                ? "รายวัน"
                                : "รายชั่วโมง"}
                            </p>
                          </div>
                        </div>

                        {(caregiver.contractStartDate ||
                          caregiver.contractEndDate) && (
                          <div className="grid grid-cols-2 gap-2">
                            {caregiver.contractStartDate && (
                              <div className="bg-orange-50 p-3 rounded-xl">
                                <p className="text-xs text-orange-600 font-medium mb-1">
                                  วันที่เริ่มงาน
                                </p>
                                <p className="text-orange-900 font-bold text-xs">
                                  {formatDateDisplay(
                                    caregiver.contractStartDate
                                  )}
                                </p>
                              </div>
                            )}
                            {caregiver.contractEndDate && (
                              <div className="bg-orange-50 p-3 rounded-xl">
                                <p className="text-xs text-orange-600 font-medium mb-1">
                                  วันที่สิ้นสุดสัญญา
                                </p>
                                <p className="text-orange-900 font-bold text-xs">
                                  {formatDateDisplay(caregiver.contractEndDate)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 p-3 rounded-xl">
                            <p className="text-xs text-blue-600 font-medium mb-1">
                              เงินเดือน
                            </p>
                            <p className="text-blue-900 font-bold">
                              {parseFloat(caregiver.salary).toLocaleString()}{" "}
                              บาท
                            </p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-xl">
                            <p className="text-xs text-purple-600 font-medium mb-1">
                              เวลาทำงาน
                            </p>
                            <p className="text-purple-900 text-xs font-medium">
                              {caregiver.workSchedule}
                            </p>
                          </div>
                        </div>

                        {(caregiver.idCardImage ||
                          caregiver.certificateImage) && (
                          <div className="bg-green-50 p-3 rounded-xl">
                            <p className="text-xs text-green-700 font-medium mb-2 flex items-center gap-1">
                              <FileText size={14} /> หลักฐานที่อัพโหลด
                            </p>
                            <div className="space-y-1">
                              {caregiver.idCardImage && (
                                <a
                                  href={caregiver.idCardImage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline block"
                                >
                                  📄 บัตรประชาชน
                                </a>
                              )}
                              {caregiver.certificateImage && (
                                <a
                                  href={caregiver.certificateImage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline block"
                                >
                                  📄 ใบรับรอง
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* สถานะการเข้างานวันนี้ */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-100">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                              <Clock size={16} /> สถานะการเข้างานวันนี้
                            </h4>
                            {loadingAttendances ? (
                              <div className="text-xs text-gray-400">
                                กำลังโหลด...
                              </div>
                            ) : getTodayAttendance(caregiver.id) ? (
                              getAttendanceStatusBadge(
                                getTodayAttendance(caregiver.id)!.status
                              )
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                                ยังไม่มีข้อมูล
                              </span>
                            )}
                          </div>

                          {!loadingAttendances &&
                            getTodayAttendance(caregiver.id) && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1">
                                    เข้างาน
                                  </p>
                                  <p className="text-lg font-bold text-green-600">
                                    {formatTime(
                                      getTodayAttendance(caregiver.id)!
                                        .checkInTime
                                    )}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg">
                                  <p className="text-xs text-gray-500 mb-1">
                                    ออกงาน
                                  </p>
                                  <p className="text-lg font-bold text-blue-600">
                                    {getTodayAttendance(caregiver.id)!
                                      .checkOutTime
                                      ? formatTime(
                                          getTodayAttendance(caregiver.id)!
                                            .checkOutTime
                                        )
                                      : "-"}
                                  </p>
                                </div>
                                {getTodayAttendance(caregiver.id)!.hoursWorked >
                                  0 && (
                                  <div className="col-span-2 bg-white p-3 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                          ชั่วโมงทำงาน
                                        </p>
                                        <p className="text-lg font-bold text-indigo-600">
                                          {getTodayAttendance(
                                            caregiver.id
                                          )!.hoursWorked.toFixed(2)}{" "}
                                          ชม.
                                        </p>
                                      </div>
                                      {getTodayAttendance(caregiver.id)!
                                        .isOvertime && (
                                        <div className="text-right">
                                          <p className="text-xs text-orange-500 mb-1">
                                            OT
                                          </p>
                                          <p className="text-sm font-bold text-orange-600">
                                            +
                                            {getTodayAttendance(
                                              caregiver.id
                                            )!.overtimeHours.toFixed(2)}{" "}
                                            ชม.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                          {!loadingAttendances &&
                            !getTodayAttendance(caregiver.id) && (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">
                                  ผู้ดูแลยังไม่ได้ลงเวลาเข้างานวันนี้
                                </p>
                              </div>
                            )}

                          {/* ดูประวัติการเข้างาน */}
                          <button
                            onClick={() =>
                              setSelectedCaregiverForAttendance(caregiver.id)
                            }
                            className="w-full mt-3 bg-white hover:bg-indigo-50 text-indigo-600 font-medium py-2 rounded-lg transition-colors border border-indigo-200 text-sm flex items-center justify-center gap-2"
                          >
                            <Calendar size={14} /> ดูประวัติการเข้างานทั้งหมด
                          </button>
                        </div>
                      </div>
                    </details>
                  </div>
                ))
              )}
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
                  <p className="text-blue-900 font-bold text-sm mb-1">
                    ℹ️ เกี่ยวกับบัญชี
                  </p>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    • <strong>รายการที่ผู้ดูแลเพิ่ม</strong> (สีน้ำเงิน): ทั้ง 2
                    ฝั่งเห็นและแก้ไขได้
                    <br />• <strong>รายการที่ครอบครัวเพิ่ม</strong> (สีม่วง):
                    เฉพาะครอบครัวเห็น ผู้ดูแลไม่เห็น
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <p className="text-blue-700 text-sm font-medium mb-1">
                  รวมทั้งหมด
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {totalBills.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">บาท</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                <p className="text-red-700 text-sm font-medium mb-1">
                  ค้างจ่าย
                </p>
                <p className="text-3xl font-bold text-red-900">
                  {unpaidBills.toLocaleString()}
                </p>
                <p className="text-xs text-red-600 mt-1">บาท</p>
              </div>
            </div>

            {/* Add Form */}
            {showBillForm && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-green-200 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  เพิ่มรายการใหม่
                </h3>
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
              {loadingBills ? (
                <div className="text-center py-8 text-gray-400">
                  กำลังโหลด...
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  ยังไม่มีรายการบัญชี
                </div>
              ) : (
                bills.map((bill) => {
                  // แปลงหมวดหมู่เป็นภาษาไทย
                  const categoryMap: { [key: string]: string } = {
                    medical: "ค่ารักษาพยาบาล",
                    food: "ค่าอาหาร",
                    caregiver: "ค่าผู้ดูแล",
                    other: "อื่นๆ",
                  };
                  const categoryText =
                    categoryMap[bill.category] || bill.category;

                  return (
                    <div
                      key={bill.id}
                      className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                        bill.isPaid
                          ? "border-green-200 bg-green-50/30"
                          : "border-yellow-200 bg-yellow-50/20"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-800">
                              {bill.description}
                            </h3>
                            {/* สถานะการจ่าย */}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                bill.isPaid
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {bill.isPaid ? "จ่ายแล้ว ✓" : "ยังไม่จ่าย"}
                            </span>
                          </div>

                          {/* วันที่ */}
                          <p className="text-sm text-gray-500 mb-2">
                            {new Date(bill.date).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>

                          {/* จำนวนเงิน */}
                          <p className="text-2xl font-bold text-gray-900 mt-2 mb-3">
                            {Number(bill.amount).toLocaleString("th-TH", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}{" "}
                            บาท
                          </p>

                          {/* หมวดหมู่และผู้สร้าง */}
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                              📁 {categoryText}
                            </span>
                            {bill.addedByName && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                                👤 {bill.addedByName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ปุ่มจัดการ */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleBillPaid(bill.id)}
                            className={`p-2 rounded-xl transition-all active:scale-95 ${
                              bill.isPaid
                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                : "bg-green-100 text-green-600 hover:bg-green-200"
                            }`}
                            title={
                              bill.isPaid
                                ? "ยกเลิกจ่ายแล้ว"
                                : "ทำเครื่องหมายจ่ายแล้ว"
                            }
                          >
                            {bill.isPaid ? (
                              <XCircle size={18} />
                            ) : (
                              <CheckCircle2 size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              // เตรียมข้อมูลสำหรับแก้ไขบิล
                              setBillDesc(bill.description);
                              setBillAmount(bill.amount.toString());
                              setBillCategory(bill.category);
                              setEditingBill(bill);
                              setShowBillForm(true);
                            }}
                            className="p-2 bg-yellow-50 rounded-xl hover:bg-yellow-100 text-yellow-600 transition-all active:scale-95"
                            title="แก้ไข"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-600 transition-all active:scale-95"
                            title="ลบ"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === "calendar" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                ปฏิทินนัดหมาย
              </h2>
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
                    <h3 className="font-bold text-orange-800 mb-1">
                      นัดหมายที่ใกล้ถึง ({getUpcomingAppointments().length})
                    </h3>
                    {getUpcomingAppointments()
                      .slice(0, 2)
                      .map((apt) => (
                        <p
                          key={apt.id}
                          className="text-sm text-orange-700 mb-1"
                        >
                          • {apt.title} -{" "}
                          {new Date(apt.date).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          เวลา {apt.time} น.
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
                    onChange={(e) =>
                      setAppointmentType(
                        e.target.value as
                          | "doctor"
                          | "checkup"
                          | "therapy"
                          | "other"
                      )
                    }
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
                    <span className="text-gray-700 font-medium">
                      แจ้งเตือนล่วงหน้า 1 วัน
                    </span>
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
                  <ChevronRight
                    size={24}
                    className="text-gray-600 rotate-180"
                  />
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
                  <div
                    key={day}
                    className="text-center text-sm font-bold text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const { daysInMonth, startingDayOfWeek, year, month } =
                    getDaysInMonth(currentMonth);
                  const days = [];

                  // Empty cells before first day
                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(
                      <div key={`empty-${i}`} className="aspect-square" />
                    );
                  }

                  // Days of month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month + 1).padStart(
                      2,
                      "0"
                    )}-${String(day).padStart(2, "0")}`;
                    const dayAppointments = getAppointmentsForDate(dateStr);
                    const isToday =
                      dateStr === new Date().toISOString().split("T")[0];

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
                                <div
                                  key={i}
                                  className={`w-1 h-1 rounded-full ${
                                    isToday ? "bg-white" : "bg-purple-500"
                                  }`}
                                />
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
                  <p className="text-sm text-gray-400 mt-1">
                    กดปุ่ม "เพิ่มนัดหมาย" เพื่อเริ่มต้น
                  </p>
                </div>
              ) : (
                appointments
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((appointment) => {
                    const aptDate = new Date(appointment.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isUpcoming = aptDate >= today;

                    return (
                      <div
                        key={appointment.id}
                        className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${
                          isUpcoming
                            ? "border-purple-200"
                            : "border-gray-100 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`px-3 py-1 rounded-lg text-xs font-bold border ${getAppointmentTypeColor(
                                appointment.type
                              )}`}
                            >
                              {getAppointmentTypeLabel(appointment.type)}
                            </div>
                            {appointment.reminder && isUpcoming && (
                              <Bell
                                size={16}
                                className="text-orange-500 mt-1"
                              />
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
                              onClick={() =>
                                handleDeleteAppointment(appointment.id)
                              }
                              className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-lg font-bold text-gray-800 mb-2">
                          {appointment.title}
                        </h4>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span>
                              {new Date(appointment.date).toLocaleDateString(
                                "th-TH",
                                {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            <span>{appointment.time} น.</span>
                          </div>
                          {appointment.location && (
                            <div className="flex items-center gap-2">
                              <ChevronRight
                                size={16}
                                className="text-gray-400"
                              />
                              <span>{appointment.location}</span>
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-600">
                                {appointment.notes}
                              </p>
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

            {/* Add/Edit Form */}
            {showActivityForm && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-blue-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {editingActivity ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"}
                  </h3>
                  <button
                    onClick={handleCancelActivityForm}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
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
                      onClick={handleCancelActivityForm}
                      className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleAddActivity}
                      className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {editingActivity ? (
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

            {/* Activity List */}
            <div className="space-y-4">
              {loadingActivities ? (
                <div className="text-center py-8 text-gray-400">
                  กำลังโหลด...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  ยังไม่มีกิจกรรม
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                      activity.completed
                        ? "border-green-200 bg-green-50/30"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleActivityComplete(activity.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 ${
                            activity.completed
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                          title={
                            activity.completed
                              ? "คลิกเพื่อยกเลิกการทำเสร็จ"
                              : "คลิกเพื่อทำเสร็จ"
                          }
                        >
                          {activity.completed && (
                            <CheckCircle2 size={24} className="text-white" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h3
                            className={`text-lg font-bold ${
                              activity.completed
                                ? "text-gray-500 line-through"
                                : "text-gray-800"
                            }`}
                          >
                            {activity.title}
                          </h3>
                          <p
                            className={`text-sm mt-1 ${
                              activity.completed
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {activity.time} น.
                              </span>
                            </div>
                            {activity.completed && activity.completedAt && (
                              <div className="flex items-center gap-2">
                                <CheckCircle2
                                  size={14}
                                  className="text-green-500"
                                />
                                <span className="text-xs text-green-600">
                                  ทำเสร็จ{" "}
                                  {new Date(
                                    activity.completedAt
                                  ).toLocaleString("th-TH", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditActivity(activity)}
                          className="p-2 bg-blue-50 rounded-xl hover:bg-blue-100 text-blue-600 transition-colors active:scale-95"
                          title="แก้ไข"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-600 transition-colors active:scale-95"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* HEALTH TAB */}
        {activeTab === "health" && selectedElder && (
          <div className="animate-in fade-in duration-300">
            <div className="space-y-6">
              {/* Mood Overview from Daily Reports */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-sm border border-purple-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="text-purple-600" size={24} />
                  อารมณ์ของ{selectedElder.name}
                </h3>
                {loadingReports ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">กำลังโหลด...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {(() => {
                      const moodCounts = { happy: 0, neutral: 0, sad: 0 };
                      reports.forEach(r => {
                        if (r.overallMood === 'happy') moodCounts.happy++;
                        else if (r.overallMood === 'sad') moodCounts.sad++;
                        else if (r.overallMood === 'neutral') moodCounts.neutral++;
                      });
                      return (
                        <>
                          <div className="bg-white rounded-2xl p-4 text-center">
                            <div className="text-3xl mb-2">😊</div>
                            <p className="text-2xl font-bold text-green-600">{moodCounts.happy}</p>
                            <p className="text-xs text-gray-500">วันที่แจ่มใส</p>
                          </div>
                          <div className="bg-white rounded-2xl p-4 text-center">
                            <div className="text-3xl mb-2">😐</div>
                            <p className="text-2xl font-bold text-yellow-600">{moodCounts.neutral}</p>
                            <p className="text-xs text-gray-500">วันที่ปกติ</p>
                          </div>
                          <div className="bg-white rounded-2xl p-4 text-center">
                            <div className="text-3xl mb-2">😔</div>
                            <p className="text-2xl font-bold text-red-600">{moodCounts.sad}</p>
                            <p className="text-xs text-gray-500">วันที่ไม่สบายใจ</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Latest Health Record */}
              {latestHealth && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    บันทึกล่าสุด
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">ประเภท:</span>
                      <span className="font-semibold text-gray-800">
                        {latestHealth.type === 'vital-sign' ? 'สัญญาณชีพ' : 
                         latestHealth.type === 'observation' ? 'การสังเกต' : latestHealth.type}
                      </span>
                    </div>
                    {latestHealth.systolic && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ความดันโลหิต:</span>
                        <span className="font-semibold text-gray-800">
                          {latestHealth.systolic}/{latestHealth.diastolic} mmHg
                        </span>
                      </div>
                    )}
                    {latestHealth.heartRate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">อัตราการเต้นของหัวใจ:</span>
                        <span className="font-semibold text-gray-800">
                          {latestHealth.heartRate} ครั้ง/นาที
                        </span>
                      </div>
                    )}
                    {latestHealth.temperature && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">อุณหภูมิ:</span>
                        <span className="font-semibold text-gray-800">
                          {latestHealth.temperature} °C
                        </span>
                      </div>
                    )}
                    {latestHealth.observation && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">การสังเกต:</p>
                        <p className="text-gray-800">{latestHealth.observation}</p>
                      </div>
                    )}
                    {latestHealth.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">หมายเหตุ:</p>
                        <p className="text-gray-800">{latestHealth.notes}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-500 pt-2 border-t">
                      <span>บันทึกโดย: {latestHealth.caregiver?.name || 'ไม่ระบุ'}</span>
                      <span>{new Date(latestHealth.recordedAt).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Records History */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  ประวัติการบันทึกสุขภาพ
                </h3>
                {loadingHealth ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">กำลังโหลด...</p>
                  </div>
                ) : healthRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Heart size={48} className="mx-auto mb-2 opacity-20" />
                    <p>ยังไม่มีบันทึกสุขภาพ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {healthRecords.map((record) => (
                      <div
                        key={record.id}
                        className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              record.severity === 'urgent' ? 'bg-red-500' :
                              record.severity === 'concern' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="font-semibold text-gray-800">
                              {record.type === 'vital-sign' ? 'สัญญาณชีพ' : 
                               record.type === 'observation' ? 'การสังเกต' : record.type}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(record.recordedAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {record.systolic && (
                          <p className="text-sm text-gray-600">
                            ความดัน: {record.systolic}/{record.diastolic} mmHg
                            {record.heartRate && ` | ชีพจร: ${record.heartRate} ครั้ง/นาที`}
                          </p>
                        )}
                        {record.observation && (
                          <p className="text-sm text-gray-700 mt-1">{record.observation}</p>
                        )}
                        {record.notes && (
                          <p className="text-xs text-gray-500 mt-2 italic">{record.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          บันทึกโดย: {record.caregiver?.name || 'ไม่ระบุ'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-100 flex justify-around py-3 pb-6 sm:pb-3 sticky bottom-0 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-2xl shrink-0">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${
            activeTab === "home"
              ? "text-purple-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div
            className={`p-1 rounded-xl mb-1 ${
              activeTab === "home" ? "bg-purple-50" : ""
            }`}
          >
            <Home size={26} strokeWidth={activeTab === "home" ? 2.5 : 2} />
          </div>
          <span className="text-xs font-bold">หน้าหลัก</span>
        </button>
        <button
          onClick={() => setActiveTab("caregivers")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${
            activeTab === "caregivers"
              ? "text-purple-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div
            className={`p-1 rounded-xl mb-1 ${
              activeTab === "caregivers" ? "bg-purple-50" : ""
            }`}
          >
            <Users
              size={26}
              strokeWidth={activeTab === "caregivers" ? 2.5 : 2}
            />
          </div>
          <span className="text-xs font-bold">ผู้ดูแล</span>
        </button>
        <button
          onClick={() => setActiveTab("bills")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${
            activeTab === "bills"
              ? "text-purple-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div
            className={`p-1 rounded-xl mb-1 ${
              activeTab === "bills" ? "bg-purple-50" : ""
            }`}
          >
            <Wallet size={26} strokeWidth={activeTab === "bills" ? 2.5 : 2} />
          </div>
          <span className="text-xs font-bold">บัญชี</span>
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${
            activeTab === "activities"
              ? "text-purple-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div
            className={`p-1 rounded-xl mb-1 ${
              activeTab === "activities" ? "bg-purple-50" : ""
            }`}
          >
            <Activity
              size={26}
              strokeWidth={activeTab === "activities" ? 2.5 : 2}
            />
          </div>
          <span className="text-xs font-bold">กิจกรรม</span>
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${
            activeTab === "health"
              ? "text-purple-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div
            className={`p-1 rounded-xl mb-1 ${
              activeTab === "health" ? "bg-purple-50" : ""
            }`}
          >
            <Heart size={26} strokeWidth={activeTab === "health" ? 2.5 : 2} />
          </div>
          <span className="text-xs font-bold">สุขภาพ</span>
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${
            activeTab === "calendar"
              ? "text-purple-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div
            className={`p-1 rounded-xl mb-1 ${
              activeTab === "calendar" ? "bg-purple-50" : ""
            }`}
          >
            <Calendar
              size={26}
              strokeWidth={activeTab === "calendar" ? 2.5 : 2}
            />
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
              {loadingNotifications ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-sm">กำลังโหลด...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell size={48} className="mx-auto mb-2 opacity-20" />
                  <p>ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.isRead) {
                        markNotificationAsRead(notification.id);
                      }
                    }}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md ${
                      notification.isRead
                        ? "bg-gray-50 border-gray-100"
                        : "bg-purple-50 border-purple-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          notification.isRead ? "bg-gray-200" : "bg-purple-500"
                        }`}
                      >
                        <Bell
                          size={20}
                          className={
                            notification.isRead ? "text-gray-500" : "text-white"
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-bold ${
                            notification.isRead
                              ? "text-gray-600"
                              : "text-gray-800"
                          } mb-1`}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString(
                              "th-TH"
                            )}
                          </span>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
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
                    <span className="font-bold text-gray-800">
                      {selectedElder.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">อายุ:</span>
                    <span className="font-bold text-gray-800">
                      {selectedElder.age} ปี
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ความสัมพันธ์:</span>
                    <span className="font-bold text-gray-800">
                      {selectedElder.relation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">วันที่ออกรายงาน:</span>
                    <span className="font-bold text-gray-800">
                      {new Date().toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
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
                  {caregivers.map((c) => (
                    <div key={c.id} className="bg-blue-50 p-3 rounded-xl">
                      <p className="font-bold text-gray-800">{c.name}</p>
                      <p className="text-sm text-gray-600">โทร: {c.phone}</p>
                      <p className="text-xs text-gray-500">
                        {c.verified ? '✓ ยืนยันตัวตนแล้ว' : 'รอการยืนยัน'}
                      </p>
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
                  {activities.filter((a) => !a.completed).length > 0 ? (
                    activities
                      .filter((a) => !a.completed)
                      .map((a) => (
                        <div key={a.id} className="bg-indigo-50 p-3 rounded-xl">
                          <p className="font-bold text-sm text-gray-800">
                            {a.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {a.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            เวลา: {a.time} น.
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      ไม่มีกิจกรรมค้าง
                    </p>
                  )}
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={20}
                    className="text-blue-600 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-blue-900 font-bold text-sm mb-1">
                      ℹ️ เกี่ยวกับรายงาน
                    </p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      รายงานนี้รวม: ข้อมูลผู้สูงอายุ, ผู้ดูแล, บันทึกสุขภาพ
                      และกิจกรรม
                      <br />
                      <strong className="text-blue-800">
                        * ไม่รวมข้อมูลค่ารักษาพยาบาล
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
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

      {/* Confirm Delete Appointment Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              ยืนยันการลบนัดหมาย
            </h3>
            <p className="mb-6 text-gray-600">
              คุณต้องการลบนัดหมายนี้จริงหรือไม่? การลบจะไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200"
                onClick={() => setConfirmDeleteId(null)}
              >
                ยกเลิก
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
                onClick={() =>
                  handleDeleteAppointmentConfirmed(confirmDeleteId)
                }
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Activity Dialog */}
      {confirmDeleteActivityId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              ยืนยันการลบกิจกรรม
            </h3>
            <p className="mb-6 text-gray-600">
              คุณต้องการลบกิจกรรมนี้จริงหรือไม่? การลบจะไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                onClick={() => setConfirmDeleteActivityId(null)}
              >
                ยกเลิก
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                onClick={() =>
                  handleDeleteActivityConfirmed(confirmDeleteActivityId)
                }
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Bill Dialog */}
      {confirmDeleteBillId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              ยืนยันการลบรายการบัญชี
            </h3>
            <p className="mb-6 text-gray-600">
              คุณต้องการลบรายการบัญชีนี้จริงหรือไม่? การลบจะไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                onClick={() => setConfirmDeleteBillId(null)}
              >
                ยกเลิก
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                onClick={() => handleDeleteBillConfirmed(confirmDeleteBillId)}
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Caregiver Dialog */}
      {confirmDeleteCaregiverId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              ยืนยันการลบผู้ดูแล
            </h3>
            <p className="mb-6 text-gray-600">
              คุณต้องการลบผู้ดูแลนี้จริงหรือไม่? การลบจะไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                onClick={() => setConfirmDeleteCaregiverId(null)}
              >
                ยกเลิก
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                onClick={() =>
                  handleDeleteCaregiverConfirmed(confirmDeleteCaregiverId)
                }
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Modal */}
      {selectedCaregiverForAttendance && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 pb-8 sticky top-0 z-10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar size={28} />
                    ประวัติการเข้างาน
                  </h2>
                  <p className="text-purple-100 mt-1">
                    {
                      caregivers.find(
                        (c) => c.id === selectedCaregiverForAttendance
                      )?.name
                    }
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCaregiverForAttendance(null)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-5 space-y-3">
              {loadingAttendances ? (
                <div className="text-center py-8 text-gray-400">
                  กำลังโหลด...
                </div>
              ) : (
                <>
                  {caregiverAttendances[selectedCaregiverForAttendance]
                    ?.length > 0 ? (
                    caregiverAttendances[selectedCaregiverForAttendance].map(
                      (attendance) => (
                        <div
                          key={attendance.id}
                          className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:border-indigo-200 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-bold text-gray-800">
                                {new Date(
                                  attendance.workDate
                                ).toLocaleDateString("th-TH", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  weekday: "long",
                                })}
                              </p>
                            </div>
                            {getAttendanceStatusBadge(attendance.status)}
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="bg-green-50 p-3 rounded-xl">
                              <p className="text-xs text-green-600 mb-1">
                                เข้างาน
                              </p>
                              <p className="text-lg font-bold text-green-700">
                                {formatTime(attendance.checkInTime)}
                              </p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-xl">
                              <p className="text-xs text-blue-600 mb-1">
                                ออกงาน
                              </p>
                              <p className="text-lg font-bold text-blue-700">
                                {attendance.checkOutTime
                                  ? formatTime(attendance.checkOutTime)
                                  : "-"}
                              </p>
                            </div>
                            {attendance.hoursWorked > 0 && (
                              <>
                                <div className="bg-indigo-50 p-3 rounded-xl">
                                  <p className="text-xs text-indigo-600 mb-1">
                                    ชั่วโมงทำงาน
                                  </p>
                                  <p className="text-lg font-bold text-indigo-700">
                                    {attendance.hoursWorked.toFixed(2)} ชม.
                                  </p>
                                </div>
                                {attendance.isOvertime && (
                                  <div className="bg-orange-50 p-3 rounded-xl">
                                    <p className="text-xs text-orange-600 mb-1">
                                      OT
                                    </p>
                                    <p className="text-lg font-bold text-orange-700">
                                      +{attendance.overtimeHours.toFixed(2)} ชม.
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-12">
                      <Calendar
                        size={48}
                        className="mx-auto text-gray-300 mb-3"
                      />
                      <p className="text-gray-400 font-medium">
                        ยังไม่มีประวัติการเข้างาน
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        ผู้ดูแลจะต้องลงเวลาเข้า-ออกงานผ่านแอปพลิเคชัน
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => setSelectedCaregiverForAttendance(null)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Bill Dialog */}
      {confirmDeleteBillId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                ยืนยันการลบรายการ
              </h3>
              <p className="text-gray-600 text-sm">
                คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? 
                <br />
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteBillId(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  handleDeleteBillConfirmed(confirmDeleteBillId);
                  setConfirmDeleteBillId(null);
                }}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
