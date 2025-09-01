import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Guest, AccessLevel, CheckInResult, Event } from '../types';

interface GuestContextType {
  events: Event[];
  guests: Guest[];
  selectedEventId: string | null;
  isLoading: boolean;
  error: string | null;
  addEvent: (name: string) => void;
  selectEvent: (eventId: string | null) => void;
  deleteEvent: (eventId: string) => void;
  addGuest: (name: string, company: string, accessLevel: AccessLevel, eventId: string, invitedBy: string) => void;
  deleteGuest: (guestId: string) => void;
  checkInGuest: (guestId: string) => CheckInResult;
  clearError: () => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const clearError = () => setError(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(DATA_STORAGE_URL, { cache: 'no-store' });
        if (response.ok) {
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
            hasLoaded.current = true;
        } else {
            throw new Error(`Error al cargar los datos: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Fallo al cargar datos del almacén remoto.", err);
        setError("No se pudieron cargar los datos. Comprueba tu conexión e inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }

    const saveData = async () => {
      // No guardar si el estado es el inicial vacío, podría ser por un error de carga
      if (events.length === 0 && guests.length === 0 && !localStorage.getItem('showtime_has_data')) {
         return;
      }
      localStorage.setItem('showtime_has_data', 'true');

      try {
        const response = await fetch(DATA_STORAGE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events, guests }),
        });
        if (!response.ok) {
            throw new Error(`Error al guardar los datos: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Fallo al guardar datos en el almacén remoto:", err);
        setError("El último cambio no se pudo guardar. Comprueba tu conexión.");
      }
    };

    saveData();
  }, [events, guests]);

  useEffect(() => {
    if (selectedEventId) {
      localStorage.setItem('selectedEventId', selectedEventId);
    } else {
      localStorage.removeItem('selectedEventId');
    }
  }, [selectedEventId]);

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
    setEvents(currentEvents => [...currentEvents, newEvent]);
    setSelectedEventId(newEvent.id);
  };

  const selectEvent = (eventId: string | null) => {
    setSelectedEventId(eventId);
  };

  const deleteEvent = (eventId: string) => {
    setEvents(currentEvents => currentEvents.filter(e => e.id !== eventId));
    setGuests(currentGuests => currentGuests.filter(g => g.eventId !== eventId));
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
    }
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
    setGuests(currentGuests => [...currentGuests, newGuest]);
  };

  const deleteGuest = (guestId: string) => {
    setGuests(currentGuests => currentGuests.filter(g => g.id !== guestId));
  };

  const checkInGuest = (guestId: string): CheckInResult => {
    const normalizedGuestId = guestId.toUpperCase().trim();
    let guestToUpdate: Guest | undefined;
    
    setGuests(currentGuests => {
        const guestIndex = currentGuests.findIndex(g => g.id === normalizedGuestId);
        if (guestIndex === -1) {
            guestToUpdate = undefined;
            return currentGuests;
        }

        const guest = currentGuests[guestIndex];
        if (guest.checkedInAt) {
            guestToUpdate = guest;
            return currentGuests; 
        }

        guestToUpdate = { ...guest, checkedInAt: new Date() };
        const updatedGuests = [...currentGuests];
        updatedGuests[guestIndex] = guestToUpdate;
        return updatedGuests;
    });

    if (!guestToUpdate) {
        return { status: 'NOT_FOUND', guest: null };
    }
    if (guestToUpdate.checkedInAt && (new Date().getTime() - new Date(guestToUpdate.checkedInAt).getTime()) > 1000) {
        return { status: 'ALREADY_CHECKED_IN', guest: guestToUpdate };
    }
    return { status: 'SUCCESS', guest: guestToUpdate };
  };


  return (
    <GuestContext.Provider value={{ events, guests, selectedEventId, isLoading, error, addEvent, selectEvent, deleteEvent, addGuest, deleteGuest, checkInGuest, clearError }}>
      {children}
    </GuestContext.Provider>
  );
};
