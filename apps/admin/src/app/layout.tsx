import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminGuard } from "@/components/layout/AdminGuard";

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
      <body className="h-screen overflow-hidden bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
        <ThemeProvider>
          <AdminGuard>
            {children}
          </AdminGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
