import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Guest, AccessLevel, CheckInResult, Event } from '../types';

interface GuestContextType {
  events: Event[];
  guests: Guest[];
  selectedEventId: string | null;
  addEvent: (name: string) => void;
  selectEvent: (eventId: string | null) => void;
  addGuest: (name: string, company: string, accessLevel: AccessLevel, eventId: string, invitedBy: string) => void;
  checkInGuest: (guestId: string) => CheckInResult;
}

export const GuestContext = createContext<GuestContextType | undefined>(undefined);

// IMPORTANTE: La aplicación ahora usa un almacén de datos público y compartido para sincronizarse entre dispositivos.
// Los datos son de acceso público en la URL de abajo. No almacenes información sensible.
// La persistencia y disponibilidad de los datos dependen del servicio npoint.io.
const DATA_STORAGE_URL = 'https://api.npoint.io/4a34241e17d7a79b88a9';


export const GuestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  // Este indicador es crucial. Evita que la aplicación sobrescriba el estado remoto
  // con su estado inicial vacío antes de que se hayan cargado los datos remotos.
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Efecto para cargar datos del almacén remoto y sondear actualizaciones.
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch(DATA_STORAGE_URL, { cache: 'no-store' });
        if (!response.ok || !isMounted) return;
        
        const storedData = await response.json();

        if (storedData && typeof storedData === 'object') {
            const { events: storedEvents, guests: storedGuests } = storedData;
            
            const parsedGuests = Array.isArray(storedGuests)
              ? storedGuests.map((g: any) => ({
                  ...g,
                  checkedInAt: g.checkedInAt ? new Date(g.checkedInAt) : null,
                }))
              : [];
            
            setEvents(Array.isArray(storedEvents) ? storedEvents : []);
            setGuests(parsedGuests);

            // Marcar la carga inicial como completa SÓLO después de una carga y análisis exitosos.
            if (!isInitialLoadComplete) {
                setIsInitialLoadComplete(true);
            }
        }
      } catch (error) {
        console.error("Fallo al cargar o analizar datos del almacén remoto. Se reintentará.", error);
        // No establecer isInitialLoadComplete como true en caso de error.
      }
    };
    
    loadData(); // Carga inicial
    const intervalId = setInterval(loadData, 5000); // Sondear actualizaciones cada 5 segundos

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
  // Ejecutamos este efecto solo una vez. `isInitialLoadComplete` se omite intencionadamente
  // del array de dependencias para evitar re-configurar el intervalo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para guardar los datos en el almacén remoto cada vez que cambian.
  useEffect(() => {
    // Guardar datos solo después de que la carga inicial se haya completado.
    if (!isInitialLoadComplete) {
      return;
    }

    const saveData = async () => {
      try {
        await fetch(DATA_STORAGE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events, guests }),
        });
      } catch (error) {
        console.error("Fallo al guardar datos en el almacén remoto:", error);
      }
    };

    saveData();
  }, [events, guests, isInitialLoadComplete]);

  const generateShortId = (existingIds: string[]): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id;
    do {
      id = '';
      for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (existingIds.includes(id));
    return id;
  };

  const addEvent = (name: string) => {
    const newEvent: Event = {
      id: `evt_${new Date().getTime()}`,
      name,
    };
    setEvents(prevEvents => [...prevEvents, newEvent]);
    setSelectedEventId(newEvent.id);
  };

  const selectEvent = (eventId: string | null) => {
    setSelectedEventId(eventId);
  };

  const addGuest = (name: string, company: string, accessLevel: AccessLevel, eventId: string, invitedBy: string) => {
    setGuests(prevGuests => {
      const newGuest: Guest = {
        id: generateShortId(prevGuests.map(g => g.id)),
        eventId,
        name,
        company,
        accessLevel,
        checkedInAt: null,
        invitedBy,
      };
      return [...prevGuests, newGuest];
    });
  };

  const checkInGuest = (guestId: string): CheckInResult => {
    const normalizedGuestId = guestId.toUpperCase().trim();
    let result: CheckInResult | null = null;
    
    setGuests(currentGuests => {
        const guestIndex = currentGuests.findIndex(g => g.id === normalizedGuestId);

        if (guestIndex === -1) {
            result = { status: 'NOT_FOUND', guest: null };
            return currentGuests;
        }

        const guest = currentGuests[guestIndex];

        if (guest.checkedInAt) {
            result = { status: 'ALREADY_CHECKED_IN', guest };
            return currentGuests;
        }

        const updatedGuests = [...currentGuests];
        const updatedGuest = { ...guest, checkedInAt: new Date() };
        updatedGuests[guestIndex] = updatedGuest;
        
        result = { status: 'SUCCESS', guest: updatedGuest };
        return updatedGuests;
    });

    // La actualización de estado es asíncrona, pero la función debe devolver un resultado.
    // Capturamos el resultado dentro del actualizador y lo devolvemos.
    // La llamada a `setGuests` activará el efecto de guardado.
    return result!;
  };


  return (
    <GuestContext.Provider value={{ events, guests, selectedEventId, addEvent, selectEvent, addGuest, checkInGuest }}>
      {children}
    </GuestContext.Provider>
  );
};
