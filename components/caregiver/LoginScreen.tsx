"use client";
import { useState } from "react";
import { Heart, Phone, Key, LogIn } from "lucide-react";
import CustomAlert from "../CustomAlert";

interface Props {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  const handleLogin = () => {
    if (username && password) {
      onLoginSuccess();
    } else {
      setAlert({
        isOpen: true,
        title: "ข้อมูลไม่ครบถ้วน",
        message: "กรุณากรอกเบอร์โทรศัพท์และรหัสผ่านครับ",
        type: "error",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 relative bg-white overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-0 left-0 w-full h-60 bg-blue-600 rounded-b-[3rem]"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500 rounded-full opacity-50 blur-xl"></div>

      <div className="relative z-10 bg-white p-6 rounded-3xl shadow-xl mb-8 flex items-center justify-center w-24 h-24 mt-16">
        <Heart size={48} className="text-blue-600 fill-current" />
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-2 relative z-10">
        CareLink
      </h1>
      <p className="text-gray-500 mb-8 relative z-10">
        แอพสำหรับผู้ดูแลมืออาชีพ
      </p>

      <div className="w-full space-y-4 mb-8 relative z-10">
        <div className="relative">
          <Phone className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="tel"
            placeholder="เบอร์โทรศัพท์"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm text-gray-800"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="relative">
          <Key className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm text-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleLogin}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 mb-6 relative z-10"
      >
        <LogIn size={24} /> เข้าสู่ระบบ
      </button>

      <div className="relative z-10 text-center bg-blue-50 p-4 rounded-xl border border-blue-100 w-full">
        <p className="text-gray-500 text-sm">ไม่มีบัญชีเข้าใช้งาน?</p>
        <p className="text-blue-600 font-bold text-sm">
          กรุณาติดต่อลูกหลานเพื่อขอรหัสผ่าน
        </p>
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
