import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { useGuests } from '../hooks/useGuests';
import { Guest, AccessLevel } from '../types';
import Invitation from './Invitation';
import QrCodeIcon from './icons/QrCodeIcon';
import HomeIcon from './icons/HomeIcon';
import TrashIcon from './icons/TrashIcon';

interface OrganizerDashboardProps {
  onLogout: () => void;
  loggedInUser: string;
}

const GuestForm: React.FC<{ eventId: string; organizerName: string; }> = ({ eventId, organizerName }) => {
  const { addGuest } = useGuests();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(AccessLevel.LEVEL_1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && company && eventId) {
      addGuest(name, company, accessLevel, eventId, organizerName);
      setName('');
      setCompany('');
      setAccessLevel(AccessLevel.LEVEL_1);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Añadir Nuevo Invitado VIP</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre del Invitado</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-300">Empresa</label>
          <input
            type="text"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-300">Nivel de Acceso</label>
          <select
            id="accessLevel"
            value={accessLevel}
            onChange={(e) => setAccessLevel(Number(e.target.value) as AccessLevel)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={AccessLevel.LEVEL_1}>Nivel 1</option>
            <option value={AccessLevel.LEVEL_2}>Nivel 2</option>
            <option value={AccessLevel.LEVEL_3}>Nivel 3</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          Añadir Invitado
        </button>
      </form>
    </div>
  );
};

const GuestList: React.FC<{ guests: Guest[], onGenerateInvitation: (guest: Guest) => void, onDeleteGuest: (guestId: string) => void }> = ({ guests, onGenerateInvitation, onDeleteGuest }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md mt-8 md:mt-0">
      <h2 className="text-xl font-bold mb-4">Lista de Invitados ({guests.length})</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {guests.length === 0 ? (
          <p className="text-gray-400">Aún no se han añadido invitados para este evento.</p>
        ) : (
          [...guests].reverse().map((guest) => (
            <div key={guest.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold">{guest.name}</p>
                <p className="text-sm text-gray-400">{guest.company} - Nivel {guest.accessLevel}</p>
                {guest.checkedInAt && <p className="text-xs text-green-400">Admitido: {new Date(guest.checkedInAt).toLocaleTimeString()}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onGenerateInvitation(guest)}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2 px-3 rounded-md transition duration-300"
                  aria-label={`Generar invitación para ${guest.name}`}
                >
                  <QrCodeIcon className="w-4 h-4" />
                  <span>Invitación</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${guest.name}?`)) {
                      onDeleteGuest(guest.id);
                    }
                  }}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-300"
                  aria-label={`Eliminar a ${guest.name}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const EventManager: React.FC = () => {
    const { events, selectedEventId, selectEvent, addEvent, deleteEvent } = useGuests();
    const [newEventName, setNewEventName] = useState('');

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if(newEventName.trim()) {
            addEvent(newEventName.trim());
            setNewEventName('');
        }
    }
    
    const handleDeleteEvent = () => {
        if (!selectedEventId) return;
        const eventToDelete = events.find(e => e.id === selectedEventId);
        if (eventToDelete && window.confirm(`¿Estás seguro de que quieres eliminar el evento "${eventToDelete.name}" y todos sus invitados? Esta acción no se puede deshacer.`)) {
            deleteEvent(selectedEventId);
        }
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4">Gestor de Eventos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="flex items-end space-x-2">
                    <div className="flex-grow">
                        <label htmlFor="event-selector" className="block text-sm font-medium text-gray-300">Seleccionar Evento</label>
                        <select 
                            id="event-selector"
                            value={selectedEventId || ''}
                            onChange={(e) => selectEvent(e.target.value || null)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-[42px]"
                        >
                            <option value="">-- Elige un evento --</option>
                            {events.map(event => (
                                <option key={event.id} value={event.id}>{event.name}</option>
                            ))}
                        </select>
                    </div>
                    {selectedEventId && (
                        <button
                            onClick={handleDeleteEvent}
                            className="p-2 h-[42px] bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-300 flex-shrink-0"
                            aria-label="Eliminar evento seleccionado"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <form onSubmit={handleAddEvent} className="flex items-end space-x-2">
                    <div className="flex-grow">
                         <label htmlFor="new-event" className="block text-sm font-medium text-gray-300">O Crear Nuevo Evento</label>
                        <input 
                            id="new-event"
                            type="text"
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            placeholder="Nombre del nuevo evento"
                             className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 h-[42px]">
                        Crear
                    </button>
                </form>
            </div>
        </div>
    )
}

const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onLogout, loggedInUser }) => {
  const { guests, events, selectedEventId, isLoading, error, clearError, selectEvent, deleteGuest } = useGuests();
  const invitationRef = useRef<HTMLDivElement>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  useEffect(() => {
    if (selectedEventId && !selectedEvent && !isLoading) {
      selectEvent(null);
    }
  }, [selectedEventId, selectedEvent, isLoading, selectEvent]);
  
  useEffect(() => {
    if (selectedGuest && invitationRef.current) {
      const element = invitationRef.current;
      const timer = setTimeout(async () => {
        try {
          const dataUrl = await toPng(element, { 
            cacheBust: true,
            pixelRatio: 2
          });
          const link = document.createElement('a');
          link.download = `invitacion-${selectedGuest.name.replace(/\s+/g, '-')}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error('Failed to generate invitation image', err);
          alert('Error: No se pudo generar la imagen de la invitación.');
        } finally {
          setSelectedGuest(null);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedGuest]);

  const handleGenerateInvitation = (guest: Guest) => {
    setSelectedGuest(guest);
  };
  
  const currentGuests = guests.filter(g => g.eventId === selectedEventId);

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-900 p-4 md:p-8">
             <header className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Panel del Organizador</h1>
                  <p className="text-gray-400">Bienvenido, {loggedInUser}</p>
                </div>
                <button onClick={onLogout} className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                    <HomeIcon className="w-5 h-5" />
                    <span>Menú Principal</span>
                </button>
            </header>
            <div className="text-center bg-gray-800 p-10 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-300">Cargando datos...</h2>
                <p className="text-gray-400 mt-2">Por favor, espera un momento.</p>
            </div>
        </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
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
            <div>
              <h1 className="text-3xl font-bold">Panel del Organizador</h1>
              <p className="text-gray-400">Bienvenido, {loggedInUser}</p>
            </div>
            <button onClick={onLogout} className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                <HomeIcon className="w-5 h-5" />
                <span>Menú Principal</span>
            </button>
        </header>
        <main>
            <EventManager />
            
            {selectedEvent ? (
                <div>
                     <h2 className="text-2xl font-bold mb-6 text-indigo-400">Gestionando Invitados para: {selectedEvent.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1">
                            <GuestForm eventId={selectedEvent.id} organizerName={loggedInUser} />
                        </div>
                        <div className="md:col-span-2">
                            <GuestList guests={currentGuests} onGenerateInvitation={handleGenerateInvitation} onDeleteGuest={deleteGuest} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center bg-gray-800 p-10 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-300">Bienvenido</h2>
                    <p className="text-gray-400 mt-2">Por favor, selecciona un evento o crea uno nuevo para empezar a añadir invitados.</p>
                </div>
            )}
        </main>
      </div>
      
      {selectedGuest && selectedEvent && (
        <div className="fixed -top-full -left-full">
          <Invitation guest={selectedGuest} eventName={selectedEvent.name} ref={invitationRef} />
        </div>
      )}
    </>
  );
};

export default OrganizerDashboard;