// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import DashboardPage from './pages/Dashboard';
import DrugDetailsPage from './pages/DrugDetailsPage';
import PatientsPage from './pages/PatientsPage';
import RecommendationsPage from './pages/RecommendationsPage';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/drug/:drugId/:sessionId" element={<DrugDetailsPage />} />  {/* 🔥 New route */}
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
