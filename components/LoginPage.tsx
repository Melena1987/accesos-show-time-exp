import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (role: UserRole, username: string) => void;
}

const validCredentials = [
  { username: 'Nacho', password: 'NachoAcceso24*' },
  { username: 'Nachin', password: 'NachinAcceso24*' },
  { username: 'Vanesa', password: 'VanesaAcceso24*' },
  { username: 'Mercedes', password: 'MercedesAcceso24*' },
  { username: 'Arantxa', password: 'ArantxaAcceso24*' },
  { username: 'Mencia', password: 'MenciaAcceso24*' },
  { username: 'Manu', password: 'ManuAcceso24*' },
];

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<UserRole>(location.state?.defaultRole || UserRole.ORGANIZER);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const loggedInUser = validCredentials.find(
      cred => cred.username.toLowerCase() === username.toLowerCase() && cred.password === password
    );

    if (loggedInUser) {
      onLogin(activeTab, loggedInUser.username);
      navigate(`/${activeTab}`);
    } else {
      setError('Usuario o contraseña inválidos.');
    }
  };

  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setError('');
    setUsername('');
    setPassword('');
  };
  
  const renderForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-400"
        >
          Usuario
        </label>
        <div className="mt-1">
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Introduce tu usuario"
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
            placeholder="Introduce tu contraseña"
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
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-white tracking-tight">
            ACCESOS SHOW TIME
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Inicio de Sesión
          </p>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full">
            <div className="mb-6">
                <div className="flex border-b border-gray-700">
                    <button onClick={() => handleTabChange(UserRole.ORGANIZER)} className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === UserRole.ORGANIZER ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>
                        Organizador
                    </button>
                    <button onClick={() => handleTabChange(UserRole.CONTROLLER)} className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === UserRole.CONTROLLER ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>
                        Controlador
                    </button>
                </div>
            </div>
            {renderForm()}
        </div>
      </div>
      <Link to="/admin/login" className="absolute bottom-4 right-4 text-xs text-gray-500 hover:text-gray-300 transition-colors">
        Acceso Admin
      </Link>
    </div>
  );
};

export default LoginPage;