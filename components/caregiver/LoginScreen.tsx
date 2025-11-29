"use client";
import { useState } from "react";
import { Heart, Phone, Key, LogIn } from "lucide-react";
import CustomAlert from "../CustomAlert";
import Cookies from "js-cookie";

interface Props {
  onLoginSuccess: (pairingCode: string) => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [phone, setPhone] = useState("");
  const [pairingCode, setPairingCode] = useState("");
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
    // Validate input
    if (!phone || !pairingCode) {
      setAlert({
        isOpen: true,
        title: "ข้อมูลไม่ครบถ้วน",
        message: "กรุณากรอกเบอร์โทรศัพท์และรหัสจับคู่ให้ครบถ้วน",
        type: "error",
      });
      return;
    }

    // Validate phone format (basic)
    if (phone.length < 9 || phone.length > 10) {
      setAlert({
        isOpen: true,
        title: "เบอร์โทรศัพท์ไม่ถูกต้อง",
        message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (9-10 หลัก)",
        type: "error",
      });
      return;
    }

    // Validate pairing code format (6 characters)
    if (pairingCode.length !== 6) {
      setAlert({
        isOpen: true,
        title: "รหัสจับคู่ไม่ถูกต้อง",
        message: "รหัสจับคู่ต้องมี 6 ตัวอักษร",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/caregiver/login-pairing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.trim(),
          pairingCode: pairingCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // บันทึก token ลง cookies
        Cookies.set("token", data.token, { expires: 1 }); // 1 day
        Cookies.set("userType", "caregiver", { expires: 1 });
        Cookies.set("userId", data.caregiver.id, { expires: 1 });
        Cookies.set("userName", data.caregiver.name, { expires: 1 });
        
        // บันทึก elderId ถ้ามี
        if (data.caregiver.elderId) {
          Cookies.set("elderId", data.caregiver.elderId, { expires: 1 });
        }

        setAlert({
          isOpen: true,
          title: "เข้าสู่ระบบสำเร็จ",
          message: `ยินดีต้อนรับ คุณ${data.caregiver.name}`,
          type: "success",
        });

        // เรียก onLoginSuccess พร้อมส่ง pairingCode ไปด้วย
        setTimeout(() => {
          onLoginSuccess(pairingCode.trim().toUpperCase());
        }, 1000);
      } else {
        // Login failed
        setAlert({
          isOpen: true,
          title: "เข้าสู่ระบบไม่สำเร็จ",
          message: data.error || "เบอร์โทรศัพท์หรือรหัสจับคู่ไม่ถูกต้อง",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setAlert({
        isOpen: true,
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
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
            placeholder="เบอร์โทรศัพท์ (เช่น 0812345678)"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm text-gray-800"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
            maxLength={10}
          />
        </div>
        <div className="relative">
          <Key className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="รหัสจับคู่ 6 ตัว (เช่น AB1234)"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm text-gray-800 uppercase"
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
            disabled={isLoading}
            maxLength={6}
          />
        </div>
      </div>

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`w-full text-white text-lg font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 mb-6 relative z-10 ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:scale-95"
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            กำลังเข้าสู่ระบบ...
          </>
        ) : (
          <>
            <LogIn size={24} /> เข้าสู่ระบบ
          </>
        )}
      </button>

      <div className="relative z-10 text-center bg-blue-50 p-4 rounded-xl border border-blue-100 w-full">
        <p className="text-gray-500 text-sm">ไม่มีรหัสจับคู่?</p>
        <p className="text-blue-600 font-bold text-sm mb-2">
          ติดต่อครอบครัวผู้สูงอายุเพื่อขอรหัสจับคู่
        </p>
        <p className="text-gray-400 text-xs">
          รหัสจับคู่จะแสดงในหน้าผู้ดูแลของแอปครอบครัว
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
