import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATER',
  description: 'A smarter way to study. Learn faster, score better.',
  openGraph: {
    title: 'Ater',
    description: 'A local-first study engine for structured notes, retrieval, and review.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ater',
    description: 'A local-first study engine for structured notes, retrieval, and review.',
  },
};

import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="font-inter selection:bg-primary selection:text-background antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
