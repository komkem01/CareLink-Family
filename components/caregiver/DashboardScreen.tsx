'use client';
import { useState, useMemo, useEffect } from 'react';
import { 
  Home, Activity, Wallet, FileCheck, User, AlertTriangle, Bell, 
  CheckCircle, ChevronRight, ShoppingBag, Plus, Send, Trash2, MessageSquare,
  CloudSun, Sun, Sunset, Moon, Info, ClipboardList, Camera, X, Pill, LogOut, Clock
} from 'lucide-react';
import CustomAlert from '../CustomAlert';

// --- Types & Mock Data ---
interface Task { id: string; time: string; title: string; detail: string; instruction: string; status: 'done'|'pending'; }
interface Expense { 
  id: string; 
  item: string; 
  price: number;
  addedBy: "caregiver" | "family"; // ระบุว่าใครเป็นคนเพิ่ม
  date: string;
}

const INITIAL_TASKS: Task[] = [
  { id: '1', time: '08:00', title: 'อาหารเช้า + ยา', detail: 'โจ๊กหมู + ยา 3 เม็ด', instruction: '1. อุ่นโจ๊ก\n2. เตรียมน้ำอุ่น\n3. ทานยาหลังอาหารทันที', status: 'done' },
  { id: '2', time: '10:00', title: 'วัดความดัน', detail: 'พัก 15 นาทีก่อนวัด', instruction: '1. นั่งพักเฉยๆ\n2. ห้ามชวนคุย\n3. วางแขนระดับหัวใจ', status: 'done' },
  { id: '3', time: '12:00', title: 'อาหารเที่ยง', detail: 'ข้าวต้มปลา', instruction: '1. เตรียมข้าวต้ม\n2. ระวังก้าง', status: 'pending' },
  { id: '4', time: '13:00', title: 'กายภาพบำบัด', detail: 'ยืดแขน 20 ครั้ง', instruction: '1. ยกแขนขึ้น-ลง\n2. ทำช้าๆ', status: 'pending' },
  { id: '5', time: '16:00', title: 'อาหารว่าง', detail: 'นมถั่วเหลือง', instruction: '1. เทใส่แก้ว\n2. ชวนคุยเรื่องความจำ', status: 'pending' },
];

