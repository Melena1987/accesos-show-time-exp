import React from 'react';
import { useGuests } from '../hooks/useGuests';
import { Event, Guest } from '../types';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';
import { auth } from '../firebase';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { events, guests, isLoading, isOffline, error, clearError, deleteEvent } = useGuests();

  const handleFirebaseLogout = async () => {
    await auth.signOut();
    onLogout();
  };

  const handleExportToCSV = (event: Event, eventGuests: Guest[]) => {
    const headers = ["ID Invitado", "Nombre", "Empresa", "Nivel Acceso", "Invitado Por", "Hora Admisión"];
    const separator = ';';
    const rows = eventGuests.map(guest => [
      guest.id,
      `"${guest.name.replace(/"/g, '""')}"`,
      `"${guest.company.replace(/"/g, '""')}"`,
      guest.accessLevel,
      `"${guest.invitedBy || 'N/A'}"`,
      guest.checkedInAt ? `"${new Date(guest.checkedInAt).toLocaleString('es-ES')}"` : '"No admitido"'
    ].join(separator));
    const csvString = '\uFEFF' + [headers.join(separator), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invitados-${event.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteEvent = (event: Event) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el evento "${event.name}" y todos sus invitados? Esta acción no se puede deshacer.`)) {
        deleteEvent(event.id);
    }
  }

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-900 p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Panel de Administración</h1>
                 <button 
                  onClick={handleFirebaseLogout} 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                >
                  Cerrar Sesión
                </button>
            </header>
            <div className="text-center bg-gray-800 p-10 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-300">Cargando datos...</h2>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      {isOffline && (
          <div className="bg-yellow-800 border-yellow-600 text-white px-4 py-2 rounded-lg relative mb-6 text-center" role="status">
              <span className="font-semibold">Modo sin conexión:</span> Estás viendo datos guardados localmente.
          </div>
      )}
      {error && (
            <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Cerrar">
                    <span className="text-2xl">&times;</span>
                </button>
            </div>
        )}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <button 
          onClick={handleFirebaseLogout} 
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          Cerrar Sesión
        </button>
      </header>
      <main>
        <h2 className="text-2xl font-bold mb-6 text-indigo-400">Resumen de Eventos</h2>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => {
              const eventGuests = guests.filter(g => g.eventId === event.id);
              return (
                <div key={event.id} className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold truncate mb-2">{event.name}</h3>
                    <p className="text-gray-400 text-4xl font-semibold">{eventGuests.length}</p>
                    <p className="text-gray-400">Invitados Registrados</p>
                  </div>
                  <div className="mt-6 flex items-center space-x-2">
                    <button 
                      onClick={() => handleExportToCSV(event, eventGuests)}
                      disabled={eventGuests.length === 0}
                      className="flex-grow flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      <DownloadIcon className="w-5 h-5" />
                      <span>Descargar Lista (.csv)</span>
                    </button>
                    <button
                        onClick={() => handleDeleteEvent(event)}
                        className="flex-shrink-0 p-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition duration-300"
                        aria-label={`Eliminar evento ${event.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center bg-gray-800 p-10 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-300">No hay eventos</h2>
            <p className="text-gray-400 mt-2">Aún no se ha creado ningún evento en la plataforma.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
