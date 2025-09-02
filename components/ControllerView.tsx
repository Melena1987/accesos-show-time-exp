import React, { useState, useEffect, useRef } from 'react';
// FIX: Import IDetectedBarcode to match the type expected by the onScan prop.
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { useGuests } from '../hooks/useGuests';
import { CheckInResult, Guest } from '../types';
import CheckIcon from './icons/CheckIcon';
import WarningIcon from './icons/WarningIcon';
import HomeIcon from './icons/HomeIcon';
import { auth } from '../firebase';

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
  const isProcessing = useRef(false);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  
  const handleFirebaseLogout = async () => {
    await auth.signOut();
    onLogout();
  };

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

  // FIX: Update handleScan to accept an array of detected codes to match the onScan prop signature.
  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (isProcessing.current || detectedCodes.length === 0) return;
    isProcessing.current = true;

    const decodedText = detectedCodes[0].rawValue;

    let guestId: string | null = null;
    try {
      // Intenta parsear como JSON para extraer el ID.
      const qrData = JSON.parse(decodedText);
      if (qrData && qrData.id) {
        guestId = qrData.id;
      }
    } catch (e) {
      // Si falla, asume que el texto decodificado es el propio ID.
      guestId = decodedText;
    }
    
    let checkInResult: CheckInResult;

    if (guestId && typeof guestId === 'string' && guestId.trim()) {
      const guest = guests.find(g => g.id === guestId.toUpperCase().trim());
      if (guest && guest.eventId !== selectedEventId) {
         const guestEvent = events.find(e => e.id === guest.eventId);
         checkInResult = {
             status: 'NOT_FOUND',
             guest: { ...guest, company: `Evento: ${guestEvent?.name || 'Otro'}` } as Guest
         };
      } else {
        checkInResult = await checkInGuest(guestId);
      }
    } else {
      console.error("Invalid QR code format", decodedText);
      checkInResult = { status: 'NOT_FOUND', guest: null };
    }

    setResult(checkInResult);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing.current) return;
    isProcessing.current = true;

    setManualError('');
    if (!manualId.trim()) {
      setManualError('El ID no puede estar vacío.');
      isProcessing.current = false;
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
      isProcessing.current = false;
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
                  <button onClick={handleFirebaseLogout} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
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
                <button onClick={handleFirebaseLogout} className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-300">
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

    const accessLevelStyles: { [key: number]: { bg: string, text: string } } = {
      1: { bg: 'bg-yellow-500', text: 'text-gray-900' },
      2: { bg: 'bg-sky-500', text: 'text-white' },
      3: { bg: 'bg-orange-500', text: 'text-white' }
    };
    
    const accessLevel = result.guest?.accessLevel;
    const currentStyle = accessLevel ? accessLevelStyles[accessLevel] : null;

    switch (result.status) {
      case 'SUCCESS':
        bgColor = 'bg-green-600';
        Icon = CheckIcon;
        title = 'Acceso Permitido';
        guestName = result.guest?.name;
        guestDetails = result.guest?.company;
        break;
      case 'ALREADY_CHECKED_IN':
        bgColor = 'bg-yellow-600';
        Icon = WarningIcon;
        title = 'Invitado Ya Admitido';
        guestName = result.guest?.name;
        guestDetails = `${result.guest?.company} - Admitido a las ${result.guest?.checkedInAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        break;
      case 'NOT_FOUND':
        bgColor = 'bg-red-600';
        Icon = WarningIcon;
        title = 'Acceso Denegado';
        guestName = result.guest?.name || 'Invitado no encontrado';
        guestDetails = result.guest?.company || 'Este código no es válido para este evento.';
        break;
      default:
        return null;
    }

    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 text-white text-center ${bgColor}`}>
        <div className="w-32 h-32 mb-6">
          <Icon className="w-full h-full" />
        </div>
        <h2 className="text-4xl font-bold mb-2">{title}</h2>
        <p className="text-3xl font-semibold">{guestName}</p>
        
        {result.guest && (result.status === 'SUCCESS' || result.status === 'ALREADY_CHECKED_IN') && currentStyle && (
            <div className={`my-4 px-4 py-1 inline-block text-lg font-semibold rounded-full ${currentStyle.bg} ${currentStyle.text}`}>
                NIVEL DE ACCESO {accessLevel}
            </div>
        )}

        <p className="text-xl opacity-80">{guestDetails}</p>
        <button
          onClick={handleScanNext}
          className="mt-12 bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
        >
          Escanear Siguiente
        </button>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-black/50 z-10">
        <div>
          <h1 className="text-2xl font-bold">Control de Acceso</h1>
          <p className="text-gray-400 truncate max-w-[calc(100vw-220px)]">Evento: {selectedEvent?.name}</p>
        </div>
        <button onClick={handleFirebaseLogout} className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-300">
            <HomeIcon className="w-5 h-5" />
            <span>Menú</span>
        </button>
      </header>

      <main className="w-full h-screen flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 overflow-hidden">
          <Scanner
            // FIX: The 'onDecode' prop is not valid for this component. Replaced with 'onScan' which is the correct prop for this library version to handle scan results.
            onScan={handleScan}
            onError={(error: any) => console.log(error?.message)}
            // FIX: Replaced deprecated props `containerStyle` and `videoStyle` with the `styles` prop to align with the updated QR scanner library API.
            styles={{
              container: { width: '100%', height: '100%', paddingTop: 0 },
              video: { width: '100%', height: '100%', objectFit: 'cover' },
            }}
            paused={!!result}
          />
        </div>
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 text-center p-4">
          <h2 className="text-2xl font-bold">Escanear Código QR</h2>
          <p className="text-gray-300">Apunta la cámara al código de la invitación.</p>
           {isOffline && (
              <div className="mt-4 bg-yellow-800/80 border border-yellow-600 text-white px-4 py-2 rounded-lg" role="status">
                  <span className="font-semibold">Modo sin conexión</span>
              </div>
          )}
        </div>
        <div className="absolute z-10 bottom-8 text-center">
            <button 
                onClick={() => setShowManualInput(true)}
                className="bg-indigo-600/80 backdrop-blur-sm hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
                Introducir ID Manualmente
            </button>
        </div>
      </main>

       {showManualInput && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Introducir ID de Invitado</h3>
            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value.toUpperCase())}
                placeholder="Ej: A1B2C3"
                autoFocus
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {manualError && <p className="text-red-400 text-sm mt-2">{manualError}</p>}
              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                      setShowManualInput(false);
                      setManualError('');
                      setManualId('');
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                  Verificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renderResultScreen()}
    </div>
  );
};

export default ControllerView;
