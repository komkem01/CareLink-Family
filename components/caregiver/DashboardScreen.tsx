'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Home, Activity, Wallet, FileCheck, User, AlertTriangle, Bell, 
  CheckCircle, ChevronRight, ShoppingBag, Plus, Send, Trash2, MessageSquare,
  CloudSun, Sun, Sunset, Moon, Info, ClipboardList, Camera, X, Clock, LogOut
} from 'lucide-react';
import CustomAlert from '../CustomAlert';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

// --- Types & Mock Data ---
interface Task { id: string; time: string; title: string; detail: string; instruction: string; status: 'done'|'pending'; date?: Date; }
interface Expense { 
  id: string; 
  item: string; 
  price: number;
  addedBy: "caregiver" | "family";
  date: string;
  description?: string;
  amount?: number;
  category?: string;
}

interface AttendanceStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  attendance: {
    id?: string;
    checkInTime: string;
    checkOutTime: string | null;
    hoursWorked: number | null;
    isOvertime: boolean;
    overtimeHours: number;
  } | null;
}

interface Elder {
  id: string;
  name: string;
  age: number;
  relation: string;
}

const INITIAL_TASKS: Task[] = [
  { id: '1', time: '08:00', title: 'อาหารเช้า + ยา', detail: 'โจ๊กหมู + ยา 3 เม็ด', instruction: '1. อุ่นโจ๊ก\n2. เตรียมน้ำอุ่น\n3. ทานยาหลังอาหารทันที', status: 'done' },
  { id: '2', time: '10:00', title: 'วัดความดัน', detail: 'พัก 15 นาทีก่อนวัด', instruction: '1. นั่งพักเฉยๆ\n2. ห้ามชวนคุย\n3. วางแขนระดับหัวใจ', status: 'done' },
  { id: '3', time: '12:00', title: 'อาหารเที่ยง', detail: 'ข้าวต้มปลา', instruction: '1. เตรียมข้าวต้ม\n2. ระวังก้าง', status: 'pending' },
  { id: '4', time: '13:00', title: 'กายภาพบำบัด', detail: 'ยืดแขน 20 ครั้ง', instruction: '1. ยกแขนขึ้น-ลง\n2. ทำช้าๆ', status: 'pending' },
  { id: '5', time: '16:00', title: 'อาหารว่าง', detail: 'นมถั่วเหลือง', instruction: '1. เทใส่แก้ว\n2. ชวนคุยเรื่องความจำ', status: 'pending' },
];

