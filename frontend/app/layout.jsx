'use client';

import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import '@/globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
