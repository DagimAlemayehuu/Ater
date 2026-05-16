import type {Metadata} from 'next';
import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '700', '900']
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '700', '800']
});

export const metadata: Metadata = {
  title: 'ATER INDUSTRIAL SYSTEMS',
  description: 'A smarter way to study. Learn faster, score better.',
};

import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-inter selection:bg-primary selection:text-background antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

