"use client";

import React, { useState } from "react";
import { FileText, Download, Mail, Eye, Loader } from "lucide-react";
import CustomAlert from "../CustomAlert";

interface WeeklyReportButtonProps {
  elderId: string;
  elderName: string;
}

const WeeklyReportButton: React.FC<WeeklyReportButtonProps> = ({ elderId, elderName }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleViewReport = async (format: 'json' | 'html' | 'pdf') => {
    setLoading(true);
    setShowMenu(false);

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      
      if (format === 'pdf') {
        // Download PDF
        const response = await fetch(
          `http://localhost:3001/api/family/reports/weekly/${elderId}?format=pdf`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `รายงานประจำสัปดาห์-${elderName}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setAlert({ type: "success", message: "ดาวน์โหลดรายงานสำเร็จ" });
        } else {
          throw new Error('Failed to download PDF');
        }
      } else if (format === 'html') {
        // Open HTML in new window
        const url = `http://localhost:3001/api/family/reports/weekly/${elderId}?format=html`;
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          newWindow.opener = null; // Security
        }
      } else {
        // View JSON data
        const response = await fetch(
          `http://localhost:3001/api/family/reports/weekly/${elderId}?format=json`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Weekly Report Data:', data);
          setAlert({ 
            type: "success", 
            message: "ดูข้อมูลรายงานใน Console (กด F12)" 
          });
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setAlert({ type: "error", message: "ไม่สามารถสร้างรายงานได้" });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReport = async () => {
    setLoading(true);
    setShowMenu(false);

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(
        `http://localhost:3001/api/family/reports/email-weekly/${elderId}`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAlert({ 
          type: "success", 
          message: data.message || "เตรียมรายงานสำหรับส่งอีเมลเรียบร้อย" 
        });
      } else {
        throw new Error('Failed to email report');
      }
    } catch (error) {
      console.error('Error emailing report:', error);
      setAlert({ type: "error", message: "ไม่สามารถส่งอีเมลได้" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {alert && (
        <CustomAlert
          isOpen={true}
          type={alert.type}
          title={alert.type === "success" ? "สำเร็จ" : "ข้อผิดพลาด"}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="relative inline-block">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <Loader className="mr-2 animate-spin" size={20} />
          ) : (
            <FileText className="mr-2" size={20} />
          )}
          รายงานประจำสัปดาห์
        </button>

        {showMenu && !loading && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="py-2">
              <button
                onClick={() => handleViewReport('html')}
                className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 transition-colors"
              >
                <Eye className="mr-3 text-purple-600" size={18} />
                <div className="text-left">
                  <div className="font-medium">ดูรายงาน</div>
                  <div className="text-xs text-gray-500">เปิดในหน้าต่างใหม่</div>
                </div>
              </button>

              <button
                onClick={() => handleViewReport('pdf')}
                className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors"
              >
                <Download className="mr-3 text-blue-600" size={18} />
                <div className="text-left">
                  <div className="font-medium">ดาวน์โหลด PDF</div>
                  <div className="text-xs text-gray-500">บันทึกเป็นไฟล์</div>
                </div>
              </button>

              <button
                onClick={handleEmailReport}
                className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 transition-colors border-t border-gray-100"
              >
                <Mail className="mr-3 text-green-600" size={18} />
                <div className="text-left">
                  <div className="font-medium">ส่งทางอีเมล</div>
                  <div className="text-xs text-gray-500">รายงานสรุปฉบับเต็ม</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Backdrop */}
        {showMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    </>
  );
};

export default WeeklyReportButton;
