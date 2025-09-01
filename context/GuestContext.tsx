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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
    return localStorage.getItem('selectedEventId');
  });
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
        }
      } catch (error) {
        console.error("Fallo al cargar o analizar datos del almacén remoto. Se reintentará.", error);
      } finally {
        if (isMounted) {
            setIsInitialLoadComplete(true);
        }
      }
    };
    
    loadData(); // Carga inicial
    const intervalId = setInterval(loadData, 5000); // Sondear actualizaciones cada 5 segundos

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
  }, []);
  
  // Efecto para persistir el evento seleccionado en localStorage.
  useEffect(() => {
    if (selectedEventId) {
      localStorage.setItem('selectedEventId', selectedEventId);
    } else {
      localStorage.removeItem('selectedEventId');
    }
  }, [selectedEventId]);

  const saveData = async (updatedEvents: Event[], updatedGuests: Guest[]) => {
    if (!isInitialLoadComplete) {
      // Previene el guardado antes de que la carga inicial se complete para evitar sobrescribir.
      console.warn("Se impidió el guardado porque la carga inicial no está completa.");
      return;
    }
    try {
      await fetch(DATA_STORAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: updatedEvents, guests: updatedGuests }),
      });
    } catch (error) {
      console.error("Fallo al guardar datos en el almacén remoto:", error);
    }
  };

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
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    setSelectedEventId(newEvent.id);
    saveData(updatedEvents, guests); // Guardado inmediato
  };

  const selectEvent = (eventId: string | null) => {
    setSelectedEventId(eventId);
  };

  const addGuest = (name: string, company: string, accessLevel: AccessLevel, eventId: string, invitedBy: string) => {
    const newGuest: Guest = {
      id: generateShortId(guests.map(g => g.id)),
      eventId,
      name,
      company,
      accessLevel,
      checkedInAt: null,
      invitedBy,
    };
    const updatedGuests = [...guests, newGuest];
    setGuests(updatedGuests);
    saveData(events, updatedGuests); // Guardado inmediato
  };

  const checkInGuest = (guestId: string): CheckInResult => {
    const normalizedGuestId = guestId.toUpperCase().trim();
    const guestIndex = guests.findIndex(g => g.id === normalizedGuestId);

    if (guestIndex === -1) {
        return { status: 'NOT_FOUND', guest: null };
    }

    const guest = guests[guestIndex];

    if (guest.checkedInAt) {
        return { status: 'ALREADY_CHECKED_IN', guest };
    }

    const updatedGuests = [...guests];
    const updatedGuest = { ...guest, checkedInAt: new Date() };
    updatedGuests[guestIndex] = updatedGuest;
    
    setGuests(updatedGuests);
    saveData(events, updatedGuests); // Guardado inmediato

    return { status: 'SUCCESS', guest: updatedGuest };
  };


  return (
    <GuestContext.Provider value={{ events, guests, selectedEventId, addEvent, selectEvent, addGuest, checkInGuest }}>
      {children}
    </GuestContext.Provider>
  );
};