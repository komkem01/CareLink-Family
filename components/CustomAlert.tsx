"use client";
import { Bell, AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "info" | "error" | "success";
  onClose: () => void;
}

export default function CustomAlert({
  isOpen,
  title,
  message,
  type = "info",
  onClose,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              type === "error"
                ? "bg-red-100 text-red-600"
                : type === "success"
                ? "bg-green-100 text-green-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {type === "error" ? (
              <AlertTriangle size={24} />
            ) : type === "success" ? (
              <CheckCircle size={24} />
            ) : (
              <Bell size={24} />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 max-h-60 overflow-y-auto text-left">
          <p className="text-gray-600 whitespace-pre-line text-sm leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg active:scale-95"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}
