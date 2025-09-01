
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

const DATA_STORAGE_KEY = 'showtime_data';

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

export const GuestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);


  useEffect(() => {
    try {
      const storedData = localStorage.getItem(DATA_STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        
        // Robustness check: ensure parsed data is a valid object with expected keys
        if (typeof parsed === 'object' && parsed !== null && 'events' in parsed && 'guests' in parsed) {
            const { events: storedEvents, guests: storedGuests } = parsed;
            
            const parsedGuests = Array.isArray(storedGuests)
              ? storedGuests.map((g: any) => ({
                  ...g,
                  checkedInAt: g.checkedInAt ? new Date(g.checkedInAt) : null,
                }))
              : [];
            
            setEvents(Array.isArray(storedEvents) ? storedEvents : []);
            setGuests(parsedGuests);
        } else {
            // Malformed data found, clear it to prevent future errors
            console.warn("Malformed data found in localStorage. Clearing it.");
            localStorage.removeItem(DATA_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load or parse data from localStorage, clearing potentially corrupt data.", error);
      localStorage.removeItem(DATA_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const dataToStore = {
        events,
        guests
      };
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [events, guests]);

  const addEvent = useCallback((name: string) => {
    const newEvent: Event = {
      id: `evt_${new Date().getTime()}`,
      name,
    };
    setEvents(prevEvents => [...prevEvents, newEvent]);
    setSelectedEventId(newEvent.id);
  }, []);

  const selectEvent = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId);
  }, []);

  const addGuest = useCallback((name: string, company: string, accessLevel: AccessLevel, eventId: string, invitedBy: string) => {
    setGuests(prevGuests => {
      const existingIds = prevGuests.map(g => g.id);
      const newGuest: Guest = {
        id: generateShortId(existingIds),
        eventId,
        name,
        company,
        accessLevel,
        checkedInAt: null,
        invitedBy,
      };
      return [...prevGuests, newGuest];
    });
  }, []);

  const checkInGuest = useCallback((guestId: string): CheckInResult => {
    let result: CheckInResult = { status: 'NOT_FOUND', guest: null };
    const normalizedGuestId = guestId.toUpperCase().trim();
    
    setGuests(prevGuests => {
      const guestIndex = prevGuests.findIndex(g => g.id === normalizedGuestId);
      if (guestIndex === -1) {
        return prevGuests;
      }

      const updatedGuests = [...prevGuests];
      const guest = { ...updatedGuests[guestIndex] };

      if (guest.checkedInAt) {
        result = { status: 'ALREADY_CHECKED_IN', guest };
        return prevGuests; // No state change needed
      }

      guest.checkedInAt = new Date();
      updatedGuests[guestIndex] = guest;
      result = { status: 'SUCCESS', guest };
      return updatedGuests;
    });

    return result;
  }, []);

  return (
    <GuestContext.Provider value={{ events, guests, selectedEventId, addEvent, selectEvent, addGuest, checkInGuest }}>
      {children}
    </GuestContext.Provider>
  );
};
