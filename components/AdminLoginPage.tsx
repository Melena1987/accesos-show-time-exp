import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { auth } from '../firebase';

interface AdminLoginPageProps {
  onLogin: (role: UserRole, username: string) => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      // Asumimos que el email del admin es específico
      if (userCredential.user?.email?.toLowerCase() === 'manu@tudominio.com') { // <- Cambia esto por el email real del admin
          onLogin(UserRole.ADMIN, 'Manu');
          navigate('/admin');
      } else {
          await auth.signOut();
          setError('Este usuario no tiene permisos de administrador.');
      }
    } catch (err: any) {
      setError('Credenciales de administrador inválidas.');
      console.error("Error de autenticación:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-white tracking-tight">
            ACCESOS SHOW TIME
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Inicio de Sesión de Administrador
          </p>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email de Administrador"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-400"
              >
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña de Administrador"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <Link to="/" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
