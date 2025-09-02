

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from './types';
import { GuestProvider } from './context/GuestContext';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import OrganizerDashboard from './components/OrganizerDashboard';
import ControllerView from './components/ControllerView';
import AdminDashboard from './components/AdminDashboard';
import { auth } from './firebase';

interface AuthState {
  role: UserRole;
  username: string | null;
}

const AUTH_STORAGE_KEY = 'showtime-auth-session';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(() => {
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
    setAuthState(newAuth);
    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuth));
    } catch (error) {
        console.error("Failed to save auth to localStorage", error);
    }
  };
  
  const handleLogout = () => {
    setAuthState({ role: UserRole.NONE, username: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  useEffect(() => {
    // FIX: The `auth` state variable was shadowing the `auth` import from Firebase.
    // Renamed the state variable to `authState` to resolve the conflict and allow
    // `onAuthStateChanged` to be called on the correct Firebase auth object.
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        handleLogout();
      }
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <GuestProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <Routes>
            <Route path="/" element={authState.role === UserRole.NONE ? <LandingPage /> : <Navigate to={`/${authState.role}`} />} />
            <Route path="/login" element={authState.role === UserRole.NONE ? <LoginPage onLogin={handleLogin} /> : <Navigate to={`/${authState.role}`} />} />
            <Route path="/admin/login" element={<Navigate to="/login" />} />
            <Route
              path="/organizer"
              element={
                authState.role === UserRole.ORGANIZER && authState.username ? (
                  <OrganizerDashboard onLogout={handleLogout} loggedInUser={authState.username} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/controller"
              element={
                authState.role === UserRole.CONTROLLER ? (
                  <ControllerView onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
             <Route
              path="/admin"
              element={
                authState.role === UserRole.ADMIN ? (
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