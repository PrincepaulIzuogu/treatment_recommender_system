// src/components/TopBar.tsx
import React from 'react';
import { BellIcon, UserCircleIcon } from 'lucide-react';
import Logo from '@/assets/logo.png';

export default function TopBar() {
  return (
    <header className="flex items-center justify-between bg-gray-100 shadow px-6 h-16">
      <div className="flex items-center space-x-4">
        <img src={Logo} alt="MediMatch Logo" className="w-10 h-10" />
        <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 hover:bg-gray-200 rounded-full">
          <BellIcon className="w-6 h-6 text-gray-600" />
          {/* optional badge */}
          <span className="absolute top-1 right-1 block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 hover:bg-gray-200 rounded-full">
          <UserCircleIcon className="w-8 h-8 text-gray-600" />
        </button>
      </div>
    </header>
);
}
