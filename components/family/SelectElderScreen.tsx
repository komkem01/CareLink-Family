"use client";
import React, { useState } from "react";
import Cookies from "js-cookie";
import { Plus, Users, ChevronRight, Edit, Trash2, UserPlus } from "lucide-react";
import CustomAlert from "../CustomAlert";

interface Elder {
  id: string;
  name: string;
  age: number;
  relation: string;
  profileColor: string;
}

interface Props {
  onSelectElder: (elder: Elder) => void;
}

export default function SelectElderScreen({ onSelectElder }: Props) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";
  const token = typeof window !== "undefined" ? Cookies.get("token") || "" : "";
  const [elders, setElders] = useState<Elder[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // Fetch elders from API on mount & when page/pageSize changes
  const fetchElders = React.useCallback(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/family/elders?page=${page}&pageSize=${pageSize}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
        const data = await res.json();
        // data: { elders, total, page, pageSize, totalPages }
        if (res.ok && Array.isArray(data.elders)) {
          setElders(data.elders);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          setAlert({
            isOpen: true,
            title: "โหลดข้อมูลล้มเหลว",
            message: data.message || "ไม่สามารถโหลดรายชื่อผู้สูงอายุได้",
            type: "error",
          });
        }
      } catch (err) {
        setAlert({
          isOpen: true,
          title: "ข้อผิดพลาด",
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
          type: "error",
        });
      }
    })();
  }, [BASE_URL, token, page, pageSize]);

  React.useEffect(() => {
    fetchElders();
  }, [fetchElders]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newRelation, setNewRelation] = useState("");
  // Edit Elder
  const [editElderId, setEditElderId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editRelation, setEditRelation] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

  const colors = ["bg-pink-500", "bg-purple-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500"];

  // Edit Elder Handler
  const handleEditElder = (elder: Elder) => {
    setEditElderId(elder.id);
    setEditName(elder.name);
    setEditAge(elder.age.toString());
    setEditRelation(elder.relation);
  };

  const handleUpdateElder = () => {
    if (!editName || !editAge || !editRelation) {
      setAlert({
        isOpen: true,
        title: "ข้อมูลไม่ครบถ้วน",
        message: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        type: "error",
      });
      return;
    }
    // Prevent duplicate elder name (exclude current)
    if (elders.some(e => e.name.trim() === editName.trim() && e.id !== editElderId)) {
      setAlert({
        isOpen: true,
        title: "ชื่อซ้ำ",
        message: "มีผู้สูงอายุชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น",
        type: "error",
      });
      return;
    }
    // Call API to update elder
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/family/elders/${editElderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editName,
            age: parseInt(editAge),
            relation: editRelation,
          }),
        });
        const data = await res.json();
        if (res.ok && data.id) {
          setEditElderId(null);
          setEditName("");
          setEditAge("");
          setEditRelation("");
          setAlert({
            isOpen: true,
            title: "แก้ไขสำเร็จ",
            message: `แก้ไขข้อมูล ${editName} เรียบร้อยแล้ว`,
            type: "success",
          });
          fetchElders();
        } else {
          setAlert({
            isOpen: true,
            title: "แก้ไขล้มเหลว",
            message: data.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล",
            type: "error",
          });
        }
      } catch (err) {
        setAlert({
          isOpen: true,
          title: "ข้อผิดพลาด",
          message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล",
          type: "error",
        });
      }
    })();
  };

  const handleAddElder = () => {
    if (!newName || !newAge || !newRelation) {
      setAlert({
        isOpen: true,
        title: "ข้อมูลไม่ครบถ้วน",
        message: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        type: "error",
      });
      return;
    }
    // Prevent duplicate elder name
    if (elders.some(e => e.name.trim() === newName.trim())) {
      setAlert({
        isOpen: true,
        title: "ชื่อซ้ำ",
        message: "มีผู้สูงอายุชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น",
        type: "error",
      });
      return;
    }
    // Call API to add elder
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/family/elders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newName,
            age: parseInt(newAge),
            relation: newRelation,
            // profileColor: colors[Math.floor(Math.random() * colors.length)], // let backend handle
          }),
        });
        const data = await res.json();
        if (res.ok && data.id) {
          setNewName("");
          setNewAge("");
          setNewRelation("");
          setShowAddForm(false);
          setAlert({
            isOpen: true,
            title: "เพิ่มสำเร็จ",
            message: `เพิ่ม ${newName} เรียบร้อยแล้ว`,
            type: "success",
          });
          // รีโหลด elders หน้าเดิม
          fetchElders();
        } else {
          setAlert({
            isOpen: true,
            title: "เพิ่มล้มเหลว",
            message: data.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล",
            type: "error",
          });
        }
      } catch (err) {
        setAlert({
          isOpen: true,
          title: "ข้อผิดพลาด",
          message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล",
          type: "error",
        });
      }
    })();
  };

  const handleDeleteElder = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteElderConfirmed = (id: string) => {
    // Call API to delete elder
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/family/elders/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setAlert({
            isOpen: true,
            title: "ลบแล้ว",
            message: "ลบข้อมูลเรียบร้อย",
            type: "info",
          });
          // รีโหลด elders หน้าเดิม
          fetchElders();
        } else {
          setAlert({
            isOpen: true,
            title: "ลบล้มเหลว",
            message: data.message || "เกิดข้อผิดพลาดในการลบข้อมูล",
            type: "error",
          });
        }
      } catch (err) {
        setAlert({
          isOpen: true,
          title: "ข้อผิดพลาด",
          message: "เกิดข้อผิดพลาดในการลบข้อมูล",
          type: "error",
        });
      }
      setConfirmDeleteId(null);
    })();
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8 rounded-b-3xl shadow-lg shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
            <Users size={28} className="text-white" />
          </div>
          <div>
            <p className="text-purple-100 text-xs">ยินดีต้อนรับ</p>
            <p className="text-white text-2xl font-bold">เลือกผู้สูงอายุ</p>
          </div>
        </div>
        <p className="text-purple-100 text-sm mt-2">เลือกคนที่ต้องการดูแลหรือเพิ่มคนใหม่</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {/* Elder List */}
        <div className="space-y-4 mb-6">
          {elders.map((elder) => (
            <div
              key={elder.id}
              onClick={() => onSelectElder(elder)}
              className="bg-white rounded-3xl p-5 shadow-md border border-gray-100 hover:shadow-xl transition-all cursor-pointer active:scale-[0.98] flex items-center gap-4"
            >
              <div className={`w-16 h-16 ${elder.profileColor} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0`}>
                {elder.name.charAt(elder.name.indexOf("คุ") + 2)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{elder.name}</h3>
                <p className="text-gray-500 text-sm">
                  {elder.relation} • อายุ {elder.age} ปี
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditElder(elder);
                  }}
                  className="p-2 bg-blue-50 rounded-xl hover:bg-blue-100 text-blue-600 transition-colors"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteElder(elder.id);
                  }}
                  className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Edit Elder Form */}
        {editElderId && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-200 animate-in fade-in slide-in-from-bottom duration-300 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit size={24} className="text-blue-600" />
                แก้ไขข้อมูลผู้สูงอายุ
              </h3>
              <button
                onClick={() => setEditElderId(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 font-bold text-sm mb-2 block">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  placeholder="เช่น คุณยายสมศรี"
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-gray-700 font-bold text-sm mb-2 block">อายุ</label>
                <input
                  type="number"
                  placeholder="เช่น 78"
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                />
              </div>
              <div>
                <label className="text-gray-700 font-bold text-sm mb-2 block">ความสัมพันธ์</label>
                <select
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  value={editRelation}
                  onChange={(e) => setEditRelation(e.target.value)}
                >
                  <option value="">เลือกความสัมพันธ์</option>
                  <option value="ยาย">ยาย</option>
                  <option value="ตา">ตา</option>
                  <option value="ปู่">ปู่</option>
                  <option value="ย่า">ย่า</option>
                  <option value="แม่">แม่</option>
                  <option value="พ่อ">พ่อ</option>
                  <option value="ลุง">ลุง</option>
                  <option value="ป้า">ป้า</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditElderId(null)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
                >ยกเลิก</button>
                <button
                  onClick={handleUpdateElder}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all active:scale-95"
                >บันทึก</button>
              </div>
            </div>
          </div>
        )}
        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <button
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >ก่อนหน้า</button>
          <span className="text-gray-700 font-bold">หน้า {page} / {totalPages}</span>
          <button
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >ถัดไป</button>
        </div>

        {/* Add Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-bold py-5 rounded-3xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={24} /> เพิ่มผู้สูงอายุใหม่
          </button>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-purple-200 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={24} className="text-purple-600" />
                เพิ่มผู้สูงอายุ
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 font-bold text-sm mb-2 block">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  placeholder="เช่น คุณยายสมศรี"
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-gray-700 font-bold text-sm mb-2 block">
                  อายุ
                </label>
                <input
                  type="number"
                  placeholder="เช่น 78"
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                />
              </div>
              <div>
                <label className="text-gray-700 font-bold text-sm mb-2 block">
                  ความสัมพันธ์
                </label>
                <select
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                >
                  <option value="">เลือกความสัมพันธ์</option>
                  <option value="ยาย">ยาย</option>
                  <option value="ตา">ตา</option>
                  <option value="ปู่">ปู่</option>
                  <option value="ย่า">ย่า</option>
                  <option value="แม่">แม่</option>
                  <option value="พ่อ">พ่อ</option>
                  <option value="ลุง">ลุง</option>
                  <option value="ป้า">ป้า</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddElder}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all active:scale-95"
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CustomAlert
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />

      {/* Confirm Delete Elder Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              ยืนยันการลบผู้สูงอายุ
            </h3>
            <p className="mb-6 text-gray-600">
              คุณต้องการลบข้อมูลผู้สูงอายุนี้จริงหรือไม่? การลบจะไม่สามารถย้อนกลับได้
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
                onClick={() => handleDeleteElderConfirmed(confirmDeleteId)}
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
