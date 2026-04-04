'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">SK</span>
              </div>
              <span className="font-bold text-xl hidden sm:inline">SK Properties</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              Dashboard
            </Link>
            <Link href="/leads" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              Leads
            </Link>
            <Link href="/properties" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              Properties
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4">
            <Link href="/" className="block px-3 py-2 hover:bg-blue-700 rounded-md">
              Dashboard
            </Link>
            <Link href="/leads" className="block px-3 py-2 hover:bg-blue-700 rounded-md">
              Leads
            </Link>
            <Link href="/properties" className="block px-3 py-2 hover:bg-blue-700 rounded-md">
              Properties
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
