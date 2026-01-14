'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Open menu</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0 lg:flex-none">
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-500 relative"
          >
            <span className="sr-only">Notifications</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User dropdown */}
          <div className="relative hidden sm:block">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">
                {user?.user_metadata?.full_name || user?.email}
              </span>
              <Link
                href="/dashboard/settings"
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
              >
                <span className="text-sm font-medium text-gray-600">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white py-4 px-4">
          <div className="space-y-2">
            <Link
              href="/dashboard/opportunities"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Opportunities
            </Link>
            <Link
              href="/dashboard/icps"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
            >
              ICPs
            </Link>
            <Link
              href="/dashboard/analytics"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Analytics
            </Link>
            <Link
              href="/dashboard/settings"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Settings
            </Link>
            <button
              onClick={() => signOut()}
              className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50 rounded-md"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
