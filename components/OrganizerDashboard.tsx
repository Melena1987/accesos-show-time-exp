import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { useGuests } from '../hooks/useGuests';
import { Guest, AccessLevel } from '../types';
import Invitation from './Invitation';
import QrCodeIcon from './icons/QrCodeIcon';
import HomeIcon from './icons/HomeIcon';

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

const GuestList: React.FC<{ guests: Guest[], onGenerateInvitation: (guest: Guest) => void }> = ({ guests, onGenerateInvitation }) => {
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
              <button
                onClick={() => onGenerateInvitation(guest)}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2 px-3 rounded-md transition duration-300"
              >
                <QrCodeIcon className="w-4 h-4" />
                <span>Invitación</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const EventManager: React.FC = () => {
    const { events, selectedEventId, selectEvent, addEvent } = useGuests();
    const [newEventName, setNewEventName] = useState('');

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if(newEventName.trim()) {
            addEvent(newEventName.trim());
            setNewEventName('');
        }
    }
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4">Gestor de Eventos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="event-selector" className="block text-sm font-medium text-gray-300">Seleccionar Evento</label>
                    <select 
                        id="event-selector"
                        value={selectedEventId || ''}
                        onChange={(e) => selectEvent(e.target.value || null)}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">-- Elige un evento --</option>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>
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
  const { guests, events, selectedEventId, isLoading } = useGuests();
  const invitationRef = useRef<HTMLDivElement>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  useEffect(() => {
    if (selectedGuest && invitationRef.current) {
      const element = invitationRef.current;
      // Use a small delay to ensure the QR code canvas and any web fonts have rendered.
      const timer = setTimeout(async () => {
        try {
          const dataUrl = await toPng(element, { 
            cacheBust: true,
            pixelRatio: 2 // Improve image quality on high-DPI screens
          });
          const link = document.createElement('a');
          link.download = `invitacion-${selectedGuest.name.replace(/\s+/g, '-')}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error('Failed to generate invitation image', err);
          alert('Error: No se pudo generar la imagen de la invitación.');
        } finally {
          // Reset the selected guest to hide the component and allow generating again.
          setSelectedGuest(null);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedGuest]);

  const handleGenerateInvitation = (guest: Guest) => {
    // Simply set the guest to trigger the useEffect that handles image generation.
    setSelectedGuest(guest);
  };
  
  const currentGuests = guests.filter(g => g.eventId === selectedEventId);
  const selectedEvent = events.find(e => e.id === selectedEventId);

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
            
            {selectedEventId ? (
                <div>
                     <h2 className="text-2xl font-bold mb-6 text-indigo-400">Gestionando Invitados para: {selectedEvent?.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1">
                            <GuestForm eventId={selectedEventId} organizerName={loggedInUser} />
                        </div>
                        <div className="md:col-span-2">
                            <GuestList guests={currentGuests} onGenerateInvitation={handleGenerateInvitation} />
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
      
      {/* This component is rendered off-screen and used as a template for the image generation */}
      {selectedGuest && selectedEvent && (
        <div className="fixed -top-full -left-full">
          <Invitation guest={selectedGuest} eventName={selectedEvent.name} ref={invitationRef} />
        </div>
      )}
    </>
  );
};

export default OrganizerDashboard;