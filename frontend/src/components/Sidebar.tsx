// src/components/Sidebar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  MenuIcon,
  HomeIcon,
  UsersIcon,
  FileTextIcon,
  SettingsIcon,
  LogOutIcon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { name: 'Dashboard', icon: <HomeIcon />, path: '/dashboard' },
  { name: 'Patients', icon: <UsersIcon />, path: '/patients' },
  { name: 'Recommendations', icon: <FileTextIcon />, path: '/recommendations' },
  { name: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <motion.div
      animate={{ width: isOpen ? 220 : 70 }}
      className="h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white relative flex flex-col overflow-hidden"
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Toggle button, moved a bit down on the right */}
      <button
        onClick={onToggle}
        className="absolute right-2 top-6 p-2 rounded-full hover:bg-white hover:bg-opacity-20 focus:outline-none transition"
      >
        <MenuIcon className="w-6 h-6 text-white" />
      </button>

      {/* Nav links */}
      <nav className="flex-1 mt-20">
        {navItems.map((item) => (
          <a
            key={item.name}
            href={item.path}
            className="flex items-center py-3 px-4 hover:bg-white hover:bg-opacity-10 transition"
          >
            <div className="w-6 h-6 text-white">
              {item.icon}
            </div>
            {isOpen && (
              <span className="ml-4 text-white font-medium">
                {item.name}
              </span>
            )}
          </a>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-blue-500">
        <button className="flex items-center w-full text-left hover:text-red-400 transition">
          <LogOutIcon className="w-5 h-5" />
          {isOpen && <span className="ml-4">Logout</span>}
        </button>
      </div>
    </motion.div>
  );
}
