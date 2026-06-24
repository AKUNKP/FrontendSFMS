import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import MainLayout from "../layouts/MainLayout";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";
import LiveMonitoring from "../pages/LiveMonitoring";
import ActivityLogs from "../pages/ActivityLogs/index";
import LaporanAnalitik from "../pages/LaporanAnalitik";
import TellerManagement from "../pages/TellerManagement";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";

function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        {/* Halaman publik */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* SPV Routes */}
        <Route path="/spv/*" element={
          <RequireAuth>
            <RequireRole allowed={["spv"]} fallback="/login">
              <MainLayout />
            </RequireRole>
          </RequireAuth>
        }>
          {/* SPV Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />
          {/* SPV Live Monitoring */}
          <Route path="live" element={<LiveMonitoring />} />
          {/* SPV Activity Logs */}
          <Route path="logs" element={<ActivityLogs />} />
          {/* SPV Laporan Analitik */}
          <Route path="analitik" element={<LaporanAnalitik />} />
          {/* SPV Teller Management */}
          <Route path="teller" element={<TellerManagement />} />
          {/* SPV Index → Dashboard */}
          <Route path="" element={<Navigate to="/spv/dashboard" replace />} />
        </Route>

        {/* Teller Routes */}
        <Route path="/teller/*" element={
          <RequireAuth>
            <RequireRole allowed={["teller"]} fallback="/login">
              <MainLayout />
            </RequireRole>
          </RequireAuth>
        }>
          {/* Teller Live Monitoring */}
          <Route path="live" element={<LiveMonitoring />} />
          {/* Teller Dashboard (limited) */}
          <Route path="dashboard" element={<LiveMonitoring />} />
          {/* Teller Index → Live */}
          <Route path="" element={<Navigate to="/teller/live" replace />} />
        </Route>

        {/* Legacy routes (backward compatibility) */}
        <Route path="/dashboard" element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }>
          {/* Index: admin → Dashboard, teller → redirect ke live */}
          <Route index element={
            <RequireRole allowed={["spv"]} fallback="/dashboard/live">
              <Dashboard />
            </RequireRole>
          } />
          {/* Live monitoring: bisa diakses semua role */}
          <Route path="live" element={<LiveMonitoring />} />
          {/* Halaman khusus admin (spv) */}
          <Route path="logs" element={
            <RequireRole allowed={["spv"]} fallback="/dashboard/live">
              <ActivityLogs />
            </RequireRole>
          } />
          <Route path="analitik" element={
            <RequireRole allowed={["spv"]} fallback="/dashboard/live">
              <LaporanAnalitik />
            </RequireRole>
          } />
          <Route path="teller" element={
            <RequireRole allowed={["spv"]} fallback="/dashboard/live">
              <TellerManagement />
            </RequireRole>
          } />
        </Route>

        {/* Fallback — path tidak dikenal redirect ke landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default AppRoutes;
