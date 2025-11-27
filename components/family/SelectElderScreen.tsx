"use client";
import { useState } from "react";
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
  const [elders, setElders] = useState<Elder[]>([
    { id: "1", name: "คุณยายสมศรี", age: 78, relation: "ยาย", profileColor: "bg-pink-500" },
    { id: "2", name: "คุณตาสมชาย", age: 82, relation: "ตา", profileColor: "bg-blue-500" },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newRelation, setNewRelation] = useState("");
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

    const newElder: Elder = {
      id: Date.now().toString(),
      name: newName,
      age: parseInt(newAge),
      relation: newRelation,
      profileColor: colors[Math.floor(Math.random() * colors.length)],
    };

    setElders([...elders, newElder]);
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
  };

  const handleDeleteElder = (id: string) => {
    setElders(elders.filter((e) => e.id !== id));
    setAlert({
      isOpen: true,
      title: "ลบแล้ว",
      message: "ลบข้อมูลเรียบร้อย",
      type: "info",
    });
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
                    setAlert({
                      isOpen: true,
                      title: "แก้ไข",
                      message: "ฟีเจอร์แก้ไขกำลังพัฒนา",
                      type: "info",
                    });
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
    </div>
  );
}
