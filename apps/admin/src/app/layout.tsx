import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminGuard } from "@/components/layout/AdminGuard";
import { Outfit } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '800', '900'],
  variable: '--font-sans',
  display: 'swap',
});

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
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="h-screen overflow-hidden bg-background text-foreground antialiased selection:bg-foreground selection:text-background font-sans">
        <ThemeProvider>
          <AdminGuard>
            {children}
          </AdminGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
