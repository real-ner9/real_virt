export enum UserRole {
  PASSIVE = 'PASSIVE',
  ACTIVE = 'ACTIVE',
  UNI = 'UNI',
  UNI_PASSIVE = 'UNI_PASSIVE',
  UNI_ACTIVE = 'UNI_ACTIVE',
  NOT_DECIDE = 'NOT_DECIDE',
}

export const UserRoleMap = {
  [UserRole.PASSIVE]: 'Пассив',
  [UserRole.ACTIVE]: 'Актив',
  [UserRole.UNI]: 'Универсал',
  [UserRole.UNI_PASSIVE]: 'Уни-пассив',
  [UserRole.UNI_ACTIVE]: 'Уни-актив',
  [UserRole.NOT_DECIDE]: 'Пока не решил',
};
