import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import UserListIcon from './icons/UserListIcon';
import QrCodeIcon from './icons/QrCodeIcon';
import AdminIcon from './icons/AdminIcon';

interface DashboardProps {
  username: string;
  roles: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ username, roles }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
  };

  const roleConfig = {
    admin: {
      path: '/admin',
      title: 'Panel de Administración',
      description: 'Gestiona eventos y exporta datos.',
      Icon: AdminIcon,
      color: 'text-red-400',
      hover: 'hover:border-red-500 hover:shadow-red-500/10'
    },
    organizer: {
      path: '/organizer',
      title: 'Panel de Organizador',
      description: 'Crea eventos y gestiona invitados.',
      Icon: UserListIcon,
      color: 'text-indigo-400',
      hover: 'hover:border-indigo-500 hover:shadow-indigo-500/10'
    },
    controller: {
      path: '/controller',
      title: 'Vista de Controlador',
      description: 'Escanea códigos QR para validar el acceso.',
      Icon: QrCodeIcon,
      color: 'text-purple-400',
      hover: 'hover:border-purple-500 hover:shadow-purple-500/10'
    }
  };

  const availableRoles = ['admin', 'organizer', 'controller'].filter(role => roles.includes(role));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold">Bienvenido, {username}</h1>
        <p className="mt-4 text-lg text-gray-400">Selecciona el panel al que quieres acceder.</p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {availableRoles.map(roleKey => {
            const config = roleConfig[roleKey as keyof typeof roleConfig];
            return (
              <div
                key={roleKey}
                onClick={() => navigate(config.path)}
                className={`bg-gray-800 rounded-2xl p-8 border border-gray-700 ${config.hover} transform hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center`}
              >
                <div className="bg-gray-700/50 p-4 rounded-full mb-6">
                  <config.Icon className={`w-12 h-12 ${config.color}`} />
                </div>
                <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
                <p className="text-gray-400 text-sm flex-grow">{config.description}</p>
              </div>
            );
          })}
        </div>
        
        <div className="mt-16">
            <button
              onClick={handleLogout}
              className="bg-gray-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-md transition duration-300"
            >
              Cerrar Sesión
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
