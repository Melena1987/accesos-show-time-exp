import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useGuests } from '../hooks/useGuests';
import { CheckInResult, Guest } from '../types';
import CheckIcon from './icons/CheckIcon';
import WarningIcon from './icons/WarningIcon';

interface ControllerViewProps {
  onLogout: () => void;
}

const ControllerView: React.FC<ControllerViewProps> = ({ onLogout }) => {
  const { checkInGuest, guests, events, selectedEventId, selectEvent } = useGuests();
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState('');
  const [manualError, setManualError] = useState('');
  const resultTimeoutRef = useRef<number | null>(null);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
    };
  }, []);

  const handleScan = useCallback((decodedText: string | null, error: unknown | null) => {
    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
    }

    if (decodedText) {
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
            checkInResult = checkInGuest(qrData.id);
          }
        } else {
          checkInResult = { status: 'NOT_FOUND', guest: null };
        }
      } catch (e) {
        console.error("Invalid QR code format", e);
        checkInResult = { status: 'NOT_FOUND', guest: null };
      }
      setResult(checkInResult);
      resultTimeoutRef.current = window.setTimeout(clearResult, 5000);
    }
    
    if (error) {
      // Don't show an error for normal scanning operation, only log it.
      if (error instanceof Error) {
        console.info(error.message);
      }
    }
  }, [checkInGuest, clearResult, guests, selectedEventId, events]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    if (!manualId.trim()) {
      setManualError('El ID no puede estar vacío.');
      return;
    }

    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
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
      checkInResult = checkInGuest(manualId);
    }
    
    setResult(checkInResult);
    setManualId('');
    setShowManualInput(false);
    resultTimeoutRef.current = window.setTimeout(clearResult, 5000);
  };
  
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const renderResult = () => {
    if (!result) return null;

    let bgColor, Icon, title, guestName, guestDetails;

    switch (result.status) {
      case 'SUCCESS':
        bgColor = 'bg-green-500/90';
        Icon = CheckIcon;
        title = 'Acceso Permitido';
        guestName = result.guest?.name;
        guestDetails = `Nivel ${result.guest?.accessLevel} - ${result.guest?.company}`;
        break;
      case 'ALREADY_CHECKED_IN':
        bgColor = 'bg-yellow-500/90';
        Icon = WarningIcon;
        title = 'Invitado Ya Admitido';
        guestName = result.guest?.name;
        guestDetails = `Admitido a las ${result.guest?.checkedInAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        break;
      case 'NOT_FOUND':
      default:
        bgColor = 'bg-red-500/90';
        Icon = WarningIcon;
        title = 'Acceso Denegado';
        guestName = result.guest?.name || 'Invitado no encontrado';
        guestDetails = result.guest?.company || 'Verifica el código o ID.';
        break;
    }

    return (
      <div 
        className={`fixed inset-x-4 bottom-24 z-20 flex justify-center transition-transform duration-300 ${result ? 'scale-100' : 'scale-95'}`}
        onClick={clearResult}
        aria-live="polite"
      >
        <div className={`${bgColor} text-white rounded-xl shadow-2xl p-6 w-full max-w-sm flex items-start space-x-4`}>
          <div className="flex-shrink-0 pt-1">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            {guestName && <p className="text-lg mt-1">{guestName}</p>}
            {guestDetails && <p className="text-sm opacity-80">{guestDetails}</p>}
          </div>
        </div>
      </div>
    );
  };
  
  if (!selectedEventId) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Control de Acceso</h1>
                <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 font-bold py-2 px-4 rounded-md transition duration-300">
                    Salir
                </button>
            </header>
            <div className="text-center bg-gray-800 p-10 rounded-lg max-w-lg w-full">
                <h2 className="text-xl font-semibold text-gray-300 mb-4">Selecciona un Evento</h2>
                {events.length > 0 ? (
                    <select
                        value={selectedEventId || ''}
                        onChange={(e) => selectEvent(e.target.value || null)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">-- Elige un evento --</option>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>
                ) : (
                    <p className="text-gray-400 mt-2">No hay eventos disponibles. Pídele a un organizador que cree uno.</p>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* FIX: The 'onResult' prop is not available in the installed version of the scanner library. Switched to 'onDecode' which is supported and passes the decoded text as a string to resolve the TypeScript error. */}
      <Scanner
        onDecode={(result) => handleScan(result, null)}
        onError={(error) => handleScan(null, error)}
        containerStyle={{ width: '100%', height: '100%', paddingTop: 0 }}
        videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      
      <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none"></div>

      <header className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <div>
            <h1 className="text-2xl font-bold text-white shadow-md">Control de Acceso</h1>
            <p className="text-indigo-300 font-semibold shadow-md truncate max-w-xs">{selectedEvent?.name}</p>
        </div>
        <button onClick={onLogout} className="bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 backdrop-blur-sm flex-shrink-0">
          Salir
        </button>
      </header>

      {renderResult()}

      {!result && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-0 flex justify-center pointer-events-none">
          <div className="w-64 h-64 border-4 border-white/50 rounded-2xl animate-pulse"></div>
        </div>
      )}

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
                onClick={() => setShowManualInput(false)}
                className="w-full text-center text-gray-400 text-sm mt-3 hover:text-white"
            >
                Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ControllerView;