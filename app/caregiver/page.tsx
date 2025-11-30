'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LoginScreen from '@/components/caregiver/LoginScreen';
import PairingScreen from '@/components/caregiver/PairingScreen';
import DashboardScreen from '@/components/caregiver/DashboardScreen';

export default function CaregiverApp() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<'login' | 'pair' | 'dashboard'>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [pairingCode, setPairingCode] = useState('');

  // เช็คสถานะตอน mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          const userData = JSON.parse(user);
          if (userData.elderId) {
            // มี token และ elderId แล้ว → ไป dashboard
            setCurrentScreen('dashboard');
          } else {
            // มี token แต่ยังไม่ได้ pair → ไป pairing
            setCurrentScreen('pair');
          }
        } catch (e) {
          // Parse error → กลับไป login
          setCurrentScreen('login');
        }
      }
      setIsLoading(false);
    }
  }, []);

  const handleBackToHome = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
          <LoginScreen onLoginSuccess={(code) => {
            setPairingCode(code);
            setCurrentScreen('pair');
          }} />
        )}
        
        {currentScreen === 'pair' && (
          <PairingScreen 
            initialCode={pairingCode}
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
