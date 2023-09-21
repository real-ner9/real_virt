export enum UserState {
  /**
   * Находится на странице поиска
   */
  QUICK_SEARCH = 'QUICK_SEARCH',
  /**
   * Заполняет профиль (главное меню)
   */
  PROFILE = 'PROFILE',
  /**
   * Заполняет имя (псевдоним)
   */
  FILLING_NAME = 'FILLING_NAME',
  /**
   * Заполняет возраст
   */
  FILLING_AGE = 'FILLING_AGE',
  /**
   * Заполняет описание
   */
  FILLING_DESCRIPTION = 'FILLING_DESCRIPTION',
  /**
   * Заполняет фото
   */
  FILLING_PHOTO = 'FILLING_PHOTO',
  /**
   * Заполняет роль
   */
  FILLING_ROLE = 'FILLING_ROLE',
  /**
   * Смотрит анкеты
   */
  BROWSING_PROFILES = 'BROWSING_PROFILES',
  /**
   * Смотрит лайки
   */
  BROWSING_LIKES = 'BROWSING_LIKES',
  /**
   * Смотрит мэтчи
   */
  BROWSING_MATCHES = 'BROWSING_MATCHES',
}
