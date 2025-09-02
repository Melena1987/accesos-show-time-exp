import React, { useState, useCallback, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useGuests } from '../hooks/useGuests';
import { CheckInResult, Guest } from '../types';
import CheckIcon from './icons/CheckIcon';
import WarningIcon from './icons/WarningIcon';
import HomeIcon from './icons/HomeIcon';

interface ControllerViewProps {
  onLogout: () => void;
}

const ControllerView: React.FC<ControllerViewProps> = ({ onLogout }) => {
  const { checkInGuest, guests, events, selectedEventId, selectEvent, isLoading, isOffline, error } = useGuests();
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState('');
  const [manualError, setManualError] = useState('');
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  useEffect(() => {
    if (!isLoading && !initialCheckDone) {
      if (events.length > 1) {
        selectEvent(null);
      } else if (events.length === 1) {
        selectEvent(events[0].id);
      }
      setInitialCheckDone(true);
    }
  }, [isLoading, events, selectEvent, initialCheckDone]);

  const handleScan = useCallback(async (decodedText: string) => {
    if (result) return; // Do not scan if a result is already being shown

    let checkInResult: CheckInResult;
    try {
      const qrData = JSON.parse(decodedText);
      if (qrData.id) {
        const guest = guests.find(g => g.id === qrData.id.toUpperCase().trim());
        if (guest && guest.eventId !== selectedEventId) {
           const guestEvent = events.find(e => e.id === guest.eventId);
           checkInResult = {
               status: 'NOT_FOUND',
               guest: { ...guest, company: `Evento: ${guestEvent?.name || 'Otro'}` } as Guest
           };
        } else {
          checkInResult = await checkInGuest(qrData.id);
        }
      } else {
        checkInResult = { status: 'NOT_FOUND', guest: null };
      }
    } catch (e) {
      console.error("Invalid QR code format", e);
      checkInResult = { status: 'NOT_FOUND', guest: null };
    }
    setResult(checkInResult);
  }, [checkInGuest, guests, selectedEventId, events, result]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    if (!manualId.trim()) {
      setManualError('El ID no puede estar vacío.');
      return;
    }
    
    let checkInResult: CheckInResult;
    const guest = guests.find(g => g.id === manualId.toUpperCase().trim());
    if (guest && guest.eventId !== selectedEventId) {
       const guestEvent = events.find(e => e.id === guest.eventId);
       checkInResult = {
           status: 'NOT_FOUND',
           guest: { ...guest, company: `Evento: ${guestEvent?.name || 'Otro'}` } as Guest
       };
    } else {
      checkInResult = await checkInGuest(manualId);
    }
    
    setResult(checkInResult);
    setManualId('');
    setShowManualInput(false);
  };
  
  const handleScanNext = () => {
      setResult(null);
  };

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <p className="text-xl">Cargando datos desde la nube...</p>
        </div>
    );
  }
  
  if (error && events.length === 0) {
     return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-lg text-center bg-gray-800 p-8 md:p-10 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-red-400 mb-2">Error de Conexión</h2>
                <p className="text-gray-300">No se pudieron cargar los datos iniciales. Comprueba tu conexión a internet.</p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={() => window.location.reload()} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                      Reintentar
                  </button>
                  <button onClick={onLogout} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                      Menú Principal
                  </button>
                </div>
            </div>
        </div>
     );
  }

  if (!selectedEventId) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Control de Acceso</h1>
                <button onClick={onLogout} className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                    <HomeIcon className="w-5 h-5" />
                    <span>Menú Principal</span>
                </button>
            </header>
            <div className="w-full max-w-lg text-center bg-gray-800 p-8 md:p-10 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Seleccionar Evento</h2>
                {events.length > 0 ? (
                    <>
                        <p className="text-gray-400 mb-8">Elige el evento que quieres controlar para continuar.</p>
                        <div className="space-y-3">
                            {events.map(event => (
                                <button
                                    key={event.id}
                                    onClick={() => selectEvent(event.id)}
                                    className="w-full text-center p-4 bg-gray-700 hover:bg-indigo-600 rounded-lg transition-colors duration-200 text-lg font-semibold"
                                >
                                    {event.name}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-gray-400 mt-4">No hay eventos disponibles. Pídele a un organizador que cree uno.</p>
                )}
                 {isOffline && (
                    <p className="text-yellow-400 text-sm mt-6">Modo sin conexión activado.</p>
                )}
            </div>
        </div>
    );
  }

  const renderResultScreen = () => {
    if (!result) return null;

    let bgColor, Icon, title, guestName, guestDetails;

    switch (result.status) {
      case 'SUCCESS':
        bgColor = 'bg-green-600';
        Icon = CheckIcon;
        title = 'Acceso Permitido';
        guestName = result.guest?.name;
        guestDetails = `Nivel ${result.guest?.accessLevel} - ${result.guest?.company}`;
        break;
      case 'ALREADY_CHECKED_IN':
        bgColor = 'bg-yellow-600';
        Icon = WarningIcon;
        title = 'Invitado Ya Admitido';
        guestName = result.guest?.name;
        guestDetails = `Admitido a las ${result.guest?.checkedInAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        break;
      case 'NOT_FOUND':
      default:
        bgColor = 'bg-red-600';
        Icon = WarningIcon;
        title = 'Acceso Denegado';
        guestName = result.guest?.name || 'Invitado no encontrado';
        guestDetails = result.guest?.company || 'Verifica el código o ID.';
        break;
    }

    return (
      <div className={`absolute inset-0 flex flex-col ${bgColor} text-white transition-colors duration-300 z-20`}>
        <main className="flex-grow flex flex-col items-center justify-center text-center p-6">
          <Icon className="w-24 h-24 mb-6" />
          <h2 className="text-4xl font-bold mb-2">{title}</h2>
          {guestName && <p className="text-2xl mt-1">{guestName}</p>}
          {guestDetails && <p className="text-lg opacity-80 mt-1">{guestDetails}</p>}
        </main>
        <footer className="w-full p-4">
          <button
            onClick={handleScanNext}
            className="w-full bg-white text-gray-900 font-bold py-4 px-4 rounded-xl text-lg transition duration-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-current focus:ring-white"
            aria-label="Escanear siguiente invitado"
          >
            Escanear Siguiente
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      <Scanner
        onDecode={handleScan}
        onError={(error: any) => console.error(error?.message)}
        containerStyle={{ width: '100%', height: '100%', paddingTop: 0 }}
        videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      
      <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none"></div>

      <header className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <div>
            <h1 className="text-2xl font-bold text-white shadow-md">Control de Acceso</h1>
            <p className="text-indigo-300 font-semibold shadow-md truncate max-w-xs">{selectedEvent?.name}</p>
        </div>
        <button onClick={onLogout} className="flex items-center space-x-2 bg-gray-700/80 hover:bg-gray-600/80 text-white font-bold py-2 px-4 rounded-md transition duration-300 backdrop-blur-sm flex-shrink-0">
          <HomeIcon className="w-5 h-5" />
          <span>Menú Principal</span>
        </button>
      </header>

      {isOffline && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 bg-yellow-600/90 text-white text-sm font-semibold py-2 px-4 rounded-lg backdrop-blur-sm shadow-lg">
            Modo sin conexión
        </div>
      )}

      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-0 flex justify-center pointer-events-none">
          <div className="w-64 h-64 border-4 border-white/50 rounded-2xl animate-pulse"></div>
      </div>
      
      <div className="absolute inset-x-4 bottom-4 z-10">
        {!showManualInput ? (
          <button
            onClick={() => setShowManualInput(true)}
            className="w-full bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition duration-300 backdrop-blur-sm"
          >
            Introducir ID Manualmente
          </button>
        ) : (
          <form onSubmit={handleManualSubmit} className="bg-gray-800/80 p-4 rounded-xl backdrop-blur-sm">
            <label htmlFor="manual-id" className="block text-sm font-medium text-gray-300 mb-2">
              Introduce el ID del invitado
            </label>
            <div className="flex space-x-2">
              <input
                id="manual-id"
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                placeholder="ABC123"
                className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
              >
                Verificar
              </button>
            </div>
            {manualError && <p className="text-red-400 text-sm mt-2">{manualError}</p>}
            <button
                type="button"
                onClick={() => {
                  setShowManualInput(false);
                  setManualError('');
                }}
                className="w-full text-center text-gray-400 text-sm mt-3 hover:text-white"
            >
                Cancelar
            </button>
          </form>
        )}
      </div>

      {renderResultScreen()}
    </div>
  );
};

export default ControllerView;