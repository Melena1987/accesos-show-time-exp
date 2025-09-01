
import { useContext } from 'react';
import { GuestContext } from '../context/GuestContext';

export const useGuests = () => {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuests must be used within a GuestProvider');
  }
  return context;
};
