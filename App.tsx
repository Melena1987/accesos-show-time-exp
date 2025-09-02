import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { GuestProvider } from './context/GuestContext';
import LoginPage from './components/LoginPage';
import OrganizerDashboard from './components/OrganizerDashboard';
import ControllerView from './components/ControllerView';
import AdminDashboard from './components/AdminDashboard';
import Dashboard from './components/Dashboard';
import { auth, db } from './firebase';

interface SessionState {
  user: firebase.User | null;
  roles: string[];
  isLoading: boolean;
}

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

const ProtectedRoute: React.FC<{
  session: SessionState;
  requiredRole: string;
  children: React.ReactElement;
}> = ({ session, requiredRole, children }) => {
  if (session.isLoading) {
    return <LoadingSpinner />;
  }
  if (!session.user) {
    return <Navigate to="/login" replace />;
  }
  if (!session.roles.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const App: React.FC = () => {
  const [session, setSession] = useState<SessionState>({
    user: null,
    roles: [],
    isLoading: true,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDocRef = db.collection('users').doc(user.uid);
          const userDoc = await userDocRef.get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const roles: string[] = userData?.roles || [];
            setSession({ user, roles, isLoading: false });
          } else {
            console.warn(`User authenticated but has no roles document: ${user.uid}`);
            await auth.signOut();
            setSession({ user: null, roles: [], isLoading: false });
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
          await auth.signOut();
          setSession({ user: null, roles: [], isLoading: false });
        }
      } else {
        setSession({ user: null, roles: [], isLoading: false });
      }
    });
    return () => unsubscribe();
  }, []);

  if (session.isLoading) {
    return <LoadingSpinner />;
  }

  const username = session.user?.email?.split('@')[0] || 'Usuario';
  
  return (
    <GuestProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <Routes>
            <Route path="/login" element={session.user ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/admin/login" element={<Navigate to="/login" />} />
            
            <Route path="/" element={session.user ? <Navigate to="/dashboard" /> : <LoginPage />} />
            
            <Route
              path="/dashboard"
              element={
                session.user ? (
                  <Dashboard username={username} roles={session.roles} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/organizer"
              element={
                <ProtectedRoute session={session} requiredRole="organizer">
                  <OrganizerDashboard loggedInUser={username} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/controller"
              element={
                <ProtectedRoute session={session} requiredRole="controller">
                  <ControllerView />
                </ProtectedRoute>
              }
            />
             <Route
              path="/admin"
              element={
                <ProtectedRoute session={session} requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
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