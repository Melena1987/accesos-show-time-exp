import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  updateDoc,
  Timestamp,
  FirestoreError
} from 'firebase/firestore';
import { Guest, AccessLevel, CheckInResult, Event } from '../types';

interface GuestContextType {
  events: Event[];
  guests: Guest[];
  selectedEventId: string | null;
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  addEvent: (name: string) => Promise<void>;
  selectEvent: (eventId: string | null) => void;
  deleteEvent: (eventId: string) => Promise<void>;
  addGuest: (name: string, company: string, accessLevel: AccessLevel, eventId: string, invitedBy: string) => Promise<void>;
  deleteGuest: (guestId: string) => Promise<void>;
  checkInGuest: (guestId: string) => Promise<CheckInResult>;
  clearError: () => void;
}

export const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
    return localStorage.getItem('selectedEventId');
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleFirestoreError = (err: FirestoreError) => {
    console.error("Firestore Error:", err.code, err.message);
    setIsLoading(false);
    let detailedError = "No se pudo conectar a la base de datos. La aplicación está en modo sin conexión.";
    switch (err.code) {
      case 'permission-denied':
        detailedError = "Error de Permiso Denegado. Por favor, revisa las Reglas de Seguridad de tu base de datos en el panel de Firebase.";
        break;
      case 'unavailable':
        detailedError = "Servidor no disponible. Revisa tu conexión a internet o las restricciones de la API Key en tu proyecto de Google Cloud.";
        break;
      case 'unauthenticated':
         detailedError = "No autenticado. La configuración de Firebase podría tener problemas.";
         break;
    }
    setError(detailedError);
  }

  useEffect(() => {
    setIsLoading(true);

    // Listener for events collection in Firestore
    const eventsCollection = collection(db, 'events');
    const unsubscribeEvents = onSnapshot(eventsCollection, (snapshot) => {
      setIsOffline(snapshot.metadata.fromCache);
      if (!snapshot.metadata.fromCache) {
          setError(null);
      }
      
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      } as Event));
      setEvents(eventsData);
      setIsLoading(false);
    }, handleFirestoreError);

    // Listener for guests collection in Firestore
    const guestsCollection = collection(db, 'guests');
    const unsubscribeGuests = onSnapshot(guestsCollection, (snapshot) => {
      setIsOffline(snapshot.metadata.fromCache);

      const guestsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: data.id, // Ensure id is correctly mapped
          checkedInAt: data.checkedInAt ? (data.checkedInAt as Timestamp).toDate() : null,
        } as Guest;
      });
      setGuests(guestsData);
    }, handleFirestoreError);

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeEvents();
      unsubscribeGuests();
    };
  }, []);
  
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

  const addEvent = async (name: string) => {
    try {
      const newEventRef = await addDoc(collection(db, 'events'), { name });
      setSelectedEventId(newEventRef.id);
    } catch (err) {
      handleFirestoreError(err as FirestoreError);
    }
  };

  const selectEvent = (eventId: string | null) => {
    setSelectedEventId(eventId);
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const batch = writeBatch(db);

      const guestsQuery = query(collection(db, 'guests'), where('eventId', '==', eventId));
      const guestsSnapshot = await getDocs(guestsQuery);
      guestsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      const eventRef = doc(db, 'events', eventId);
      batch.delete(eventRef);

      await batch.commit();

      if (selectedEventId === eventId) {
        setSelectedEventId(null);
      }
    } catch (err) {
      handleFirestoreError(err as FirestoreError);
    }
  };

  const addGuest = async (name: string, company: string, accessLevel: AccessLevel, eventId: string, invitedBy: string) => {
    try {
      const allGuestIds = guests.map(g => g.id);
      const newGuest: Omit<Guest, 'checkedInAt'> & { checkedInAt: null } = {
        id: generateShortId(allGuestIds),
        eventId,
        name,
        company,
        accessLevel,
        checkedInAt: null,
        invitedBy,
      };
      await addDoc(collection(db, 'guests'), newGuest);
    } catch (err) {
      handleFirestoreError(err as FirestoreError);
    }
  };

  const deleteGuest = async (guestId: string) => {
    try {
      const guestsQuery = query(collection(db, 'guests'), where('id', '==', guestId));
      const guestsSnapshot = await getDocs(guestsQuery);

      if (guestsSnapshot.empty) {
        throw new Error("Guest not found for deletion");
      }

      const guestDocRef = guestsSnapshot.docs[0].ref;
      await deleteDoc(guestDocRef);
    } catch (err) {
       handleFirestoreError(err as FirestoreError);
    }
  };
  
  const checkInGuest = async (guestId: string): Promise<CheckInResult> => {
    const normalizedGuestId = guestId.toUpperCase().trim();
    
    try {
      const guestsQuery = query(collection(db, 'guests'), where('id', '==', normalizedGuestId));
      const guestsSnapshot = await getDocs(guestsQuery);
  
      if (guestsSnapshot.empty) {
        return { status: 'NOT_FOUND', guest: null };
      }
  
      const guestDoc = guestsSnapshot.docs[0];
      const guestData = guestDoc.data();
      const guest: Guest = { 
        ...guestData,
        id: guestData.id,
        checkedInAt: guestData.checkedInAt ? (guestData.checkedInAt as Timestamp).toDate() : null,
      } as Guest;
      
      if (guest.checkedInAt) {
        return { status: 'ALREADY_CHECKED_IN', guest };
      }
      
      const guestDocRef = guestDoc.ref;
      const checkInTime = new Date();
      await updateDoc(guestDocRef, { checkedInAt: Timestamp.fromDate(checkInTime) });
      
      const updatedGuest = { ...guest, checkedInAt: checkInTime };
  
      return { status: 'SUCCESS', guest: updatedGuest };
  
    } catch (err) {
      handleFirestoreError(err as FirestoreError);
      return { status: 'NOT_FOUND', guest: null };
    }
  };

  return (
    <GuestContext.Provider value={{ events, guests, selectedEventId, isLoading, isOffline, error, addEvent, selectEvent, deleteEvent, addGuest, deleteGuest, checkInGuest, clearError }}>
      {children}
    </GuestContext.Provider>
  );
};