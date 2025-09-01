import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';
import QrCodeIcon from './icons/QrCodeIcon';
import UserListIcon from './icons/UserListIcon';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectRole = (role: UserRole) => {
    navigate('/login', { state: { defaultRole: role } });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
          ACCESOS SHOW TIME
        </h1>
        <p className="mt-4 text-base font-light text-gray-500 tracking-[0.2em]">by Manu</p>
        <p className="mt-6 text-lg text-gray-400">
          Plataforma de Gestión de Invitados VIP
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Organizer Card */}
        <div
          onClick={() => handleSelectRole(UserRole.ORGANIZER)}
          className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
        >
          <div className="bg-indigo-500/10 p-4 rounded-full mb-6">
             <UserListIcon className="w-12 h-12 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Acceso Organizador</h2>
          <p className="text-gray-400">
            Crea y gestiona las invitaciones de los invitados con códigos QR.
          </p>
        </div>

        {/* Controller Card */}
        <div
          onClick={() => handleSelectRole(UserRole.CONTROLLER)}
          className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/10 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
        >
          <div className="bg-purple-500/10 p-4 rounded-full mb-6">
            <QrCodeIcon className="w-12 h-12 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Acceso Controlador</h2>
          <p className="text-gray-400">
            Escanea y valida los códigos QR de los invitados en la entrada del evento.
          </p>
        </div>
      </div>

      <Link to="/admin/login" className="absolute bottom-4 right-4 text-xs text-gray-500 hover:text-gray-300 transition-colors">
        Acceso Admin
      </Link>
    </div>
  );
};

export default LandingPage;