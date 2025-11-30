"use client";
import { useState } from "react";
import { Heart, Phone, Key, LogIn } from "lucide-react";
import CustomAlert from "../CustomAlert";

interface Props {
  onLoginSuccess: (pairingCode: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: Props) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const handleLogin = async () => {
    if (!username || !password) {
      setAlert({
        isOpen: true,
        title: "ข้อมูลไม่ครบถ้วน",
        message: "กรุณากรอกเบอร์โทรศัพท์และรหัสจับคู่ครับ",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Login ด้วยเบอร์โทร
      const loginRes = await fetch(`${BASE_URL}/auth/caregiver/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: username })
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.caregiver) {
        // เก็บ token และข้อมูล user
        localStorage.setItem('token', loginData.token || '');
        localStorage.setItem('user', JSON.stringify(loginData.caregiver));
        
        setAlert({
          isOpen: true,
          title: "เข้าสู่ระบบสำเร็จ",
          message: "กำลังไปหน้าเชื่อมต่อ...",
          type: "success",
        });
        
        setTimeout(() => {
          onLoginSuccess(password); // ส่งรหัสจับคู่ไปหน้า Pairing
        }, 1000);
      } else {
        setAlert({
          isOpen: true,
          title: "เบอร์โทรไม่ถูกต้อง",
          message: loginData.message || "ไม่พบเบอร์โทรศัพท์นี้ในระบบ",
          type: "error",
        });
      }
    } catch (error) {
      setAlert({
        isOpen: true,
        title: "ข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        type: "error",
      });
    } finally {
      setIsLoading(false);
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
            type="text"
            placeholder="รหัสจับคู่"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm text-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 mb-6 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            กำลังเข้าสู่ระบบ...
          </>
        ) : (
          <>
            <LogIn size={24} /> เข้าสู่ระบบ
          </>
        )}
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