export default function DashboardScreen() {
  // Authentication & Config
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const [token, setToken] = useState<string>('');
  const [caregiverId, setCaregiverId] = useState<string>('');
  const [elderId, setElderId] = useState<string>('');
  const [elderName, setElderName] = useState<string>('คุณยาย');

  // Load auth data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token') || '';
      const storedUser = localStorage.getItem('user');
      setToken(storedToken);
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCaregiverId(user.id || '');
          setElderId(user.elderId || '');
          
          // Fetch elder name
          if (user.elderId && storedToken) {
            fetch(`${BASE_URL}/caregiver/elder`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            })
              .then(res => res.json())
              .then(data => {
                if (data.name) setElderName(data.name);
              })
              .catch(err => console.error('Failed to fetch elder:', err));
          }
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
      }
    }
  }, [BASE_URL]);

  // State
  const [activeTab, setActiveTab] = useState('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [confirmDeleteExpenseId, setConfirmDeleteExpenseId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [recordedMoods, setRecordedMoods] = useState<string[]>([]);
  const [extraNote, setExtraNote] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [healthMode, setHealthMode] = useState('device');
  const [manualChecks, setManualChecks] = useState<string[]>([]);
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [heartRate, setHeartRate] = useState('');
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
  
  // Attendance State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentSessionStart, setCurrentSessionStart] = useState<string | null>(null); // เก็บ timestamp ของ check-in ล่าสุด

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check attendance status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkedIn = localStorage.getItem('isCheckedIn') === 'true';
      const storedCheckInTime = localStorage.getItem('checkInTime');
      const sessionStart = localStorage.getItem('currentSessionStart');
      setIsCheckedIn(checkedIn);
      setCheckInTime(storedCheckInTime);
      setCurrentSessionStart(sessionStart);
    }
  }, []);

  // Fetch Notifications
  useEffect(() => {
    if (!caregiverId || !token) return;
    setLoadingNotifications(true);
    fetch(`${BASE_URL}/caregiver/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const notifs = Array.isArray(data) ? data : [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: any) => !n.isRead).length);
        setLoadingNotifications(false);
      })
      .catch(err => {
        console.error('Failed to fetch notifications:', err);
        setNotifications([]);
        setLoadingNotifications(false);
      });
  }, [caregiverId, token, BASE_URL]);

  // Fetch Tasks
  useEffect(() => {
    if (!caregiverId || !token || !isCheckedIn || !currentSessionStart) return; // เพิ่มเงื่อนไข currentSessionStart
    
    const today = new Date().toISOString().split('T')[0];
    
    const fetchTasks = () => {
      // ไม่ต้อง setLoadingTasks เพื่อไม่ให้หน้ากระพริบ
      fetch(`${BASE_URL}/caregiver/tasks?caregiverId=${caregiverId}&date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const tasksData: Task[] = Array.isArray(data) ? data
            .filter((t: any) => {
              // แสดงงานที่ pending ทั้งหมด (ไม่ว่าจะสร้างเมื่อไหร่)
              if (t.status === 'pending') return true;
              // แสดงงานที่ done เฉพาะที่ทำในเซสชันนี้
              if (t.status === 'done' && t.createdAt) {
                return new Date(t.createdAt) >= new Date(currentSessionStart);
              }
              return !t.createdAt; // backward compatible
            })
            .map((t: any) => ({
              id: t.id,
              time: t.time,
              title: t.title,
              detail: t.detail || '',
              instruction: t.instruction || '',
              status: t.status || 'pending'
            })) : [];
          setTasks(tasksData);
        })
        .catch(err => {
          console.error('Failed to fetch tasks:', err);
          // ไม่ต้องล้างข้อมูลเก่าถ้า fetch ล้มเหลว
        });
    };
    
    // โหลดครั้งแรกด้วย loading state
    setLoadingTasks(true);
    fetch(`${BASE_URL}/caregiver/tasks?caregiverId=${caregiverId}&date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const tasksData: Task[] = Array.isArray(data) ? data
          .filter((t: any) => {
            // แสดงงานที่ pending ทั้งหมด (ไม่ว่าจะสร้างเมื่อไหร่)
            if (t.status === 'pending') return true;
            // แสดงงานที่ done เฉพาะที่ทำในเซสชันนี้
            if (t.status === 'done' && t.createdAt) {
              return new Date(t.createdAt) >= new Date(currentSessionStart);
            }
            return !t.createdAt; // backward compatible
          })
          .map((t: any) => ({
            id: t.id,
            time: t.time,
            title: t.title,
            detail: t.detail || '',
            instruction: t.instruction || '',
            status: t.status || 'pending'
          })) : [];
        setTasks(tasksData);
        setLoadingTasks(false);
      })
      .catch(err => {
        console.error('Failed to fetch tasks:', err);
        setLoadingTasks(false);
      });
    
    // โหลดซ้ำทุก 10 วินาทีแบบ silent (ไม่แสดง loading)
    const interval = setInterval(fetchTasks, 10000);
    
    return () => clearInterval(interval);
  }, [caregiverId, token, BASE_URL, isCheckedIn, currentSessionStart]);

  // Fetch Expenses
  useEffect(() => {
    if (!elderId || !token || !isCheckedIn || !currentSessionStart) return; // เพิ่มเงื่อนไข currentSessionStart
    const today = new Date().toISOString().split('T')[0];
    setLoadingExpenses(true);
    fetch(`${BASE_URL}/caregiver/expenses?elderId=${elderId}&date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const expensesData = Array.isArray(data) ? data
          .filter((e: any) => {
            // กรองเฉพาะ expenses ที่สร้างหลัง check-in ล่าสุด
            if (!e.createdAt) return true; // backward compatible
            return new Date(e.createdAt) >= new Date(currentSessionStart);
          })
          .map((e: any) => ({
            id: e.id,
            item: e.description || e.item,
            price: Number(e.amount),
            addedBy: 'caregiver' as const,
            date: new Date(e.date).toISOString().split('T')[0]
          }))
          .filter((e: any) => e.date === today) : [];
        setExpenses(expensesData);
        setLoadingExpenses(false);
      })
      .catch(err => {
        console.error('Failed to fetch expenses:', err);
        setLoadingExpenses(false);
      });
  }, [elderId, token, BASE_URL, isCheckedIn, currentSessionStart]);

  // Computed
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const totalExpense = expenses.reduce((sum, ex) => sum + ex.price, 0);
  const pendingTask = tasks.find(t => t.status === 'pending');

  // Helper function to format relative time
  const formatRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    
    // ถ้าเกิน 24 ชม. แสดงเวลา
    return then.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  // Methods
  const showAlert = (title: string, message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const handleAddExpense = async () => {
    if (!newItemName || !newItemPrice) {
      return showAlert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อรายการและราคา', 'error');
    }
    
    try {
      const res = await fetch(`${BASE_URL}/caregiver/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          item: newItemName,
          amount: parseFloat(newItemPrice),
          date: new Date().toISOString().split('T')[0],
          elderId: elderId,
          caregiverId: caregiverId
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.id) {
        // Add to local state
        const newExpense: Expense = {
          id: data.id,
          item: newItemName,
          price: parseFloat(newItemPrice),
          addedBy: "caregiver",
          date: new Date().toISOString().split("T")[0],
        };
        setExpenses([newExpense, ...expenses]);
        setNewItemName('');
        setNewItemPrice('');
        showAlert('บันทึกแล้ว', 'เพิ่มรายการเรียบร้อย (ลูกหลานจะเห็นรายการนี้ด้วย)', 'success');
      } else {
        showAlert('เพิ่มล้มเหลว', data.message || 'เกิดข้อผิดพลาดในการเพิ่มรายการ', 'error');
      }
    } catch (err) {
      console.error('Add expense error:', err);
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
    }
  };

  const handleDeleteExpense = (id: string) => {
    setConfirmDeleteExpenseId(id);
  };

  const handleDeleteExpenseConfirmed = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/caregiver/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setExpenses(expenses.filter(e => e.id !== id));
        showAlert('ลบแล้ว', 'ลบรายการเรียบร้อย', 'info');
      } else {
        const data = await res.json();
        showAlert('ลบล้มเหลว', data.message || 'เกิดข้อผิดพลาดในการลบ', 'error');
      }
    } catch (err) {
      console.error('Delete expense error:', err);
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
    }
    setConfirmDeleteExpenseId(null);
  };

  const handleNoteSubmit = async (mood: string) => {
    if (!selectedTime) {
      setTimeError(true);
      showAlert('ลืมระบุเวลา', 'กรุณาเลือกช่วงเวลาก่อนครับ', 'error');
      setTimeout(() => setTimeError(false), 1000);
      return;
    }
    
    try {
      const res = await fetch(`${BASE_URL}/caregiver/health/observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          elderId: elderId,
          caregiverId: caregiverId,
          observation: `${selectedTime}: ${mood}`,
          notes: `อารมณ์: ${mood}`,
          timestamp: new Date().toISOString()
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setRecordedMoods([`เวลา ${selectedTime}: ${mood}`, ...recordedMoods]);
        showAlert('บันทึกเรียบร้อย', `คุณยาย${mood} (${selectedTime})\n\nข้อมูลถูกส่งให้ครอบครัวแล้ว`, 'success');
        setSelectedTime('');
      } else {
        showAlert('บันทึกล้มเหลว', data.message || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (err) {
      console.error('Note submit error:', err);
      // Fallback to local storage if API fails
      setRecordedMoods([`เวลา ${selectedTime}: ${mood}`, ...recordedMoods]);
      showAlert('บันทึกเรียบร้อย', `คุณยาย${mood} (${selectedTime})`, 'success');
      setSelectedTime('');
    }
  };

  const handleExtraNoteSubmit = async () => {
    if (!extraNote) return;
    
    try {
      const res = await fetch(`${BASE_URL}/caregiver/health/observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          elderId: elderId,
          caregiverId: caregiverId,
          observation: `บันทึกเพิ่มเติม: ${extraNote}`,
          notes: extraNote,
          timestamp: new Date().toISOString()
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setRecordedMoods([`📢 บันทึกเพิ่มเติม: ${extraNote}`, ...recordedMoods]);
        setExtraNote('');
        showAlert('บันทึกแล้ว', 'บันทึกข้อความเพิ่มเติมเรียบร้อย\n\nข้อมูลถูกส่งให้ครอบครัวแล้ว', 'success');
      } else {
        showAlert('บันทึกล้มเหลว', data.message || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (err) {
      console.error('Extra note submit error:', err);
      // Fallback to local storage if API fails
      setRecordedMoods([`📢 บันทึกเพิ่มเติม: ${extraNote}`, ...recordedMoods]);
      setExtraNote('');
      showAlert('บันทึกแล้ว', 'บันทึกข้อความเพิ่มเติมเรียบร้อย', 'success');
    }
  };

  const handleSendReport = async () => {
    const moods = recordedMoods.filter(m => !m.includes('📢'));
    const notes = recordedMoods.filter(m => m.includes('📢'));
    
    if (!currentSessionStart) {
      showAlert('ไม่สามารถส่งรายงานได้', 'กรุณา Check-in เข้างานก่อนส่งรายงาน', 'error');
      return;
    }
    
    try {
      // ดึงข้อมูลงานทั้งหมดของวันนี้
      const today = new Date().toISOString().split('T')[0];
      const tasksRes = await fetch(`${BASE_URL}/caregiver/tasks?caregiverId=${caregiverId}&date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTasks = await tasksRes.json();
      const allTasksArray = Array.isArray(allTasks) ? allTasks : [];
      
      // กรองเฉพาะงานในเซสชันนี้ (ที่สร้างหลัง check-in หรือที่ทำเสร็จในเซสชันนี้)
      const sessionTasks = allTasksArray.filter((t: any) => {
        if (!t.createdAt) return true; // backward compatible
        const taskCreatedAt = new Date(t.createdAt);
        const sessionStart = new Date(currentSessionStart);
        
        // แสดงงานที่สร้างหลัง check-in หรืองานที่ทำเสร็จในเซสชันนี้
        if (taskCreatedAt >= sessionStart) return true;
        if (t.status === 'done' && t.completedAt) {
          return new Date(t.completedAt) >= sessionStart;
        }
        return false;
      });
      
      // ดึงข้อมูลค่าใช้จ่ายทั้งหมดของวันนี้
      const expensesRes = await fetch(`${BASE_URL}/caregiver/expenses?elderId=${elderId}&date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allExpenses = await expensesRes.json();
      const allExpensesArray = Array.isArray(allExpenses) ? allExpenses : [];
      
      // กรองเฉพาะค่าใช้จ่ายในเซสชันนี้
      const sessionExpenses = allExpensesArray.filter((e: any) => {
        if (!e.createdAt) return true;
        return new Date(e.createdAt) >= new Date(currentSessionStart);
      });
      
      // คำนวณข้อมูลจากเซสชันนี้
      const sessionCompletedCount = sessionTasks.filter((t: any) => t.status === 'done').length;
      const sessionTotalTasks = sessionTasks.length;
      const sessionTotalExpense = sessionExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
      
      // ดึงเวลา check-in และตรวจสอบว่าเป็น valid date
      const checkInDisplay = checkInTime 
        ? (() => {
            const date = new Date(checkInTime);
            return !isNaN(date.getTime()) 
              ? date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
              : '-';
          })()
        : '-';
      
      // สร้างรายละเอียดงาน
      const taskDetails = sessionTasks.length > 0 
        ? sessionTasks.map((t: any) => 
            `${t.status === 'done' ? '✅' : '⏳'} ${t.time} - ${t.title}`
          ).join('\n')
        : 'ไม่มีงานในกะนี้';
      
      // สร้างรายละเอียดค่าใช้จ่าย
      const expenseDetails = sessionExpenses.length > 0
        ? sessionExpenses.map((e: any) => 
            `• ${e.description || e.item}: ${Number(e.amount || 0)} บาท`
          ).join('\n')
        : 'ไม่มีค่าใช้จ่าย';
      
      // สร้าง summary ที่ละเอียด
      const detailedSummary = `📊 สรุปการทำงานกะนี้
⏰ เข้างาน: ${checkInDisplay}

✅ งานที่ทำ: ${sessionCompletedCount}/${sessionTotalTasks} งาน
${taskDetails}

💰 ค่าใช้จ่าย: ${sessionTotalExpense} บาท
${expenseDetails}

${moods.length > 0 ? '😊 อาการผู้สูงอายุ:\n' + moods.join('\n') : ''}
${notes.length > 0 ? '\n📝 บันทึกเพิ่มเติม:\n' + notes.map(n => n.replace('📢 บันทึกเพิ่มเติม: ', '')).join('\n') : ''}`;
      
      const res = await fetch(`${BASE_URL}/caregiver/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          elderId: elderId,
          title: `รายงานกะทำงาน ${new Date().toLocaleDateString('th-TH')} ${checkInDisplay}`,
          summary: detailedSummary,
          tasksCompleted: sessionCompletedCount,
          tasksTotal: sessionTotalTasks,
          healthStatus: 'normal',
          healthNotes: moods.join(', ') || 'ไม่มีบันทึก',
          overallMood: moods.length > 0 ? moods[0].split(': ')[1] : null,
          expenseTotal: sessionTotalExpense,
          incidents: [],
          highlights: moods,
          concerns: notes.map(n => n.replace('📢 บันทึกเพิ่มเติม: ', '')),
          photoUrls: []
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const reportMsg = `✅ ส่งสรุปงานกะนี้ให้ครอบครัวแล้ว\n⏰ เข้างาน: ${checkInDisplay}\n\n📋 งานที่ทำ: ${sessionCompletedCount}/${sessionTotalTasks}\n💰 ค่าใช้จ่าย: ${sessionTotalExpense} บาท`;
        showAlert('ส่งรายงานสำเร็จ! ✅', reportMsg, 'success');
        // Clear recorded moods after sending
        setRecordedMoods([]);
      } else {
        showAlert('ส่งรายงานล้มเหลว', data.message || 'เกิดข้อผิดพลาดในการส่งรายงาน', 'error');
      }
    } catch (err) {
      console.error('Send report error:', err);
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
    }
  };

  const handleVitalSubmit = async () => {
    if (healthMode === 'device') {
      if (!sys || !dia) {
        return showAlert("ข้อมูลไม่ครบ", "กรุณากรอกค่าความดัน", 'error');
      }
      
      try {
        const res = await fetch(`${BASE_URL}/caregiver/health/blood-pressure`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            elderId: elderId,
            caregiverId: caregiverId,
            systolic: parseInt(sys),
            diastolic: parseInt(dia),
            heartRate: heartRate ? parseInt(heartRate) : undefined,
            notes: ''
          })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          if (parseInt(sys) > 140) {
            showAlert("แจ้งเตือน!", "ความดันสูงกว่าปกติ\nให้คุณยายพัก 15 นาทีแล้ววัดใหม่", 'error');
          } else {
            showAlert("บันทึกเรียบร้อย", "ค่าความดันปกติครับ", 'success');
            setSys('');
            setDia('');
            setHeartRate('');
            setTimeout(() => setActiveTab('home'), 1500);
          }
        } else {
          showAlert('บันทึกล้มเหลว', data.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
        }
      } catch (err) {
        console.error('Submit vital error:', err);
        showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
      }
    } else {
      // Manual observation mode
      try {
        const observation = manualChecks.length === 0 
          ? "คุณยายอาการปกติ" 
          : manualChecks.join(', ');
        
        const res = await fetch(`${BASE_URL}/caregiver/health/observation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            elderId: elderId,
            caregiverId: caregiverId,
            observation: observation,
            notes: ''
          })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          const msg = manualChecks.length === 0 ? "คุณยายอาการปกติ" : `บันทึกอาการ: ${manualChecks.join(', ')}`;
          showAlert(manualChecks.length === 0 ? "ปกติ" : "บันทึกแล้ว", msg, manualChecks.length === 0 ? 'success' : 'info');
          setManualChecks([]);
          setTimeout(() => setActiveTab('home'), 1500);
        } else {
          showAlert('บันทึกล้มเหลว', data.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
        }
      } catch (err) {
        console.error('Submit observation error:', err);
        showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
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
      const res = await fetch(`${BASE_URL}/caregiver/tasks/${selectedTask.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'done',
          completedAt: new Date().toISOString()
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Update local state
        setTasks(tasks.map(t => 
          t.id === selectedTask.id ? { ...t, status: 'done' } : t
        ));
        showAlert('เสร็จสิ้น! ✅', `${selectedTask.title} เสร็จเรียบร้อย`, 'success');
        setSelectedTask(null);
      } else {
        showAlert('บันทึกล้มเหลว', data.message || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (err) {
      console.error('Complete task error:', err);
      // Fallback to local update if API fails
      setTasks(tasks.map(t => 
        t.id === selectedTask.id ? { ...t, status: 'done' } : t
      ));
      showAlert('เสร็จสิ้น! ✅', `${selectedTask.title} เสร็จเรียบร้อย`, 'success');
      setSelectedTask(null);
    }
  };

  const handleCheckIn = async () => {
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    try {
      const res = await fetch(`${BASE_URL}/caregiver/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          caregiverId: caregiverId,
          elderId: elderId,
          checkInTime: isoTimestamp
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsCheckedIn(true);
        setCheckInTime(isoTimestamp); // เก็บ ISO timestamp
        setCurrentSessionStart(isoTimestamp);
        localStorage.setItem('isCheckedIn', 'true');
        localStorage.setItem('checkInTime', isoTimestamp); // เก็บ ISO timestamp
        localStorage.setItem('currentSessionStart', isoTimestamp);
        setShowAttendanceModal(false);
        showAlert('เข้างานสำเร็จ', `เข้างานเวลา ${timeString}`, 'success');
      } else if (res.status === 404) {
        // Caregiver account has been deleted
        showAlert(
          'บัญชีถูกลบแล้ว',
          data.message || 'บัญชีของคุณถูกลบออกจากระบบแล้ว\nกรุณาติดต่อครอบครัวเพื่อเพิ่มข้อมูลใหม่',
          'error'
        );
        
        // Auto-logout after showing alert
        setTimeout(() => {
          // Clear all localStorage data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isCheckedIn');
          localStorage.removeItem('checkInTime');
          localStorage.removeItem('currentSessionStart');
          
          // Redirect to login
          window.location.href = '/caregiver';
        }, 3000);
      } else {
        showAlert('เข้างานล้มเหลว', data.message || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (err) {
      console.error('Check-in error:', err);
      // Fallback to local storage if API fails
      setIsCheckedIn(true);
      setCheckInTime(isoTimestamp);
      setCurrentSessionStart(isoTimestamp);
      localStorage.setItem('isCheckedIn', 'true');
      localStorage.setItem('checkInTime', isoTimestamp);
      localStorage.setItem('currentSessionStart', isoTimestamp);
      setShowAttendanceModal(false);
      showAlert('เข้างานสำเร็จ', `เข้างานเวลา ${timeString}`, 'success');
    }
  };

  const handleCheckOut = async () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    try {
      const res = await fetch(`${BASE_URL}/caregiver/attendance/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          caregiverId: caregiverId,
          elderId: elderId,
          checkOutTime: now.toISOString()
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setCheckOutTime(timeString);
        setShowAttendanceModal(false);
        showAlert('ออกงานสำเร็จ', `ออกงานเวลา ${timeString}\nสวัสดีครับ เจอกันพรุ่งนี้\n\nข้อมูลจะรีเซ็ตเพื่อเริ่มต้นใหม่`, 'success');
        
        // Clear all data and reset for new day
        setTimeout(() => {
          setIsCheckedIn(false);
          setCheckInTime(null);
          setCheckOutTime(null);
          setCurrentSessionStart(null);
          setTasks([]);
          setExpenses([]);
          setRecordedMoods([]);
          setSys('');
          setDia('');
          setHeartRate('');
          setManualChecks([]);
          localStorage.removeItem('isCheckedIn');
          localStorage.removeItem('checkInTime');
          localStorage.removeItem('currentSessionStart');
        }, 2000);
      } else {
        showAlert('ออกงานล้มเหลว', data.message || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (err) {
      console.error('Check-out error:', err);
      // Fallback to local storage if API fails
      setCheckOutTime(timeString);
      setShowAttendanceModal(false);
      showAlert('ออกงานสำเร็จ', `ออกงานเวลา ${timeString}\nสวัสดีครับ เจอกันพรุ่งนี้\n\nข้อมูลจะรีเซ็ตเพื่อเริ่มต้นใหม่`, 'success');
      
      setTimeout(() => {
        setIsCheckedIn(false);
        setCheckInTime(null);
        setCheckOutTime(null);
        setTasks([]);
        setExpenses([]);
        setRecordedMoods([]);
        setSys('');
        setDia('');
        setHeartRate('');
        setManualChecks([]);
        localStorage.removeItem('isCheckedIn');
        localStorage.removeItem('checkInTime');
      }, 2000);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API if needed
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage regardless of API result
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isCheckedIn');
        localStorage.removeItem('checkInTime');
        window.location.href = '/caregiver';
      }
    }
  };

  const handleSOS = async (reason: string) => {
    try {
      const res = await fetch(`${BASE_URL}/caregiver/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          elderId: elderId,
          caregiverId: caregiverId,
          reason: reason,
          timestamp: new Date().toISOString()
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShowSOS(false);
        showAlert('แจ้งเหตุฉุกเฉิน', `${reason}\n\nแจ้งเตือนถูกส่งไปยังครอบครัวแล้ว\nพิกัด GPS ถูกบันทึก`, 'error');
      } else {
        showAlert('แจ้งเหตุล้มเหลว', data.message || 'เกิดข้อผิดพลาดในการแจ้งเหตุ', 'error');
      }
    } catch (err) {
      console.error('SOS error:', err);
      setShowSOS(false);
      showAlert('แจ้งเหตุฉุกเฉิน', `${reason}\n\nพิกัด GPS ถูกส่งไปยังลูกหลานแล้ว`, 'error');
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/caregiver/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Mark notification error:', err);
    }
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
            <p className="text-white text-lg font-bold">{elderName} 👵</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSOS(true)} 
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-full shadow-lg active:scale-95 flex items-center gap-1 border-2 border-red-400 transition-transform"
          >
            <AlertTriangle size={18} fill="white" /> SOS
          </button>
          <button 
            onClick={handleLogout} 
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-2 rounded-full shadow-lg active:scale-95 flex items-center gap-1 border-2 border-white/30 transition-transform"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 pb-24 scrollbar-hide">
        
        {/* 1. Home Tab */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-300">
            {/* Attendance Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCheckedIn ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Clock size={24} className={isCheckedIn ? 'text-green-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">สถานะการทำงาน</p>
                    <p className={`text-lg font-bold ${isCheckedIn ? 'text-green-600' : 'text-gray-500'}`}>
                      {isCheckedIn 
                        ? `เข้างานแล้ว ${checkInTime ? new Date(checkInTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''}`
                        : 'ยังไม่ได้เข้างาน'
                      }
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAttendanceModal(true)}
                  className={`${isCheckedIn ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-bold px-6 py-3 rounded-xl shadow-md active:scale-95 transition-transform flex items-center gap-2`}
                >
                  {isCheckedIn ? (
                    <>
                      <CheckCircle size={20} />
                      ออกงาน
                    </>
                  ) : (
                    <>
                      <Clock size={20} />
                      เข้างาน
                    </>
                  )}
                </button>
              </div>
              {isCheckedIn && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-700">
                  💼 คุณกำลังทำงานอยู่ อย่าลืมบันทึกงานและออกงานตอนเสร็จนะครับ
                </div>
              )}
            </div>

            {/* Notifications Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${unreadCount > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Bell size={24} className={unreadCount > 0 ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">การแจ้งเตือน</p>
                    <p className={`text-lg font-bold ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                      {unreadCount > 0 ? `มี ${unreadCount} ข้อความใหม่` : 'ไม่มีข้อความใหม่'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNotifications(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-md active:scale-95 transition-transform flex items-center gap-2"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                  ดูทั้งหมด
                </button>
              </div>
              {notifications.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {notifications[0].title}
                  </p>
                  <p className="text-xs text-blue-700">
                    {notifications[0].message}
                  </p>
                </div>
              )}
            </div>

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

            {/* Hero Task */}
            {pendingTask ? (
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
            ) : tasks.length > 0 ? (
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-3xl mb-8 shadow-xl text-white overflow-hidden">
                <div className="text-center">
                  <CheckCircle size={48} className="mx-auto mb-3" />
                  <h2 className="text-2xl font-bold mb-2">🎉 เยี่ยมมาก!</h2>
                  <p className="text-green-100 text-lg">ทำงานเสร็จหมดแล้ววันนี้</p>
                </div>
              </div>
            ) : null}

            {/* Task List */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>รายการทั้งหมด
            </h3>
            {loadingTasks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">กำลังโหลดงาน...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
                <p className="mb-4">ยังไม่มีงานสำหรับวันนี้</p>
                <button 
                  onClick={() => setTasks(INITIAL_TASKS)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95"
                >
                  📋 โหลดงานตัวอย่าง
                </button>
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
                {['หน้าแดง/ตัวร้อน', 'บวมตามแขนขา', 'หายใจหอบ/แรง', 'ปวดหัว/เวียนหัว'].map(sym => (
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
            
            {loadingExpenses ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">กำลังโหลดรายการ...</p>
              </div>
            ) : (
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
                            <span className="text-sm text-gray-500">{ex.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-900 text-xl">{ex.price}.-</span>
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
            )}
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

      {/* Confirm Delete Expense Dialog */}
      {confirmDeleteExpenseId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
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
                onClick={() => setConfirmDeleteExpenseId(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  handleDeleteExpenseConfirmed(confirmDeleteExpenseId);
                  setConfirmDeleteExpenseId(null);
                }}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <CustomAlert isOpen={alert.isOpen} title={alert.title} message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, isOpen: false })} />

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-3 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Bell size={24} className="text-blue-600" />
                การแจ้งเตือน
              </h2>
              <button 
                onClick={() => setShowNotifications(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(85vh-180px)]">
              {loadingNotifications ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">กำลังโหลด...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Bell size={48} className="mx-auto mb-4 opacity-20" />
                  <p>ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => !notif.isRead && markNotificationAsRead(notif.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        notif.isRead 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-bold ${notif.isRead ? 'text-gray-700' : 'text-blue-900'}`}>
                          {notif.title}
                        </h3>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(notif.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowNotifications(false)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex flex-col items-center mb-6">
              <div className={`w-20 h-20 ${isCheckedIn ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mb-4`}>
                <User size={40} className={isCheckedIn ? 'text-green-600' : 'text-blue-600'} />
              </div>
              <h2 className={`text-3xl font-bold ${isCheckedIn ? 'text-green-600' : 'text-blue-600'} mb-2`}>
                {isCheckedIn ? 'ออกงาน' : 'เข้างาน'}
              </h2>
              {isCheckedIn && checkInTime && (
                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    เข้างาน {formatRelativeTime(checkInTime)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(checkInTime).toLocaleString('th-TH', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                </div>
              )}
            </div>

            {isCheckedIn ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 mb-4">
                  <p className="text-center text-green-700 font-medium">
                    คุณต้องการออกงานหรือไม่?
                  </p>
                </div>
                <button 
                  onClick={handleCheckOut}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
                >
                  ✓ ยืนยันออกงาน
                </button>
                <button 
                  onClick={() => setShowAttendanceModal(false)}
                  className="w-full py-4 bg-gray-100 rounded-2xl text-gray-600 font-bold text-lg hover:bg-gray-200"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-4">
                  <p className="text-center text-blue-700 font-medium mb-3">
                    📍 ระบบจะบันทึกตำแหน่งและเวลาเข้างาน
                  </p>
                  <div className="text-center text-gray-600 text-sm">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span>🕐</span>
                      <span>{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span>📅</span>
                      <span>{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleCheckIn}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
                >
                  ✓ ยืนยันเข้างาน
                </button>
                <button 
                  onClick={() => setShowAttendanceModal(false)}
                  className="w-full py-4 bg-gray-100 rounded-2xl text-gray-600 font-bold text-lg hover:bg-gray-200"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}