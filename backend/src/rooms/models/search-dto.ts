import { UserParameters } from './user-parameters';
import { SearchParameters } from './search-parameters';

export interface SearchDto {
  userId: string;
  userParameters: UserParameters;
  searchParameters: SearchParameters;
}
