
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from './types';
import { GuestProvider } from './context/GuestContext';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import OrganizerDashboard from './components/OrganizerDashboard';
import ControllerView from './components/ControllerView';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboard from './components/AdminDashboard';

interface AuthState {
  role: UserRole;
  username: string | null;
}

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ role: UserRole.NONE, username: null });

  const handleLogin = (role: UserRole, username: string) => {
    setAuth({ role, username });
  };
  
  const handleLogout = () => {
    setAuth({ role: UserRole.NONE, username: null });
  };

  return (
    <GuestProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/admin/login" element={<AdminLoginPage onLogin={handleLogin} />} />
            <Route
              path="/organizer"
              element={
                auth.role === UserRole.ORGANIZER && auth.username ? (
                  <OrganizerDashboard onLogout={handleLogout} loggedInUser={auth.username} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/controller"
              element={
                auth.role === UserRole.CONTROLLER ? (
                  <ControllerView onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
             <Route
              path="/admin"
              element={
                auth.role === UserRole.ADMIN ? (
                  <AdminDashboard onLogout={handleLogout} />
                ) : (
                  <Navigate to="/admin/login" />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </HashRouter>
    </GuestProvider>
  );
};

export default App;