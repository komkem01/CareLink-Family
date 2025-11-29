import React, { useState } from 'react';
import { Heart, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface Mood {
  id: string;
  mood: string;
  timeOfDay: string;
  note: string;
  recordedAt: string;
  caregiver: {
    id: string;
    name: string;
  };
}

interface MoodsTabProps {
  moods: Mood[];
  loading: boolean;
}

export default function MoodsTab({ moods, loading }: MoodsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pagination
  const totalPages = Math.ceil(moods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMoods = moods.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const getMoodIcon = (moodType: string) => {
    if (moodType === 'ปกติ') return '😌';
    if (moodType === 'อารมณ์ดี') return '😊';
    if (moodType === 'ซึม') return '😐';
    if (moodType === 'หงุดหงิด') return '😠';
    if (moodType === 'นอนไม่หลับ') return '😴';
    return '📝';
  };

  const getMoodColor = (moodType: string) => {
    if (moodType === 'ปกติ') return 'bg-blue-50 border-blue-200';
    if (moodType === 'อารมณ์ดี') return 'bg-green-50 border-green-200';
    if (moodType === 'ซึม') return 'bg-gray-50 border-gray-200';
    if (moodType === 'หงุดหงิด') return 'bg-red-50 border-red-200';
    if (moodType === 'นอนไม่หลับ') return 'bg-purple-50 border-purple-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getTimeOfDayIcon = (time: string) => {
    if (time === 'เช้า') return '🌅';
    if (time === 'บ่าย') return '☀️';
    if (time === 'เย็น') return '🌆';
    if (time === 'ก่อนนอน') return '🌙';
    return '⏰';
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Heart size={28} className="text-pink-600" />
          จดอาการจากผู้ดูแล
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      ) : moods.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border-2 border-dashed border-gray-200">
          <Heart size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg font-medium mb-2">ยังไม่มีข้อมูลจดอาการ</p>
          <p className="text-gray-400">ผู้ดูแลจะบันทึกอารมณ์และสุขภาพของคุณยายผ่านแอปพลิเคชัน</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentMoods.map((mood) => (
              <div
                key={mood.id}
                className={`rounded-2xl p-5 shadow-sm border-2 transition-all hover:shadow-md ${getMoodColor(mood.mood)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getMoodIcon(mood.mood)}</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {mood.mood === 'note' ? 'บันทึกเพิ่มเติม' : mood.mood}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span>{getTimeOfDayIcon(mood.timeOfDay)}</span>
                        {mood.timeOfDay === 'general' ? 'ทั่วไป' : mood.timeOfDay}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(mood.recordedAt).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(mood.recordedAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {mood.note && (
                  <div className="bg-white/60 rounded-xl p-4 mt-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{mood.note}</p>
                  </div>
                )}

                {mood.caregiver && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <User size={14} />
                    <span>บันทึกโดย: {mood.caregiver.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                }`}
              >
                <ChevronLeft size={18} />
                <span className="hidden sm:inline">ก่อนหน้า</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">หน้า</span>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${
                      currentPage === page
                        ? 'bg-purple-600 text-white shadow-md scale-110'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  จาก {totalPages}
                </span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                }`}
              >
                <span className="hidden sm:inline">ถัดไป</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
            <p className="text-sm text-gray-600 text-center">
              แสดง {startIndex + 1}-{Math.min(endIndex, moods.length)} จาก {moods.length} รายการ
            </p>
          </div>
        </>
      )}
    </div>
  );
}
