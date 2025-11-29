"use client";
import { useState, useEffect } from "react";
import { Lock, ArrowRight, Camera } from "lucide-react";
import CustomAlert from "../CustomAlert";
import Cookies from "js-cookie";

interface Props {
  pairingCode: string;
  onPairSuccess: () => void;
  onBack: () => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

export default function PairingScreen({ pairingCode, onPairSuccess, onBack }: Props) {
  const [pairCode, setPairCode] = useState("");
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

  // Auto-fill และ auto-pair เมื่อมี pairingCode จาก login
  useEffect(() => {
    if (pairingCode) {
      setPairCode(pairingCode);
      // Auto pair หลังจาก 500ms
      const timer = setTimeout(() => {
        handlePair(pairingCode);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [pairingCode]);

  const handlePair = async (codeToUse?: string) => {
    const code = codeToUse || pairCode;
    
    // Validate input
    if (code.length !== 6) {
      setAlert({
        isOpen: true,
        title: "รหัสไม่ถูกต้อง",
        message: "กรุณากรอกรหัสจับคู่ 6 ตัวอักษรให้ครบถ้วน",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/caregiver/pairing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairingCode: code.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // บันทึก token และข้อมูลลง cookies
        Cookies.set("token", data.token, { expires: 1 }); // 1 day
        Cookies.set("userType", "caregiver", { expires: 1 });
        Cookies.set("userId", data.caregiver.id, { expires: 1 });
        Cookies.set("userName", data.caregiver.name, { expires: 1 });
        
        if (data.caregiver.elderId) {
          Cookies.set("elderId", data.caregiver.elderId, { expires: 1 });
        }

        // แสดงข้อความสำเร็จพร้อมชื่อผู้สูงอายุ
        const elderName = data.caregiver.elder?.name || "ผู้สูงอายุ";
        setAlert({
          isOpen: true,
          title: "เชื่อมต่อสำเร็จ! 🎉",
          message: `ยินดีต้อนรับเข้าสู่บ้าน '${elderName}'`,
          type: "success",
        });
      } else {
        // Pairing failed
        let errorMessage = "รหัสจับคู่ไม่ถูกต้อง";
        
        if (response.status === 403) {
          errorMessage = data.message || "ผู้ดูแลยังไม่ได้รับการยืนยันจากครอบครัว";
        } else if (data.error) {
          errorMessage = data.error;
        }

        setAlert({
          isOpen: true,
          title: "เชื่อมต่อไม่สำเร็จ",
          message: errorMessage,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Pairing error:", error);
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
        disabled={isLoading}
      >
        <ArrowRight size={24} className="rotate-180 text-gray-600" />
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        เชื่อมต่อผู้สูงอายุ
      </h2>
      <p className="text-gray-500 mb-8">กรอกรหัสจับคู่ 6 ตัวอักษรจากครอบครัว</p>

      <div className="relative mb-8">
        <Lock
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={24}
        />
        <input
          type="text"
          maxLength={6}
          placeholder="AB1234"
          className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-3xl font-bold tracking-[0.5em] text-center focus:border-green-500 focus:bg-white outline-none transition-colors text-gray-800 uppercase"
          value={pairCode}
          onChange={(e) => setPairCode(e.target.value.toUpperCase())}
          disabled={isLoading}
        />
      </div>

      <button
        onClick={() => handlePair()}
        disabled={isLoading}
        className={`w-full text-white text-lg font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 active:scale-95"
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
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
        <button 
          className="w-full py-4 bg-gray-100 rounded-2xl font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          disabled={isLoading}
        >
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
