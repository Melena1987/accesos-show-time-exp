
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

const AUTH_STORAGE_KEY = 'showtime-auth-session';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        // Basic validation
        if (Object.values(UserRole).includes(parsedAuth.role) && parsedAuth.username) {
            return parsedAuth;
        }
      }
    } catch (error) {
      console.error("Failed to parse auth from localStorage", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    return { role: UserRole.NONE, username: null };
  });

  const handleLogin = (role: UserRole, username: string) => {
    const newAuth = { role, username };
    setAuth(newAuth);
    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuth));
    } catch (error) {
        console.error("Failed to save auth to localStorage", error);
    }
  };
  
  const handleLogout = () => {
    setAuth({ role: UserRole.NONE, username: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <GuestProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <Routes>
            <Route path="/" element={auth.role === UserRole.NONE ? <LandingPage /> : <Navigate to={`/${auth.role}`} />} />
            <Route path="/login" element={auth.role === UserRole.NONE ? <LoginPage onLogin={handleLogin} /> : <Navigate to={`/${auth.role}`} />} />
            <Route path="/admin/login" element={auth.role === UserRole.NONE ? <AdminLoginPage onLogin={handleLogin} /> : <Navigate to="/admin" />} />
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
