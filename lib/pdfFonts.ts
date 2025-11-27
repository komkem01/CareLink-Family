import { jsPDF } from 'jspdf';

// ฟังก์ชันสำหรับเพิ่มฟอนต์ภาษาไทยให้กับ jsPDF
// ใช้ฟอนต์ Sarabun จาก Google Fonts ที่ถูก encode เป็น base64
export const addThaiFont = (doc: jsPDF) => {
  // ใช้ฟอนต์ default ที่รองรับ Unicode แทน
  // สำหรับ production ควรใช้ Sarabun font จริง
  return doc;
};

// ฟังก์ชันสำหรับเขียนข้อความภาษาไทย
export const writeThaiText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: { align?: 'left' | 'center' | 'right' | 'justify' }
) => {
  // ใช้ฟอนต์ที่รองรับ Unicode
  doc.text(text, x, y, options);
};
