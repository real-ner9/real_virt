export interface Page<TEntity> {
  content: TEntity[];
  pageable?: {
    sort: any;
    offset: number;
    pageSize: number;
    pageNumber: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort?: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
  online: boolean;
}
