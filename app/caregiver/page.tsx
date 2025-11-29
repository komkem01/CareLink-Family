'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LoginScreen from '@/components/caregiver/LoginScreen';
import PairingScreen from '@/components/caregiver/PairingScreen';
import DashboardScreen from '@/components/caregiver/DashboardScreen';
import Cookies from 'js-cookie';

export default function CaregiverApp() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<'login' | 'pair' | 'dashboard'>('login');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = Cookies.get('token');
    const userType = Cookies.get('userType');
    const elderId = Cookies.get('elderId');

    if (token && userType === 'caregiver') {
      // ถ้ามี token และเป็น caregiver
      if (elderId) {
        // ถ้ามี elderId แสดงว่า pairing เรียบร้อยแล้ว
        setCurrentScreen('dashboard');
      } else {
        // ถ้ายังไม่ได้ pairing ให้ไปหน้า pairing
        setCurrentScreen('pair');
      }
    } else {
      // ถ้าไม่มี token หรือไม่ใช่ caregiver ให้อยู่หน้า login
      setCurrentScreen('login');
    }
    
    setIsLoading(false);
  }, []);

  const handleBackToHome = () => {
    // Clear cookies when going back
    Cookies.remove('token');
    Cookies.remove('userType');
    Cookies.remove('userId');
    Cookies.remove('userName');
    Cookies.remove('elderId');
    router.push('/');
  };

  const handleLoginSuccess = (code: string) => {
    setPairingCode(code);
    setCurrentScreen('pair');
  };

  // Show loading while checking session
  if (isLoading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex justify-center items-center sm:p-4 font-sans text-gray-800 bg-gray-100">
      {/* Container จำลองมือถือ */}
      <div className="w-full sm:max-w-md h-screen sm:h-[850px] bg-white sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-8 border-white ring-1 ring-gray-200">
        
        {/* Back Button - Show only on login screen */}
        {currentScreen === 'login' && (
          <button
            onClick={handleBackToHome}
            className="absolute top-4 left-4 z-50 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        
        {/* Logic สลับหน้าจอ */}
        {currentScreen === 'login' && (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}
        
        {currentScreen === 'pair' && (
          <PairingScreen 
            pairingCode={pairingCode}
            onPairSuccess={() => setCurrentScreen('dashboard')} 
            onBack={() => setCurrentScreen('login')} 
          />
        )}
        
        {currentScreen === 'dashboard' && (
          <DashboardScreen />
        )}
        
      </div>
    </main>
  );
}
