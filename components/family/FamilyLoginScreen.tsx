"use client";
import { useState } from "react";
import { Heart, Mail, Key, LogIn, UserPlus } from "lucide-react";
import CustomAlert from "../CustomAlert";

interface Props {
  onLoginSuccess: () => void;
}

export default function FamilyLoginScreen({ onLoginSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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

  const handleSubmit = () => {
    if (isLogin) {
      // เข้าสู่ระบบ
      if (email && password) {
        setAlert({
          isOpen: true,
          title: "เข้าสู่ระบบสำเร็จ",
          message: "ยินดีต้อนรับกลับมา",
          type: "success",
        });
        setTimeout(() => onLoginSuccess(), 1000);
      } else {
        setAlert({
          isOpen: true,
          title: "ข้อมูลไม่ครบถ้วน",
          message: "กรุณากรอกอีเมลและรหัสผ่าน",
          type: "error",
        });
      }
    } else {
      // ลงทะเบียน
      if (email && password && name && phone) {
        setAlert({
          isOpen: true,
          title: "ลงทะเบียนสำเร็จ",
          message: "สร้างบัญชีเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ",
          type: "success",
        });
        setTimeout(() => {
          setIsLogin(true);
          setName("");
          setPhone("");
        }, 1500);
      } else {
        setAlert({
          isOpen: true,
          title: "ข้อมูลไม่ครบถ้วน",
          message: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
          type: "error",
        });
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 relative bg-white overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-0 left-0 w-full h-60 bg-gradient-to-br from-purple-600 to-blue-600 rounded-b-[3rem]"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500 rounded-full opacity-50 blur-xl"></div>

      <div className="relative z-10 bg-white p-6 rounded-3xl shadow-xl mb-8 flex items-center justify-center w-24 h-24 mt-16">
        <Heart size={48} className="text-purple-600 fill-current" />
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-2 relative z-10">
        CareLink Family
      </h1>
      <p className="text-gray-500 mb-8 relative z-10">
        {isLogin ? "แอพสำหรับลูกหลาน" : "ลงทะเบียนบัญชีใหม่"}
      </p>

      {/* Toggle Login/Register */}
      <div className="relative z-10 bg-gray-100 p-1 rounded-2xl flex w-full mb-6">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            isLogin
              ? "bg-white text-purple-600 shadow-md"
              : "text-gray-500"
          }`}
        >
          เข้าสู่ระบบ
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            !isLogin
              ? "bg-white text-purple-600 shadow-md"
              : "text-gray-500"
          }`}
        >
          ลงทะเบียน
        </button>
      </div>

      <div className="w-full space-y-4 mb-8 relative z-10">
        {!isLogin && (
          <>
            <div className="relative">
              <UserPlus className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm text-gray-800"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="tel"
                placeholder="เบอร์โทรศัพท์"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm text-gray-800"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </>
        )}
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="email"
            placeholder="อีเมล"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm text-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="relative">
          <Key className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm text-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 mb-6 relative z-10"
      >
        {isLogin ? (
          <>
            <LogIn size={24} /> เข้าสู่ระบบ
          </>
        ) : (
          <>
            <UserPlus size={24} /> ลงทะเบียน
          </>
        )}
      </button>

      {isLogin && (
        <div className="relative z-10 text-center">
          <p className="text-gray-500 text-sm">ลืมรหัสผ่าน?</p>
          <button className="text-purple-600 font-bold text-sm hover:underline">
            คลิกที่นี่เพื่อรีเซ็ต
          </button>
        </div>
      )}

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
