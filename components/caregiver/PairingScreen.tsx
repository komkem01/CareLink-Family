"use client";
import { useState, useEffect } from "react";
import { Lock, ArrowRight, Camera } from "lucide-react";
import CustomAlert from "../CustomAlert";

interface Props {
  initialCode?: string;
  onPairSuccess: () => void;
  onBack: () => void;
}

export default function PairingScreen({ initialCode = '', onPairSuccess, onBack }: Props) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const [pairCode, setPairCode] = useState(initialCode);
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

  // Auto-submit เมื่อมี initialCode
  useEffect(() => {
    if (initialCode && initialCode.length >= 4) {
      handlePair();
    }
  }, [initialCode]);

  const handlePair = async () => {
    if (pairCode.length < 4) {
      setAlert({
        isOpen: true,
        title: "รหัสไม่ถูกต้อง",
        message: "กรุณากรอกรหัสบ้าน 6 หลักให้ครบถ้วนครับ",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        setAlert({
          isOpen: true,
          title: "ข้อผิดพลาด",
          message: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
          type: "error",
        });
        return;
      }

      const userData = JSON.parse(user);
      
      const res = await fetch(`${BASE_URL}/auth/caregiver/pairing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          caregiverId: userData.id,
          pairingCode: pairCode
        })
      });

      const data = await res.json();

      if (res.ok && data.caregiver && data.elder) {
        // อัพเดท user data ด้วย elderId
        const updatedUser = { ...userData, elderId: data.elder.id };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setAlert({
          isOpen: true,
          title: "เชื่อมต่อสำเร็จ! 🎉",
          message: `ยินดีต้อนรับเข้าสู่บ้าน '${data.elder.name}'`,
          type: "success",
        });
      } else {
        setAlert({
          isOpen: true,
          title: "เชื่อมต่อล้มเหลว",
          message: data.message || "รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
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

  const handleAlertClose = () => {
    setAlert({ ...alert, isOpen: false });
    if (alert.type === "success") {
      onPairSuccess();
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-white relative">
      <button
        onClick={onBack}
        className="self-start mb-8 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
      >
        <ArrowRight size={24} className="rotate-180 text-gray-600" />
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        เชื่อมต่อผู้สูงอายุ
      </h2>
      <p className="text-gray-500 mb-8">กรอกรหัสบ้าน 6 หลักจากลูกหลาน</p>

      <div className="relative mb-8">
        <Lock
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={24}
        />
        <input
          type="text"
          maxLength={6}
          placeholder="123456"
          className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-3xl font-bold tracking-[0.5em] text-center focus:border-green-500 focus:bg-white outline-none transition-colors text-gray-800"
          value={pairCode}
          onChange={(e) => setPairCode(e.target.value)}
        />
      </div>

      <button
        onClick={handlePair}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            กำลังเชื่อมต่อ...
          </>
        ) : (
          <>
            เชื่อมต่อ <ArrowRight size={24} />
          </>
        )}
      </button>

      <div className="mt-auto">
        <p className="text-center text-gray-400 text-sm mb-4">หรือสแกน QR Code</p>
        <button className="w-full py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
          <Camera size={20} /> เปิดกล้องสแกน
        </button>
      </div>

      <CustomAlert
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={handleAlertClose}
      />
    </div>
  );
}
