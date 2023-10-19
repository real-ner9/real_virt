import { UserRole } from './user-role';

export interface User {
  activeRoom?: string;
  currentPartner?: string;
  lastCleaned?: number;
  lastSearchTimestage?: number;
  lastNotificationTimestage?: number;
  isBlocage?: boolean;
  enableNotificatage?: boolean;
  lastMessageTimestage?: number;
  age?: number;
  description?: string;
  photoUrl?: string;
  role?: UserRole;
  isVisibleToOthers?: boolean;
  name?: string;
  username?: string;
  showUsername?: boolean;
}
