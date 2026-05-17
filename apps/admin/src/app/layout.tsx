import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminGuard } from "@/components/layout/AdminGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ater Admin",
  description: "Management dashboard for Ater.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} h-screen overflow-hidden bg-background text-foreground antialiased selection:bg-foreground selection:text-background`}>
        <ThemeProvider>
          <AdminGuard>
            {children}
          </AdminGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
