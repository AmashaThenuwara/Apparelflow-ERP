import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApparelFlow ERP — Cutting Verification & Sewing Gate",
  description: "Garment manufacturing production control system with server-side RBAC and QC gate",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#070b13] text-slate-100">{children}</body>
    </html>
  );
}
