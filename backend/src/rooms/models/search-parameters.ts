export interface SearchParameters {
  gender: 'Male' | 'Female';
  minSize: number;
  maxSize: number;
  minAge: number;
  maxAge: number;
  build: 'Average' | 'Slim' | 'Athletic' | 'Full';
  role: 'Active' | 'Uni' | 'Passive';
  footFetish: boolean;
  chmor: boolean;
  otherFetishes: boolean;
}
