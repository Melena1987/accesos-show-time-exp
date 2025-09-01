import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  // Rastrea si la carga inicial de datos está completa para evitar sobrescribir el estado existente con un estado vacío.
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Función para persistir el estado actual en el almacén remoto
  const saveData = useCallback(async (currentEvents: Event[], currentGuests: Guest[]) => {
    // Evita guardar hasta que se hayan cargado los datos iniciales.
    if (!isDataLoaded) return;
    try {
      // npoint.io usa POST para actualizar el contenedor JSON
      await fetch(DATA_STORAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: currentEvents, guests: currentGuests }),
      });
    } catch (error) {
      console.error("Fallo al guardar datos en el almacén remoto:", error);
    }
  }, [isDataLoaded]);

  // Efecto para cargar datos del almacén remoto y configurar el sondeo para actualizaciones en tiempo real
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const response = await fetch(DATA_STORAGE_URL, { cache: 'no-store' });
        if (!response.ok || !isMounted) return;
        
        const storedData = await response.json();

        // Validación básica de datos
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
        console.error("Fallo al cargar o analizar datos del almacén remoto.", error);
      } finally {
        if (isMounted) {
            setIsDataLoaded(true);
        }
      }
    };
    
    loadData(); // Carga inicial
    const intervalId = setInterval(loadData, 5000); // Sondea para actualizaciones cada 5 segundos

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
  }, []);

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

  const addEvent = useCallback((name: string) => {
    const newEvent: Event = {
      id: `evt_${new Date().getTime()}`,
      name,
    };
    setEvents(prevEvents => {
        const updatedEvents = [...prevEvents, newEvent];
        saveData(updatedEvents, guests);
        return updatedEvents;
    });
    setSelectedEventId(newEvent.id);
  }, [guests, saveData]);

  const selectEvent = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId);
  }, []);

  const addGuest = useCallback((name: string, company: string, accessLevel: AccessLevel, eventId: string, invitedBy: string) => {
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
      const updatedGuests = [...prevGuests, newGuest];
      saveData(events, updatedGuests);
      return updatedGuests;
    });
  }, [events, saveData]);

  const checkInGuest = useCallback((guestId: string): CheckInResult => {
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
    saveData(events, updatedGuests);
    
    return { status: 'SUCCESS', guest: updatedGuest };
}, [guests, events, saveData]);

  return (
    <GuestContext.Provider value={{ events, guests, selectedEventId, addEvent, selectEvent, addGuest, checkInGuest }}>
      {children}
    </GuestContext.Provider>
  );
};
