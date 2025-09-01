import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Guest, AccessLevel, CheckInResult, Event } from '../types';

interface GuestContextType {
  events: Event[];
  guests: Guest[];
  selectedEventId: string | null;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para cargar los datos iniciales del almacén remoto.
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(DATA_STORAGE_URL, { cache: 'no-store' });
        if (!response.ok) return;
        
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
        console.error("Fallo al cargar datos del almacén remoto. Se continuará con el estado vacío.", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Efecto para persistir los datos en el almacén remoto CADA VEZ que cambien.
  // Este efecto solo se ejecuta después de que la carga inicial haya terminado (isLoading es false).
  useEffect(() => {
    if (isLoading) {
      return; // No guardar nada mientras se cargan los datos iniciales.
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
  }, [events, guests, isLoading]);

  // Efecto para persistir el evento seleccionado en localStorage.
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

  const checkInGuest = (guestId: string): CheckInResult => {
    const normalizedGuestId = guestId.toUpperCase().trim();
    const guest = guests.find(g => g.id === normalizedGuestId);

    if (!guest) {
        return { status: 'NOT_FOUND', guest: null };
    }

    if (guest.checkedInAt) {
        return { status: 'ALREADY_CHECKED_IN', guest };
    }

    const updatedGuest = { ...guest, checkedInAt: new Date() };
    
    setGuests(currentGuests => {
      const guestIndex = currentGuests.findIndex(g => g.id === normalizedGuestId);
      if (guestIndex === -1) return currentGuests; // No debería ocurrir
      const updatedGuests = [...currentGuests];
      updatedGuests[guestIndex] = updatedGuest;
      return updatedGuests;
    });

    return { status: 'SUCCESS', guest: updatedGuest };
  };


  return (
    <GuestContext.Provider value={{ events, guests, selectedEventId, isLoading, addEvent, selectEvent, addGuest, checkInGuest }}>
      {children}
    </GuestContext.Provider>
  );
};