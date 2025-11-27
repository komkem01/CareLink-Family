'use client';
import { useRouter } from 'next/navigation';
import { Heart, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex justify-center items-center sm:p-4 font-sans text-gray-800 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Container */}
      <div className="w-full sm:max-w-md h-screen sm:h-auto sm:min-h-[700px] bg-white sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-8 border-white ring-1 ring-gray-200 p-8">
        
        {/* Header */}
        <div className="text-center mb-12 mt-8">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-3xl shadow-xl mb-6 flex items-center justify-center w-24 h-24 mx-auto">
            <Heart size={48} className="text-white fill-current" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            CareLink
          </h1>
          <p className="text-gray-500 text-lg">
            ระบบดูแลผู้สูงอายุ
          </p>
        </div>

        {/* Options */}
        <div className="flex-1 flex flex-col justify-center space-y-4 mb-8">
          {/* Family/Relatives */}
          <button
            onClick={() => router.push('/family')}
            className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-6 rounded-3xl shadow-lg transition-all active:scale-95 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-2xl">
                <Users size={32} className="text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">สำหรับลูกหลาน</h2>
                <p className="text-purple-100 text-sm">ติดตามและดูแลผู้สูงอายุ</p>
              </div>
            </div>
            <ArrowRight size={24} className="text-white/80 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Caregiver/Professional */}
          <button
            onClick={() => router.push('/caregiver')}
            className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-6 rounded-3xl shadow-lg transition-all active:scale-95 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-2xl">
                <Heart size={32} className="text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">สำหรับผู้ดูแล</h2>
                <p className="text-blue-100 text-sm">บันทึกการดูแลประจำวัน</p>
              </div>
            </div>
            <ArrowRight size={24} className="text-white/80 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>เลือกประเภทการใช้งานเพื่อเริ่มต้น</p>
        </div>
      </div>
    </main>
  );
}