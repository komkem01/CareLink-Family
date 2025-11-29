"use client";

import React, { useState, useEffect } from "react";
import { 
  Pill, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Package,
  Calendar,
  Bell,
  X
} from "lucide-react";
import CustomAlert from "../CustomAlert";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string[];
  times: string[];
  instructions: string | null;
  sideEffects: string | null;
  startDate: string;
  endDate: string | null;
  prescribedBy: string | null;
  isActive: boolean;
  reminderEnabled: boolean;
  reminderBefore: number;
  currentStock: number | null;
  minStock: number | null;
  unit: string | null;
  intakes?: MedicationIntake[];
}

interface MedicationIntake {
  id: string;
  scheduledTime: string;
  actualTime: string | null;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  takenBy: string | null;
  notes: string | null;
  photoUrl: string | null;
}

interface MedicationsTabProps {
  elderId: string;
  elderName: string;
}

const MedicationsTab: React.FC<MedicationsTabProps> = ({ elderId, elderName }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "daily",
    times: ["08:00"],
    instructions: "",
    sideEffects: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    prescribedBy: "",
    reminderEnabled: true,
    reminderBefore: 30,
    currentStock: 30,
    minStock: 10,
    unit: "เม็ด"
  });

  useEffect(() => {
    fetchMedications();
    fetchTodaySchedule();
    fetchCompliance();
  }, [elderId]);

  const fetchMedications = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`http://localhost:3001/api/family/medications?elderId=${elderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMedications(data);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`http://localhost:3001/api/family/medications/schedule/today?elderId=${elderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodaySchedule(data);
      }
    } catch (error) {
      console.error('Error fetching today schedule:', error);
    }
  };

  const fetchCompliance = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`http://localhost:3001/api/family/health-risk/${elderId}/compliance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompliance(data.compliance || 0);
      }
    } catch (error) {
      console.error('Error fetching compliance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const url = editingMed 
        ? `http://localhost:3001/api/family/medications/${editingMed.id}`
        : `http://localhost:3001/api/family/medications`;
      
      const response = await fetch(url, {
        method: editingMed ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          elderId,
          timing: formData.times
        })
      });

      if (response.ok) {
        setAlert({ type: "success", message: editingMed ? "บันทึกการแก้ไขเรียบร้อย" : "เพิ่มยาเรียบร้อย" });
        setShowForm(false);
        setEditingMed(null);
        resetForm();
        fetchMedications();
        fetchTodaySchedule();
      } else {
        throw new Error('Failed to save medication');
      }
    } catch (error) {
      setAlert({ type: "error", message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    }
  };

  const handleDelete = async (medId: string) => {
    if (!confirm('ต้องการลบยานี้ใช่หรือไม่?')) return;

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`http://localhost:3001/api/family/medications/${medId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setAlert({ type: "success", message: "ลบยาเรียบร้อย" });
        fetchMedications();
      }
    } catch (error) {
      setAlert({ type: "error", message: "ไม่สามารถลบยาได้" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      frequency: "daily",
      times: ["08:00"],
      instructions: "",
      sideEffects: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      prescribedBy: "",
      reminderEnabled: true,
      reminderBefore: 30,
      currentStock: 30,
      minStock: 10,
      unit: "เม็ด"
    });
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      times: [...prev.times, "12:00"]
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? value : t)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {alert && (
        <CustomAlert
          isOpen={true}
          type={alert.type}
          title={alert.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Pill className="mr-3 text-purple-600" size={32} />
            การจัดการยา - {elderName}
          </h2>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingMed(null);
              resetForm();
            }}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            เพิ่มยา
          </button>
        </div>

        {/* Compliance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">อัตราการทานยาตรงเวลา</p>
                <p className="text-3xl font-bold text-green-800">{compliance}%</p>
              </div>
              <CheckCircle2 className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">ยาทั้งหมด</p>
                <p className="text-3xl font-bold text-blue-800">{medications.filter(m => m.isActive).length}</p>
              </div>
              <Pill className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">วันนี้ต้องทาน</p>
                <p className="text-3xl font-bold text-orange-800">{todaySchedule.length}</p>
              </div>
              <Clock className="text-orange-600" size={40} />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      {todaySchedule.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2 text-purple-600" size={24} />
            ตารางยาวันนี้
          </h3>
          <div className="space-y-2">
            {todaySchedule.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Clock className="mr-3 text-gray-500" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">{item.medication.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.medication.dosage} • {new Date(item.scheduledTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div>
                  {item.status === 'taken' && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      ✓ ทานแล้ว
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                      รอทาน
                    </span>
                  )}
                  {item.status === 'missed' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      พลาด
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">รายการยาทั้งหมด</h3>
        
        {medications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Pill size={48} className="mx-auto mb-4 opacity-30" />
            <p>ยังไม่มีข้อมูลยา</p>
            <p className="text-sm">เริ่มต้นด้วยการเพิ่มยาใหม่</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => (
              <div
                key={med.id}
                className={`p-4 rounded-lg border-2 ${
                  med.isActive 
                    ? 'border-purple-200 bg-purple-50' 
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-lg">{med.name}</h4>
                    <p className="text-sm text-gray-600">{med.dosage}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingMed(med);
                        setFormData({
                          name: med.name,
                          dosage: med.dosage,
                          frequency: med.frequency,
                          times: med.times,
                          instructions: med.instructions || "",
                          sideEffects: med.sideEffects || "",
                          startDate: med.startDate.split('T')[0],
                          endDate: med.endDate ? med.endDate.split('T')[0] : "",
                          prescribedBy: med.prescribedBy || "",
                          reminderEnabled: med.reminderEnabled,
                          reminderBefore: med.reminderBefore,
                          currentStock: med.currentStock || 30,
                          minStock: med.minStock || 10,
                          unit: med.unit || "เม็ด"
                        });
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(med.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-700">
                    <Clock className="mr-2" size={16} />
                    {med.times.join(', ')} น.
                  </div>
                  
                  {med.reminderEnabled && (
                    <div className="flex items-center text-purple-600">
                      <Bell className="mr-2" size={16} />
                      แจ้งเตือนก่อน {med.reminderBefore} นาที
                    </div>
                  )}

                  {med.currentStock !== null && (
                    <div className={`flex items-center ${
                      med.currentStock <= (med.minStock || 0) ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      <Package className="mr-2" size={16} />
                      คงเหลือ: {med.currentStock} {med.unit}
                      {med.currentStock <= (med.minStock || 0) && (
                        <AlertCircle className="ml-2" size={16} />
                      )}
                    </div>
                  )}

                  {med.prescribedBy && (
                    <div className="text-gray-600">
                      แพทย์: {med.prescribedBy}
                    </div>
                  )}
                </div>

                {!med.isActive && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <span className="text-xs text-gray-500">ยาที่หยุดใช้แล้ว</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingMed ? 'แก้ไขข้อมูลยา' : 'เพิ่มยาใหม่'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingMed(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อยา *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ขนาดยา *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 500mg, 1 เม็ด"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Timing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาทานยา *
                </label>
                <div className="space-y-2">
                  {formData.times.map((time, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateTimeSlot(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {formData.times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    <Plus size={16} className="mr-1" />
                    เพิ่มเวลา
                  </button>
                </div>
              </div>

              {/* Stock Management */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนคงเหลือ
                  </label>
                  <input
                    type="number"
                    value={formData.currentStock || ''}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    แจ้งเตือนเมื่อเหลือ
                  </label>
                  <input
                    type="number"
                    value={formData.minStock || ''}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หน่วย
                  </label>
                  <input
                    type="text"
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="เม็ด, แคปซูล, มล."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={formData.reminderEnabled}
                    onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-700">
                    เปิดการแจ้งเตือน
                  </label>
                </div>

                {formData.reminderEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      แจ้งเตือนก่อน (นาที)
                    </label>
                    <input
                      type="number"
                      value={formData.reminderBefore}
                      onChange={(e) => setFormData({ ...formData, reminderBefore: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Optional Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำแนะนำการใช้ยา
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ผลข้างเคียง
                </label>
                <textarea
                  value={formData.sideEffects}
                  onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    แพทย์ผู้สั่งจ่าย
                  </label>
                  <input
                    type="text"
                    value={formData.prescribedBy}
                    onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่เริ่มทาน *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMed(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingMed ? 'บันทึกการแก้ไข' : 'เพิ่มยา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationsTab;
