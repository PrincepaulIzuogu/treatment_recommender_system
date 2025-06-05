// src/pages/LandingPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Logo from '@/assets/logo.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6
                 bg-gradient-to-r from-blue-900 via-teal-700 to-teal-500"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="flex items-center space-x-4 mb-8"
      >
        <img src={Logo} alt="MediMatch Logo" className="w-24 h-24" />
        <motion.h1
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-white text-5xl font-extrabold"
        >
          MediMatch
        </motion.h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="text-gray-200 text-xl text-center max-w-xl mb-10"
      >
        Personalized treatment recommendations powered by patient similarity and real-world data.
      </motion.p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/dashboard')}
        className="bg-white text-blue-900 font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition"
      >
        Get Started
      </motion.button>
    </div>
  );
}
