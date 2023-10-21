export interface Page<TEntity> {
  content: TEntity[];
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort?: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

interface PaginationParams {
  list: any[];
  totalElements: number;
  pageSize: number;
  pageNumber: number;
}

export function paginate<T>({
  list,
  totalElements,
  pageSize,
  pageNumber,
}: PaginationParams): Page<T> {
  return {
    content: list,
    totalPages: Math.ceil(totalElements / pageSize),
    totalElements: totalElements,
    size: pageSize,
    number: pageNumber,
    first: pageNumber === 1,
    last: pageNumber * pageSize >= totalElements,
    numberOfElements: list.length,
    empty: list.length === 0,
  };
}
