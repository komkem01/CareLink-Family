import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "CareLink App",
  description: "แอพสำหรับผู้ดูแลมืออาชีพ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans bg-gray-100`}>
        {children}
      </body>
    </html>
  );
}