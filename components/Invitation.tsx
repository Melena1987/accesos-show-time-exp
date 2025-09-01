
import React from 'react';
// FIX: The 'qrcode.react' library does not have a named export 'QRCode'. Changed the import to use 'QRCodeCanvas' and aliased it as 'QRCode' to match its usage in the component.
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { Guest } from '../types';

interface InvitationProps {
  guest: Guest;
  eventName: string;
}

const Invitation: React.ForwardRefRenderFunction<HTMLDivElement, InvitationProps> = ({ guest, eventName }, ref) => {
  const qrValue = JSON.stringify({ id: guest.id });
  
  const accessLevelStyles = {
    1: { bg: 'bg-yellow-500', text: 'text-gray-900' },
    2: { bg: 'bg-sky-500', text: 'text-white' },
    3: { bg: 'bg-orange-500', text: 'text-white' }
  };

  const currentStyle = accessLevelStyles[guest.accessLevel] || accessLevelStyles[1];

  return (
    <div ref={ref} className="w-[350px] h-[600px] bg-gray-800 rounded-2xl shadow-2xl p-6 flex flex-col justify-between text-white font-sans border border-gray-700">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-wider text-indigo-400">SHOW TIME</h1>
        <p className="text-sm text-gray-400">INVITACIÓN VIP</p>
        <h2 className="text-xl font-semibold text-gray-200 mt-2 truncate">{eventName}</h2>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-300 text-lg">INVITADO</p>
        <h2 className="text-4xl font-bold text-center">{guest.name}</h2>
        <p className="text-gray-400 text-lg">{guest.company}</p>
        <div className={`mt-2 px-3 py-1 text-sm font-semibold rounded-full ${currentStyle.bg} ${currentStyle.text}`}>
          NIVEL DE ACCESO {guest.accessLevel}
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <div className="bg-white p-4 rounded-lg flex justify-center">
          <QRCode
            value={qrValue}
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>
        <div className="text-center">
          <p className="text-lg font-mono tracking-widest text-gray-300 pt-1">{guest.id}</p>
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">Presenta este QR o proporciona el ID en la entrada.</p>
        <p className="text-xs text-gray-500">Esta invitación es intransferible.</p>
      </div>
    </div>
  );
};

export default React.forwardRef(Invitation);