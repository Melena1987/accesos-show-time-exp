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

// IMPORTANTE: La aplicación ahora usa un almacén de datos público y compartido (npoint.io)
// para demostrar la sincronización entre dispositivos. Este servicio puede no ser siempre fiable.
// Para mejorar la robustez, la aplicación guarda una copia local de tus datos en tu navegador.
// Si el servicio en la nube falla, seguirás teniendo acceso a tus datos guardados localmente.
// Para una solución de producción, se recomienda usar un servicio de base de datos más robusto como Google Firebase.
const DATA_STORAGE_URL = 'https://api.npoint.io/4a34241e17d7a79b88a9';
const LOCAL_STORAGE_KEY = 'showtime-guest-data';


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

  const parseAndSetData = (data: any) => {
    const { events: storedEvents, guests: storedGuests } = data || {};
                
    const parsedGuests = Array.isArray(storedGuests)
      ? storedGuests.map((g: any) => ({
          ...g,
          checkedInAt: g.checkedInAt ? new Date(g.checkedInAt) : null,
        }))
      : [];
    
    setEvents(Array.isArray(storedEvents) ? storedEvents : []);
    setGuests(parsedGuests);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(DATA_STORAGE_URL, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.statusText}`);
        }
        const remoteData = await response.json();
        if (remoteData && typeof remoteData === 'object' && (remoteData.events || remoteData.guests)) {
            parseAndSetData(remoteData);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteData));
        } else {
            throw new Error('Los datos remotos están vacíos o no son válidos.');
        }
      } catch (err) {
        console.warn("Fallo al cargar datos remotos. Intentando cargar desde el almacenamiento local.", err);
        setError("No se pudo conectar al servidor. Mostrando datos locales.");
        try {
          const localDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localDataString) {
            parseAndSetData(JSON.parse(localDataString));
          }
        } catch (localErr) {
          console.error("Fallo al cargar datos del almacenamiento local.", localErr);
          setError("Error crítico: No se pudieron cargar los datos remotos ni locales.");
        }
      } finally {
        setIsLoading(false);
        hasLoaded.current = true;
      }
    };
    
    loadData();
  }, []);
  
  useEffect(() => {
    if (!hasLoaded.current || isLoading) {
      return;
    }

    const dataToSave = { events, guests };
    
    // 1. Save locally immediately to prevent data loss
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));

    // 2. Attempt to sync with remote storage (debounced)
    const timerId = setTimeout(async () => {
      try {
        const response = await fetch(DATA_STORAGE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSave),
        });
        if (!response.ok) {
            throw new Error(`Error al guardar los datos: ${response.statusText}`);
        }
         // On successful sync, if the error was a sync error, clear it.
        if (error?.includes("sincronizar")) {
             clearError();
        }
      } catch (err) {
        console.error("Fallo al sincronizar datos con el almacén remoto:", err);
        setError("El último cambio no se pudo sincronizar. Tus datos están guardados localmente.");
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timerId);

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
    const guest = guests.find(g => g.id === normalizedGuestId);

    if (!guest) {
      return { status: 'NOT_FOUND', guest: null };
    }

    if (guest.checkedInAt) {
      return { status: 'ALREADY_CHECKED_IN', guest };
    }

    const updatedGuest = { ...guest, checkedInAt: new Date() };
    setGuests(currentGuests =>
      currentGuests.map(g => (g.id === normalizedGuestId ? updatedGuest : g))
    );

    return { status: 'SUCCESS', guest: updatedGuest };
  };


  return (
    <GuestContext.Provider value={{ events, guests, selectedEventId, isLoading, error, addEvent, selectEvent, deleteEvent, addGuest, deleteGuest, checkInGuest, clearError }}>
      {children}
    </GuestContext.Provider>
  );
};