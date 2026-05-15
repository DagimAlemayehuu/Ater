import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ater Admin | The Oracle Control Room",
  description: "High-fidelity management for the Ater pedagogical engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-screen overflow-hidden flex bg-[#FAFAFA] text-black antialiased`}>
        <Sidebar />
        <main className="flex-1 h-full overflow-hidden flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
