
import React, { useState, useCallback, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import { useGuests } from '../hooks/useGuests';
import { CheckInResult } from '../types';
import CheckIcon from './icons/CheckIcon';
import WarningIcon from './icons/WarningIcon';

interface ControllerViewProps {
  onLogout: () => void;
}

const ScanResultModal: React.FC<{ result: CheckInResult; onClose: () => void }> = ({ result, onClose }) => {
  if (!result.guest) {
    return (
       <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-red-800 text-white p-8 rounded-lg shadow-xl text-center max-w-sm mx-4">
          <WarningIcon className="w-16 h-16 mx-auto text-red-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error de Verificación</h2>
          <p className="text-red-200">Invitado no encontrado.</p>
        </div>
      </div>
    );
  }

  const { status, guest } = result;
  const isSuccess = status === 'SUCCESS';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className={`text-white p-8 rounded-2xl shadow-xl text-center max-w-sm mx-4 border-4 ${isSuccess ? 'bg-green-600 border-green-400' : 'bg-yellow-600 border-yellow-400'}`}>
        {isSuccess ? 
          <CheckIcon className="w-20 h-20 mx-auto text-white mb-4" /> : 
          <WarningIcon className="w-20 h-20 mx-auto text-white mb-4" />}
        <h2 className="text-3xl font-bold mb-2">{isSuccess ? 'Acceso Permitido' : 'Ya Admitido'}</h2>
        
        <div className="bg-black bg-opacity-20 p-4 rounded-lg mt-6 text-left space-y-2">
            <p><span className="font-semibold">Nombre:</span> {guest.name}</p>
            <p><span className="font-semibold">Empresa:</span> {guest.company}</p>
            <p><span className="font-semibold">Nivel de Acceso:</span> {guest.accessLevel}</p>
            {guest.checkedInAt && <p><span className="font-semibold">Hora de Admisión:</span> {new Date(guest.checkedInAt).toLocaleTimeString()}</p>}
        </div>

      </div>
    </div>
  );
};

const ControllerView: React.FC<ControllerViewProps> = ({ onLogout }) => {
  const { checkInGuest } = useGuests();
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const isScanningRef = useRef(true);
  const [viewMode, setViewMode] = useState<'selection' | 'scan' | 'manual'>('selection');
  const [manualId, setManualId] = useState('');

  const handleScan = useCallback((data: any, error: any) => {
    if (!!data && isScanningRef.current) {
      isScanningRef.current = false;
      try {
        const parsed = JSON.parse(data.text);
        if (parsed.id) {
          const result = checkInGuest(parsed.id);
          setScanResult(result);
        } else {
            setScanResult({ status: 'NOT_FOUND', guest: null });
        }
      } catch (e) {
        setScanResult({ status: 'NOT_FOUND', guest: null });
        console.error("Invalid QR code format", e);
      }
    }
  }, [checkInGuest]);

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      if (manualId.trim()) {
          const result = checkInGuest(manualId.trim());
          setScanResult(result);
          setManualId('');
      }
  }, [manualId, checkInGuest]);

  const closeModal = useCallback(() => {
    setScanResult(null);
    setViewMode('selection');
    setTimeout(() => { isScanningRef.current = true }, 300);
  }, []);
  
  const renderContent = () => {
    switch (viewMode) {
      case 'scan':
        return (
            <>
                <div className="w-full aspect-square">
                    <div className="border-4 border-dashed border-gray-600 rounded-2xl overflow-hidden w-full h-full">
                        <QrReader
                            onResult={handleScan}
                            constraints={{ facingMode: 'environment' }}
                            videoContainerStyle={{ width: '100%', height: '100%', paddingTop: 0 }}
                            videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </div>
                 <p className="absolute bottom-0 left-0 right-0 p-8 text-center text-gray-300 bg-black bg-opacity-50">
                    Apunta la cámara al código QR de un invitado
                </p>
                <button 
                    onClick={() => setViewMode('selection')}
                    className="absolute bottom-24 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 z-10"
                >
                    Cambiar Método
                </button>
            </>
        );
      case 'manual':
        return (
            <>
                <div className="w-full aspect-square flex flex-col items-center justify-center bg-gray-900 border-4 border-dashed border-gray-600 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-6 text-center">Entrada Manual de Invitado</h2>
                    <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-4">
                        <div>
                            <label htmlFor="guestId" className="block text-sm font-medium text-gray-400 mb-1">
                                ID del Invitado
                            </label>
                            <input
                                id="guestId"
                                type="text"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value.toUpperCase())}
                                placeholder="Ej: A4B1C2"
                                maxLength={6}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
                        >
                            Verificar Invitado
                        </button>
                    </form>
                </div>
                <button 
                    onClick={() => setViewMode('selection')}
                    className="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                >
                    Cambiar Método
                </button>
            </>
        );
      case 'selection':
      default:
        return (
            <div className="w-full aspect-square flex flex-col items-center justify-center bg-gray-900 border-4 border-dashed border-gray-600 rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-bold mb-8">Elige un Método de Verificación</h2>
                <div className="space-y-4 w-full max-w-xs">
                    <button 
                        onClick={() => setViewMode('scan')}
                        className="w-full px-6 py-4 rounded-md font-semibold transition-colors bg-indigo-600 text-white hover:bg-indigo-700 text-lg"
                    >
                        Escanear QR
                    </button>
                    <button 
                        onClick={() => setViewMode('manual')}
                        className="w-full px-6 py-4 rounded-md font-semibold transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 text-lg"
                    >
                        Entrada Manual
                    </button>
                </div>
            </div>
        )
    }
  }


  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-black bg-opacity-50">
          <h1 className="text-xl font-bold">Acceso Controlador</h1>
          <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
              Cerrar Sesión
          </button>
      </header>
      
      <main className="w-full max-w-lg flex flex-col items-center justify-center flex-grow">
        {renderContent()}
      </main>

      {scanResult && <ScanResultModal result={scanResult} onClose={closeModal} />}
    </div>
  );
};

export default ControllerView;
