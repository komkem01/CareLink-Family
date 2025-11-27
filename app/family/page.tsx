'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import FamilyLoginScreen from '@/components/family/FamilyLoginScreen';
import SelectElderScreen from '@/components/family/SelectElderScreen';
import FamilyDashboard from '@/components/family/FamilyDashboard';

interface Elder {
  id: string;
  name: string;
  age: number;
  relation: string;
  profileColor: string;
}

export default function FamilyApp() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<'login' | 'select' | 'dashboard'>('login');
  const [selectedElder, setSelectedElder] = useState<Elder | null>(null);

  const handleSelectElder = (elder: Elder) => {
    setSelectedElder(elder);
    setCurrentScreen('dashboard');
  };

  const handleBackToSelect = () => {
    setCurrentScreen('select');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <main className="min-h-screen flex justify-center items-center sm:p-4 font-sans text-gray-800 bg-gradient-to-br from-purple-100 to-blue-100">
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
          <FamilyLoginScreen onLoginSuccess={() => setCurrentScreen('select')} />
        )}
        
        {currentScreen === 'select' && (
          <SelectElderScreen onSelectElder={handleSelectElder} />
        )}
        
        {currentScreen === 'dashboard' && selectedElder && (
          <FamilyDashboard selectedElder={selectedElder} onBack={handleBackToSelect} />
        )}
        
      </div>
    </main>
  );
}
