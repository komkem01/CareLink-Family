'use client';
import { useState, useEffect } from 'react';
import { Pill, Clock, CheckCircle, XCircle, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import CustomAlert from '../CustomAlert';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

interface MedicationSchedule {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  status: 'pending' | 'taken' | 'skipped' | 'late';
  takenAt?: string;
  notes?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  currentStock: number;
  minStock: number;
  unit: string;
  purpose?: string;
}

type AlertType = "info" | "error" | "success";

export default function MedicationsTab() {
  const token = Cookies.get('token');
  const elderId = Cookies.get('elderId');
  const userId = Cookies.get('userId');

  const [todaySchedule, setTodaySchedule] = useState<MedicationSchedule[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [compliance, setCompliance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicationSchedule | null>(null);
  const [note, setNote] = useState('');
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

  const showAlert = (title: string, message: string, type: AlertType = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const fetchTodaySchedule = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${BASE_URL}/family/medications/schedule/today?elderId=${elderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTodaySchedule(data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/family/medications?elderId=${elderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMedications(data);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const fetchCompliance = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/family/health-risk/${elderId}/compliance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCompliance(data.complianceRate || 0);
      }
    } catch (error) {
      console.error('Error fetching compliance:', error);
    }
  };

  useEffect(() => {
    if (elderId && token) {
      fetchTodaySchedule();
      fetchMedications();
      fetchCompliance();
    }
  }, [elderId, token]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!elderId || !token) return;

    const interval = setInterval(() => {
      fetchTodaySchedule();
      fetchCompliance();
    }, 30000);

    return () => clearInterval(interval);
  }, [elderId, token]);

  const handleRecordIntake = async (status: 'taken' | 'skipped') => {
    if (!selectedMed) return;

    try {
      const response = await fetch(
        `${BASE_URL}/caregiver/medications/intake`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            medicationId: selectedMed.medicationId,
            elderId,
            caregiverId: userId,
            scheduledTime: selectedMed.scheduledTime,
            status,
            notes: note || undefined,
          }),
        }
      );

      if (response.ok) {
        const statusText = status === 'taken' ? 'ทานยาแล้ว' : 'ข้ามรอบนี้';
        const statusType = status === 'taken' ? 'success' : 'info';
        showAlert(
          'บันทึกสำเร็จ',
          `บันทึก ${selectedMed.medicationName} - ${statusText}`,
          statusType
        );
        setSelectedMed(null);
        setNote('');
        fetchTodaySchedule();
        fetchCompliance();
      } else {
        const data = await response.json();
        showAlert('เกิดข้อผิดพลาด', data.message || 'ไม่สามารถบันทึกได้', 'error');
      }
    } catch (error) {
      console.error('Error recording intake:', error);
      showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const getStatusBadge = (schedule: MedicationSchedule) => {
    switch (schedule.status) {
      case 'taken':
        return (
          <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle size={14} />
            ทานแล้ว
          </div>
        );
      case 'skipped':
        return (
          <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
            <XCircle size={14} />
            ข้าม
          </div>
        );
      case 'late':
        return (
          <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
            <AlertCircle size={14} />
            ทานสาย
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
            <Clock size={14} />
            รอทาน
          </div>
        );
    }
  };

  const getNextMedication = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return todaySchedule
      .filter(s => s.status === 'pending')
      .sort((a, b) => {
        const timeA = parseInt(a.scheduledTime.split(':')[0]) * 60 + parseInt(a.scheduledTime.split(':')[1]);
        const timeB = parseInt(b.scheduledTime.split(':')[0]) * 60 + parseInt(b.scheduledTime.split(':')[1]);
        return timeA - timeB;
      })[0];
  };

  const nextMed = getNextMedication();
  const pendingCount = todaySchedule.filter(s => s.status === 'pending').length;
  const takenCount = todaySchedule.filter(s => s.status === 'taken').length;
  const totalCount = todaySchedule.length;

  const lowStockMeds = medications.filter(m => m.currentStock <= m.minStock);

  return (
    <div className="animate-in fade-in duration-300 pb-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg">
          <div className="text-xs opacity-80 mb-1">วันนี้</div>
          <div className="text-2xl font-bold">{totalCount}</div>
          <div className="text-xs opacity-90">รอบ</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl text-white shadow-lg">
          <div className="text-xs opacity-80 mb-1">ทานแล้ว</div>
          <div className="text-2xl font-bold">{takenCount}</div>
          <div className="text-xs opacity-90">/{totalCount}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
          <div className="text-xs opacity-80 mb-1 flex items-center gap-1">
            <TrendingUp size={12} />
            อัตราการทาน
          </div>
          <div className="text-2xl font-bold">{compliance.toFixed(0)}%</div>
          <div className="text-xs opacity-90">7 วัน</div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockMeds.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl mb-6">
          <div className="flex items-center gap-2 text-orange-800 font-bold mb-2">
            <AlertCircle size={20} />
            ยาเหลือน้อย ({lowStockMeds.length} รายการ)
          </div>
          <div className="space-y-1">
            {lowStockMeds.map(med => (
              <div key={med.id} className="text-sm text-orange-700">
                • {med.name} - เหลือ {med.currentStock} {med.unit}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Medication Card */}
      {nextMed && (
        <div
          onClick={() => setSelectedMed(nextMed)}
          className="bg-gradient-to-br from-indigo-600 to-blue-500 p-6 rounded-3xl mb-8 shadow-xl text-white cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
        >
          <div className="flex items-center mb-3">
            <div className="bg-white/20 p-2 rounded-full mr-2 backdrop-blur-md">
              <Pill size={20} className="text-yellow-300 animate-pulse" />
            </div>
            <span className="text-yellow-300 font-bold text-sm tracking-wider">ยารอบถัดไป</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{nextMed.scheduledTime} น.</h2>
          <h3 className="text-xl font-bold mb-1 opacity-90">{nextMed.medicationName}</h3>
          <p className="text-sm opacity-80 mb-4">{nextMed.dosage}</p>
          <button className="w-full bg-white text-blue-600 text-lg font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2">
            <CheckCircle size={20} />
            บันทึกการทานยา
          </button>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-blue-500" />
          ตารางยาวันนี้
        </h3>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            กำลังโหลด...
          </div>
        ) : todaySchedule.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-100">
            <Pill size={48} className="mx-auto mb-2 text-gray-300" />
            <p>ไม่มีรายการยาวันนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedule.map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => schedule.status === 'pending' && setSelectedMed(schedule)}
                className={`bg-white p-4 rounded-2xl shadow-sm border-l-4 transition-all ${
                  schedule.status === 'pending'
                    ? 'border-blue-500 cursor-pointer hover:shadow-md'
                    : schedule.status === 'taken'
                    ? 'border-green-500 opacity-70'
                    : schedule.status === 'late'
                    ? 'border-orange-500'
                    : 'border-gray-300 opacity-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-sm ${
                        schedule.status === 'pending'
                          ? 'bg-blue-50 text-blue-600'
                          : schedule.status === 'taken'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {schedule.scheduledTime}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-lg">{schedule.medicationName}</h4>
                      <p className="text-sm text-gray-600">{schedule.dosage}</p>
                      {schedule.takenAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          ทานเมื่อ: {new Date(schedule.takenAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                      {schedule.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">หมายเหตุ: {schedule.notes}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(schedule)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Medications List */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Pill size={20} className="text-blue-500" />
          รายการยาทั้งหมด ({medications.length})
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {medications.map((med) => (
            <div
              key={med.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-lg">{med.name}</h4>
                  <p className="text-sm text-gray-600">{med.dosage}</p>
                  {med.purpose && (
                    <p className="text-xs text-gray-500 mt-1">ใช้รักษา: {med.purpose}</p>
                  )}
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    med.currentStock <= med.minStock
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  เหลือ {med.currentStock} {med.unit}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {med.times.map((time, idx) => (
                  <div
                    key={idx}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Clock size={12} />
                    {time} น.
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Intake Modal */}
      {selectedMed && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Pill size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedMed.medicationName}</h2>
                <p className="text-sm text-gray-600">{selectedMed.scheduledTime} น. • {selectedMed.dosage}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                หมายเหตุ (ถ้ามี)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ทานช้า, มีอาการผิดปกติ"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRecordIntake('skipped')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <XCircle size={20} />
                ข้ามรอบนี้
              </button>
              <button
                onClick={() => handleRecordIntake('taken')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                ทานแล้ว
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedMed(null);
                setNote('');
              }}
              className="w-full mt-3 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Alert */}
      <CustomAlert
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />
    </div>
  );
}
