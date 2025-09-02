
export interface Event {
  id: string;
  name: string;
}

export enum UserRole {
  ORGANIZER = 'organizador',
  CONTROLLER = 'controlador',
  ADMIN = 'admin',
  NONE = 'none',
}

export enum AccessLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
}

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  company: string;
  accessLevel: AccessLevel;
  checkedInAt: Date | null;
  invitedBy?: string;
}

export interface CheckInResult {
  status: 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'NOT_FOUND';
  guest: Guest | null;
}