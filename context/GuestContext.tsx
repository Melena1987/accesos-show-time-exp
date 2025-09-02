import React, { createContext, useState, useEffect, ReactNode } from 'react';
// FIX: Switched to Firebase v8 compatible imports to align with firebase.ts initialization.
// FIX: Using compat imports for Firebase v9 to support v8 syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from '../firebase';
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

  // FIX: Updated error handler to use a generic type for the error object, as FirestoreError type is not directly available in v8 in the same way.
  const handleFirestoreError = (err: any) => {
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

    // FIX: Switched to Firebase v8 API for accessing collections and listening for snapshots.
    const eventsCollection = db.collection('events');
    const unsubscribeEvents = eventsCollection.onSnapshot((snapshot) => {
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

    // FIX: Switched to Firebase v8 API for accessing collections and listening for snapshots.
    const guestsCollection = db.collection('guests');
    const unsubscribeGuests = guestsCollection.onSnapshot((snapshot) => {
      setIsOffline(snapshot.metadata.fromCache);

      const guestsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: data.id, // Ensure id is correctly mapped
          // FIX: Used firebase.firestore.Timestamp for type casting in v8.
          checkedInAt: data.checkedInAt ? (data.checkedInAt as firebase.firestore.Timestamp).toDate() : null,
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
      // FIX: Switched to Firebase v8 API for adding a document.
      const newEventRef = await db.collection('events').add({ name });
      setSelectedEventId(newEventRef.id);
    } catch (err) {
      handleFirestoreError(err as any);
    }
  };

  const selectEvent = (eventId: string | null) => {
    setSelectedEventId(eventId);
  };

  const deleteEvent = async (eventId: string) => {
    try {
      // FIX: Switched to Firebase v8 API for creating a batch write.
      const batch = db.batch();

      // FIX: Switched to Firebase v8 API for querying documents.
      const guestsQuery = db.collection('guests').where('eventId', '==', eventId);
      const guestsSnapshot = await guestsQuery.get();
      guestsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // FIX: Switched to Firebase v8 API for getting a document reference.
      const eventRef = db.collection('events').doc(eventId);
      batch.delete(eventRef);

      await batch.commit();

      if (selectedEventId === eventId) {
        setSelectedEventId(null);
      }
    } catch (err) {
      handleFirestoreError(err as any);
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
      // FIX: Switched to Firebase v8 API for adding a document.
      await db.collection('guests').add(newGuest);
    } catch (err) {
      handleFirestoreError(err as any);
    }
  };

  const deleteGuest = async (guestId: string) => {
    try {
      // FIX: Switched to Firebase v8 API for querying documents.
      const guestsQuery = db.collection('guests').where('id', '==', guestId);
      const guestsSnapshot = await guestsQuery.get();

      if (guestsSnapshot.empty) {
        throw new Error("Guest not found for deletion");
      }

      const guestDocRef = guestsSnapshot.docs[0].ref;
      // FIX: Switched to Firebase v8 API for deleting a document.
      await guestDocRef.delete();
    } catch (err) {
       handleFirestoreError(err as any);
    }
  };
  
  const checkInGuest = async (guestId: string): Promise<CheckInResult> => {
    const normalizedGuestId = guestId.toUpperCase().trim();
    
    try {
      // FIX: Switched to Firebase v8 API for querying documents.
      const guestsQuery = db.collection('guests').where('id', '==', normalizedGuestId);
      const guestsSnapshot = await guestsQuery.get();
  
      if (guestsSnapshot.empty) {
        return { status: 'NOT_FOUND', guest: null };
      }
  
      const guestDoc = guestsSnapshot.docs[0];
      const guestData = guestDoc.data();
      const guest: Guest = { 
        ...guestData,
        id: guestData.id,
        // FIX: Used firebase.firestore.Timestamp for type casting in v8.
        checkedInAt: guestData.checkedInAt ? (guestData.checkedInAt as firebase.firestore.Timestamp).toDate() : null,
      } as Guest;
      
      if (guest.checkedInAt) {
        return { status: 'ALREADY_CHECKED_IN', guest };
      }
      
      const guestDocRef = guestDoc.ref;
      const checkInTime = new Date();
      // FIX: Switched to Firebase v8 API for updating a document and creating a timestamp.
      await guestDocRef.update({ checkedInAt: firebase.firestore.Timestamp.fromDate(checkInTime) });
      
      const updatedGuest = { ...guest, checkedInAt: checkInTime };
  
      return { status: 'SUCCESS', guest: updatedGuest };
  
    } catch (err) {
      handleFirestoreError(err as any);
      return { status: 'NOT_FOUND', guest: null };
    }
  };

  return (
    <GuestContext.Provider value={{ events, guests, selectedEventId, isLoading, isOffline, error, addEvent, selectEvent, deleteEvent, addGuest, deleteGuest, checkInGuest, clearError }}>
      {children}
    </GuestContext.Provider>
  );
};