export default function DashboardScreen() {
  const router = useRouter();
  
  // Get user data from cookies
  const token = Cookies.get('token');
  const userId = Cookies.get('userId');
  const userName = Cookies.get('userName');
  const elderId = Cookies.get('elderId');

  // State
  const [activeTab, setActiveTab] = useState('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [elder, setElder] = useState<Elder | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    hasCheckedIn: false,
    hasCheckedOut: false,
    attendance: null
  });
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [recordedMoods, setRecordedMoods] = useState<string[]>([]);
  const [extraNote, setExtraNote] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [healthMode, setHealthMode] = useState('device');
  const [manualChecks, setManualChecks] = useState<string[]>([]);
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSOS, setShowSOS] = useState(false);
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
  const [timeError, setTimeError] = useState(false);

  // API Functions
  const loadElderInfo = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/family/elders/${elderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setElder(data);
      }
    } catch (error) {
      console.error('Load elder info error:', error);
    }
  }, [elderId, token]);

  const loadTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${BASE_URL}/caregiver/tasks?elderId=${elderId}&date=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Load tasks error:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [elderId, token]);

  const loadExpenses = useCallback(async () => {
    setIsLoadingExpenses(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${BASE_URL}/caregiver/expenses?caregiverName=${userName}&elderId=${elderId}&date=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.map((item: any) => ({
          id: item.id,
          item: item.description,
          price: Number(item.amount),
          addedBy: item.addedBy,
          date: item.date
        })));
      }
    } catch (error) {
      console.error('Load expenses error:', error);
    } finally {
      setIsLoadingExpenses(false);
    }
  }, [userName, elderId, token]);

  const loadAttendanceStatus = useCallback(async () => {
    setIsLoadingAttendance(true);
    try {
      const response = await fetch(`${BASE_URL}/caregiver/attendance/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAttendanceStatus(data);
      }
    } catch (error) {
      console.error('Load attendance error:', error);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [token]);

  // Load data on mount
  useEffect(() => {
    if (elderId && token) {
      loadTasks();
      loadExpenses();
      loadAttendanceStatus();
      loadElderInfo();
    }
  }, [elderId, token, loadTasks, loadExpenses, loadAttendanceStatus, loadElderInfo]);

  // Auto-refresh ข้อมูลทุก 5 วินาที
  useEffect(() => {
    if (!elderId || !token) return;

    const interval = setInterval(() => {
      loadTasks();
      loadExpenses();
      loadAttendanceStatus();
    }, 5000); // ทุก 5 วินาที

    return () => clearInterval(interval);
  }, [elderId, token, loadTasks, loadExpenses, loadAttendanceStatus]);

  // Computed
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const totalExpense = expenses.reduce((sum, ex) => sum + Number(ex.price), 0);
  const pendingTask = tasks.find(t => t.status === 'pending');

  // Methods
  const showAlert = (title: string, message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const handleCheckIn = async () => {
    try {
      const response = await fetch(`${BASE_URL}/caregiver/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderId,
          location: 'บ้านผู้สูงอายุ',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        showAlert('ลงเวลาเข้างานสำเร็จ', data.isLate ? 'คุณมาสายนิดหน่อย' : 'ขอบคุณที่ตรงเวลา!', 'success');
        loadAttendanceStatus();
      } else {
        showAlert('เกิดข้อผิดพลาด', data.message || 'ไม่สามารถลงเวลาได้', 'error');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await fetch(`${BASE_URL}/caregiver/attendance/check-out`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: 'บ้านผู้สูงอายุ',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const overtimeMsg = data.overtime > 0 ? `\nOT: ${data.overtime.toFixed(2)} ชม.` : '';
        showAlert(
          'ลงเวลาออกงานสำเร็จ', 
          `ทำงานไป ${data.hoursWorked.toFixed(2)} ชั่วโมง${overtimeMsg}\nขอบคุณสำหรับการทำงานหนัก!`, 
          'success'
        );
        loadAttendanceStatus();
      } else {
        showAlert('เกิดข้อผิดพลาด', data.message || 'ไม่สามารถลงเวลาได้', 'error');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const handleAddExpense = async () => {
    if (!newItemName || !newItemPrice) {
      return showAlert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อรายการและราคา', 'error');
    }

    try {
      const response = await fetch(`${BASE_URL}/caregiver/expenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newItemName,
          amount: parseFloat(newItemPrice),
          category: 'general',
          elderId,
          caregiverName: userName,
        }),
      });

      if (response.ok) {
        setNewItemName('');
        setNewItemPrice('');
        showAlert('บันทึกแล้ว', 'เพิ่มรายการเรียบร้อย (ลูกหลานจะเห็นรายการนี้ด้วย)', 'success');
        loadExpenses();
      } else {
        const data = await response.json();
        showAlert('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถบันทึกได้', 'error');
      }
    } catch (error) {
      console.error('Add expense error:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const handleDeleteExpense = (id: string) => {
    // Note: Backend doesn't have delete endpoint yet, so just remove from UI
    setExpenses(expenses.filter(e => e.id !== id));
    showAlert('ลบแล้ว', 'ลบรายการเรียบร้อย', 'success');
  };

  const handleNoteSubmit = async (mood: string) => {
    if (!selectedTime) {
      setTimeError(true);
      showAlert('ลืมระบุเวลา', 'กรุณาเลือกช่วงเวลาก่อนครับ', 'error');
      setTimeout(() => setTimeError(false), 1000);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/caregiver/moods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderId,
          caregiverId: userId,
          mood,
          timeOfDay: selectedTime,
          note: `คุณยาย${mood}`,
        }),
      });

      if (response.ok) {
        setRecordedMoods([`เวลา ${selectedTime}: ${mood}`, ...recordedMoods]);
        showAlert('บันทึกเรียบร้อย', `คุณยาย${mood} (${selectedTime})`, 'success');
        setSelectedTime('');
      } else {
        showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
      }
    } catch (error) {
      console.error('Record mood error:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const handleExtraNoteSubmit = async () => {
    if (!extraNote) return;

    try {
      const response = await fetch(`${BASE_URL}/caregiver/moods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderId,
          caregiverId: userId,
          mood: 'note',
          timeOfDay: 'general',
          note: extraNote,
        }),
      });

      if (response.ok) {
        setRecordedMoods([`📢 บันทึกเพิ่มเติม: ${extraNote}`, ...recordedMoods]);
        setExtraNote('');
        showAlert('บันทึกแล้ว', 'บันทึกข้อความเพิ่มเติมเรียบร้อย', 'success');
      } else {
        showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
      }
    } catch (error) {
      console.error('Record note error:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const handleSendReport = async () => {
    const moods = recordedMoods.filter(m => !m.includes('📢')).join('\n');
    const notes = recordedMoods.filter(m => m.includes('📢')).join('\n');

    try {
      const response = await fetch(`${BASE_URL}/caregiver/reports/daily`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderId,
          caregiverId: userId,
          title: `สรุปงานวันที่ ${new Date().toLocaleDateString('th-TH')}`,
          summary: `${moods}\n${notes}`,
          tasksCompleted: completedCount,
          tasksTotal: tasks.length,
          healthStatus: 'normal',
          overallMood: recordedMoods.length > 0 ? recordedMoods[0] : 'ปกติ',
          expenseTotal: totalExpense,
          highlights: recordedMoods.filter(m => !m.includes('📢')),
          concerns: [],
        }),
      });

      if (response.ok) {
        const reportMsg = `สรุปงานวันนี้ส่งให้ลูกหลานแล้ว:\n\n✅ งานเสร็จ: ${completedCount}/${tasks.length}\n💰 ค่าใช้จ่าย: ${totalExpense} บาท\n\n${moods}\n${notes}`;
        showAlert('ส่งรายงานสำเร็จ! ✅', reportMsg, 'success');
      } else {
        showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งรายงานได้', 'error');
      }
    } catch (error) {
      console.error('Send report error:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const handleVitalSubmit = async () => {
    if (healthMode === 'device') {
      if (!sys || !dia) {
        return showAlert("ข้อมูลไม่ครบ", "กรุณากรอกค่าความดัน", 'error');
      }

      try {
        const response = await fetch(`${BASE_URL}/caregiver/health/blood-pressure`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            elderId,
            caregiverId: userId,
            systolic: parseInt(sys),
            diastolic: parseInt(dia),
            notes: parseInt(sys) > 140 ? 'ความดันสูงกว่าปกติ' : 'ปกติ',
          }),
        });

        if (response.ok) {
          if (parseInt(sys) > 140) {
            showAlert("แจ้งเตือน!", "ความดันสูงกว่าปกติ\nให้คุณยายพัก 15 นาทีแล้ววัดใหม่", 'error');
          } else {
            showAlert("เรียบร้อย", "ค่าความดันปกติครับ", 'success');
            setSys('');
            setDia('');
            setTimeout(() => setActiveTab('home'), 1500);
          }
        } else {
          showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
        }
      } catch (error) {
        console.error('Record blood pressure error:', error);
        showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
      }
    } else {
      try {
        const response = await fetch(`${BASE_URL}/caregiver/health/observation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            elderId,
            caregiverId: userId,
            observation: manualChecks.join(', '),
            notes: manualChecks.length === 0 ? 'ปกติ' : `มีอาการ: ${manualChecks.join(', ')}`,
          }),
        });

        if (response.ok) {
          const msg = manualChecks.length === 0 ? "คุณยายอาการปกติ" : `บันทึกอาการ: ${manualChecks.join(', ')}`;
          showAlert(manualChecks.length === 0 ? "ปกติ" : "บันทึกแล้ว", msg, manualChecks.length === 0 ? 'success' : 'info');
          setManualChecks([]);
          setTimeout(() => setActiveTab('home'), 1500);
        } else {
          showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
        }
      } catch (error) {
        console.error('Record observation error:', error);
        showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
      }
    }
  };

  const toggleManualCheck = (sym: string) => {
    if (manualChecks.includes(sym)) setManualChecks(manualChecks.filter(c => c !== sym));
    else setManualChecks([...manualChecks, sym]);
  };

  const startTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`${BASE_URL}/caregiver/tasks/${selectedTask.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showAlert('เริ่มงานแล้ว', 'บันทึกการทำงานเรียบร้อย', 'success');
        setSelectedTask(null);
        loadTasks(); // Reload tasks
      } else {
        showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกได้', 'error');
      }
    } catch (error) {
      console.error('Complete task error:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const handleSOS = async (reason: string) => {
    try {
      const response = await fetch(`${BASE_URL}/caregiver/notifications/sos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderId,
          caregiverId: userId,
          reason,
          location: 'บ้านผู้สูงอายุ',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowSOS(false);
        showAlert(
          'แจ้งเหตุฉุกเฉิน', 
          `${reason}\n\n✅ ส่งแจ้งเตือนไปยังครอบครัวเรียบร้อยแล้ว\nพวกเขาจะได้รับการแจ้งเตือนทันที`,
          'error'
        );
      } else {
        const data = await response.json();
        showAlert('เกิดข้อผิดพลาด', data.message || 'ไม่สามารถส่งแจ้งเตือนได้', 'error');
      }
    } catch (error) {
      console.error('SOS error:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    // Clear all cookies
    Cookies.remove('token');
    Cookies.remove('userType');
    Cookies.remove('userId');
    Cookies.remove('userName');
    Cookies.remove('elderId');
    
    // Redirect to login page
    window.location.href = '/caregiver';
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden h-full font-sans text-gray-800">
      
      {/* Header */}
      <div className="bg-blue-600 px-6 py-6 rounded-b-3xl shadow-md flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
            <User size={28} className="text-white" />
          </div>
          <div>
            <p className="text-blue-100 text-xs">ผู้ดูแลของ:</p>
            <p className="text-white text-lg font-bold">
              {elder ? `${elder.relation}${elder.name}` : 'กำลังโหลด...'} 👵
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleLogout}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-full shadow-lg active:scale-95 flex items-center gap-1 transition-transform"
          >
            <LogOut size={18} />
          </button>
          <button onClick={() => setShowSOS(true)} className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-full shadow-lg active:scale-95 flex items-center gap-1 border-2 border-red-400 transition-transform">
            <AlertTriangle size={18} fill="white" /> SOS
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 pb-24 scrollbar-hide">
        
        {/* 1. Home Tab */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-300">
            {/* Progress */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex justify-between items-center border border-gray-100">
              <div>
                <p className="text-gray-500 text-sm font-medium">ความคืบหน้า</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(progressPercent)}%</p>
              </div>
              <div className="w-2/3 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            {/* Check-in/Check-out Status */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  สถานะวันนี้
                </h3>
                {isLoadingAttendance && <span className="text-xs text-gray-400">กำลังโหลด...</span>}
              </div>
              
              <div className="space-y-2">
                {!attendanceStatus.hasCheckedIn ? (
                  <button
                    onClick={handleCheckIn}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    ลงเวลาเข้างาน
                  </button>
                ) : !attendanceStatus.hasCheckedOut ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">เข้างาน:</span>
                      <span className="font-bold text-green-600">
                        {formatTime(attendanceStatus.attendance?.checkInTime || '')}
                      </span>
                    </div>
                    <button
                      onClick={handleCheckOut}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      ลงเวลาออกงาน
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-600">เข้างาน:</span>
                      <span className="font-bold text-green-600">
                        {formatTime(attendanceStatus.attendance?.checkInTime || '')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-600">ออกงาน:</span>
                      <span className="font-bold text-orange-600">
                        {formatTime(attendanceStatus.attendance?.checkOutTime || '')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-gray-200">
                      <span className="text-gray-600">ทำงาน:</span>
                      <span className="font-bold text-blue-600">
                        {attendanceStatus.attendance?.hoursWorked?.toFixed(2)} ชม.
                        {attendanceStatus.attendance?.isOvertime && (
                          <span className="text-purple-600 ml-1">
                            (OT: {attendanceStatus.attendance.overtimeHours.toFixed(2)} ชม.)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hero Task */}
            {pendingTask && (
              <div onClick={() => setSelectedTask(pendingTask)} className="relative bg-gradient-to-br from-indigo-600 to-blue-500 p-6 rounded-3xl mb-8 shadow-xl text-white overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="flex items-center mb-3">
                  <div className="bg-white/20 p-2 rounded-full mr-2 backdrop-blur-md">
                    <Bell size={20} className="text-yellow-300 animate-pulse" fill="currentColor" />
                  </div>
                  <span className="text-yellow-300 font-bold text-sm tracking-wider">งานปัจจุบัน</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">{pendingTask.time} น.</h2>
                <h3 className="text-xl font-bold mb-4 opacity-90">{pendingTask.title}</h3>
                <button className="w-full bg-white text-blue-600 text-lg font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2">
                  👉 ดูวิธีทำและเริ่มงาน
                </button>
              </div>
            )}

            {/* Task List */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>รายการทั้งหมด
            </h3>
            
            {isLoadingTasks ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                กำลังโหลดรายการงาน...
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
                <ClipboardList size={48} className="mx-auto mb-2 text-gray-300" />
                <p>ยังไม่มีรายการงานวันนี้</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                <div key={task.id} onClick={() => setSelectedTask(task)} 
                     className={`flex items-center p-4 rounded-2xl border-l-8 shadow-sm cursor-pointer transition-all hover:shadow-md ${task.status === 'done' ? 'bg-gray-100 border-gray-300 opacity-70' : 'bg-white border-blue-500'}`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mr-4 font-bold text-lg ${task.status === 'done' ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                    {task.time}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className={`font-bold ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{task.title}</h4>
                      {task.status === 'done' && <CheckCircle size={20} className="text-green-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{task.detail}</p>
                  </div>
                  {task.status !== 'done' && <ChevronRight className="text-gray-300" />}
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Health Tab */}
        {activeTab === 'health' && (
          <div className="flex flex-col items-center animate-in fade-in duration-300">
            <div className="bg-gray-200 p-1 rounded-2xl flex w-full max-w-xs mb-8">
              <button onClick={() => setHealthMode('device')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${healthMode === 'device' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}>มีเครื่องวัด</button>
              <button onClick={() => setHealthMode('manual')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${healthMode === 'manual' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}>สังเกตอาการ</button>
            </div>
            
            {healthMode === 'device' ? (
              <div className="w-full max-w-md space-y-6">
                {/* Display Area */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-blue-50">
                  <div className="flex justify-around items-center mb-4">
                    <div className="text-center">
                      <p className="text-gray-500 text-sm font-bold mb-2">ตัวบน (SYS)</p>
                      <div className="text-5xl font-bold text-blue-600 h-16 flex items-center justify-center min-w-[80px]">
                        {sys || '-'}
                      </div>
                    </div>
                    <div className="w-[2px] h-20 bg-gray-200"></div>
                    <div className="text-center">
                      <p className="text-gray-500 text-sm font-bold mb-2">ตัวล่าง (DIA)</p>
                      <div className="text-5xl font-bold text-blue-600 h-16 flex items-center justify-center min-w-[80px]">
                        {dia || '-'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => setSys('')} 
                      className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm"
                    >
                      ล้าง SYS
                    </button>
                    <button 
                      onClick={() => setDia('')} 
                      className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm"
                    >
                      ล้าง DIA
                    </button>
                  </div>
                </div>

                {/* Number Pad */}
                <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-blue-50">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          if (!dia && sys.length < 3) {
                            const newSys = sys + num;
                            setSys(newSys);
                            if (newSys.length === 3) {
                              // Auto switch to DIA after 3 digits
                              setTimeout(() => setDia(''), 100);
                            }
                          } else if (dia.length < 3) {
                            setDia(dia + num);
                          }
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-3xl py-6 rounded-2xl transition-all active:scale-95 shadow-sm"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        if (!dia) setSys(sys.slice(0, -1));
                        else setDia(dia.slice(0, -1));
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xl py-6 rounded-2xl transition-all active:scale-95 shadow-sm"
                    >
                      ลบ
                    </button>
                    <button
                      onClick={() => {
                        if (!dia && sys.length < 3) {
                          const newSys = sys + '0';
                          setSys(newSys);
                          if (newSys.length === 3) {
                            setTimeout(() => setDia(''), 100);
                          }
                        } else if (dia.length < 3) {
                          setDia(dia + '0');
                        }
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-3xl py-6 rounded-2xl transition-all active:scale-95 shadow-sm"
                    >
                      0
                    </button>
                    <button
                      onClick={() => {
                        setSys('');
                        setDia('');
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xl py-6 rounded-2xl transition-all active:scale-95 shadow-sm"
                    >
                      ล้าง
                    </button>
                  </div>
                  <p className="text-center text-gray-400 text-xs mt-3">
                    {!dia ? 'กรอก SYS 3 หลัก (จะเด้งไปตัวล่างอัตโนมัติ)' : 'กำลังกรอก DIA 3 หลัก'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xs space-y-3 mb-6">
                {['หน้าแดง/ตัวร้อน', 'บวมตามแขนขา', 'หายใจหอบ/แรง', 'ปวดหัว/เวียนหัว', 'ปกติ'].map(sym => (
                  <button key={sym} onClick={() => toggleManualCheck(sym)} 
                    className={`w-full p-4 rounded-2xl text-left font-bold text-lg flex justify-between items-center transition-all border ${manualChecks.includes(sym) ? 'bg-red-50 border-2 border-red-400 text-red-700' : 'bg-white border-gray-200 text-gray-600 shadow-sm'}`}>
                    {sym} {manualChecks.includes(sym) && <CheckCircle size={24} className="text-red-500" />}
                  </button>
                ))}
              </div>
            )}

            <button onClick={handleVitalSubmit} className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-2xl shadow-xl mt-6 active:scale-95 transition-transform">บันทึกข้อมูล</button>
          </div>
        )}

        {/* 3. Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">บัญชีรายวัน</h2>
              <button onClick={handleSendReport} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 font-bold transition-transform active:scale-95 text-sm">
                <Send size={16} /> ส่งสรุปงาน
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-3xl text-white shadow-lg mb-8">
              <p className="text-green-100 font-medium mb-1">ยอดรวมวันนี้</p>
              <h2 className="text-4xl font-bold">{totalExpense.toLocaleString()} <span className="text-xl font-normal">บาท</span></h2>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8">
              <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-green-600"/> เพิ่มรายการ
              </h3>
              <input type="text" placeholder="ชื่อรายการ (เช่น ไข่ไก่)" className="w-full p-4 bg-gray-50 rounded-xl mb-3 border border-gray-200 focus:ring-2 focus:ring-green-400 outline-none text-gray-800" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
              <div className="flex flex-col gap-3">
                <input type="number" placeholder="ราคา (บาท)" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-400 outline-none text-gray-800" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                <button onClick={handleAddExpense} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 active:scale-95 transition-transform">เพิ่มรายการ</button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingBag size={20} /> รายการวันนี้ ({expenses.length})
            </h3>
            
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <div className="text-gray-400 text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                  <ShoppingBag size={40} className="mb-2 opacity-50 mx-auto" />
                  <p>ยังไม่มีรายการซื้อของ</p>
                </div>
              ) : (
                expenses.map((ex, idx) => (
                  <div key={ex.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg shrink-0">{idx + 1}</div>
                        <div className="flex-1">
                          <span className="font-bold text-gray-700 text-lg block">{ex.item}</span>
                          <span className="text-sm text-gray-500">{formatDate(ex.date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900 text-xl">{ex.price.toLocaleString()}.-</span>
                        <button onClick={() => handleDeleteExpense(ex.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        ex.addedBy === "caregiver" 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {ex.addedBy === "caregiver" ? "👤 คุณเพิ่ม (ครอบครัวเห็น)" : "👨‍👩‍👧 ครอบครัวเพิ่ม"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. Note Tab */}
        {activeTab === 'note' && (
          <div className="animate-in fade-in duration-300 text-center">
            <h3 className={`text-xl font-bold mb-4 mt-2 transition-colors ${timeError ? 'text-red-500' : 'text-gray-800'}`}>1. เหตุการณ์ช่วงไหน?</h3>
            <div className={`grid grid-cols-2 gap-3 mb-8 p-2 rounded-2xl transition-all ${timeError ? 'bg-red-50 ring-4 ring-red-200' : ''}`}>
              {[
                { l: 'เช้า', i: CloudSun }, { l: 'บ่าย', i: Sun }, { l: 'เย็น', i: Sunset }, { l: 'ก่อนนอน', i: Moon }
              ].map(t => (
                <button key={t.l} onClick={() => { setSelectedTime(t.l); setTimeError(false); }} 
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedTime === t.l ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-100 text-gray-500'}`}>
                  <t.i size={28} className="mb-2" />
                  <span className="font-bold">{t.l}</span>
                </button>
              ))}
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-4">2. อารมณ์เป็นไง?</h3>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                { l: 'ปกติ', e: '😌', c: 'bg-blue-100 text-blue-800' },
                { l: 'อารมณ์ดี', e: '😊', c: 'bg-green-100 text-green-800' },
                { l: 'ซึม', e: '😐', c: 'bg-gray-100 text-gray-800' },
                { l: 'หงุดหงิด', e: '😠', c: 'bg-red-100 text-red-800' },
                { l: 'นอนไม่หลับ', e: '😴', c: 'bg-purple-100 text-purple-800' }
              ].map(m => (
                <button key={m.l} onClick={() => handleNoteSubmit(m.l)} 
                  className={`flex flex-col items-center justify-center w-32 h-32 rounded-3xl border-2 hover:brightness-95 transition-transform active:scale-95 shadow-sm ${m.c} border-transparent`}>
                  <span className="text-4xl mb-2">{m.e}</span>
                  <span className="font-bold text-lg">{m.l}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                <MessageSquare size={20} className="text-blue-500" /> 3. บันทึกเพิ่มเติม
              </h3>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-4">
                <input type="text" placeholder="เช่น ผ้าอ้อมหมด, ยาหมด" className="w-full p-3 bg-gray-50 rounded-xl mb-3 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-center text-gray-800" value={extraNote} onChange={e => setExtraNote(e.target.value)} />
                <button onClick={handleExtraNoteSubmit} className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 active:scale-95 transition-all">บันทึกข้อความ</button>
              </div>
              <p className="text-gray-400 text-sm">ข้อความจะถูกรวมในรายงานสรุปตอนส่งงานครับ</p>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-gray-100 flex justify-around py-3 pb-6 sm:pb-3 sticky bottom-0 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-2xl shrink-0">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1 rounded-xl mb-1 ${activeTab === 'home' ? 'bg-blue-50' : ''}`}><Home size={26} strokeWidth={activeTab === 'home' ? 2.5 : 2} /></div><span className="text-xs font-bold">งานวันนี้</span>
        </button>
        <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${activeTab === 'health' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1 rounded-xl mb-1 ${activeTab === 'health' ? 'bg-blue-50' : ''}`}><Activity size={26} strokeWidth={activeTab === 'health' ? 2.5 : 2} /></div><span className="text-xs font-bold">สุขภาพ</span>
        </button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${activeTab === 'wallet' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1 rounded-xl mb-1 ${activeTab === 'wallet' ? 'bg-blue-50' : ''}`}><Wallet size={26} strokeWidth={activeTab === 'wallet' ? 2.5 : 2} /></div><span className="text-xs font-bold">บัญชี</span>
        </button>
        <button onClick={() => setActiveTab('note')} className={`flex flex-col items-center p-2 w-full transition-all active:scale-90 ${activeTab === 'note' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={`p-1 rounded-xl mb-1 ${activeTab === 'note' ? 'bg-blue-50' : ''}`}><FileCheck size={26} strokeWidth={activeTab === 'note' ? 2.5 : 2} /></div><span className="text-xs font-bold">จดอาการ</span>
        </button>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm mb-2 inline-block">เวลา {selectedTask.time} น.</span>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={24} className="text-gray-500" /></button>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-gray-700 font-bold"><Info size={20} className="text-blue-500" /> <h3>รายละเอียด</h3></div>
                <p className="text-gray-600 text-lg ml-7">{selectedTask.detail}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold border-b pb-2"><ClipboardList size={20} className="text-orange-500" /> <h3>วิธีปฏิบัติ</h3></div>
                <div className="space-y-3 pl-2">
                  {selectedTask.instruction.split('\n').map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="min-w-[24px] h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm mt-0.5">{idx + 1}</div>
                      <p className="text-gray-600 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-100">
              <button onClick={startTask} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                <Camera size={24} /> เริ่มทำรายการนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="bg-white w-full sm:w-11/12 rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse"><AlertTriangle size={40} className="text-red-600" /></div>
              <h2 className="text-3xl font-bold text-red-600">แจ้งเหตุฉุกเฉิน</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {['🤕 หกล้ม', '🫁 หายใจไม่ออก', '💤 หมดสติ', '❓ อื่นๆ'].map(r => (
                <button key={r} onClick={() => handleSOS(r)} className="bg-red-50 hover:bg-red-100 border-2 border-red-100 py-4 rounded-2xl text-red-700 font-bold text-lg transition-colors active:scale-95 shadow-sm">{r}</button>
              ))}
            </div>
            <button onClick={() => setShowSOS(false)} className="w-full py-4 bg-gray-100 rounded-2xl text-gray-600 font-bold text-lg hover:bg-gray-200">ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <CustomAlert isOpen={alert.isOpen} title={alert.title} message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, isOpen: false })} />

    </div>
  );
}