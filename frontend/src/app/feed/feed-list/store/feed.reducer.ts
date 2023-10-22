import { createReducer, on } from '@ngrx/store';
import * as FeedActions from './feed.actions';
import { User } from '../../../shared/models/user';

export interface State {
  data: User[];
  totalElements: number;
  pageSize: number;
  pageNumber: number;
  error: any;
  loading: boolean;
  totalPages: number;
}

export const initialState: State = {
  data: [],
  totalElements: 0,
  totalPages: 1,
  pageSize: 10,
  pageNumber: 1,
  error: null,
  loading: false,
};

export const feedReducer = createReducer(
  initialState,
  on(FeedActions.loadFeed, (state) => ({ ...state, loading: true, })),
  on(FeedActions.loadFeedSuccess, (state, { page }) => ({
    ...state,
    data: state.data.length && state.pageNumber > 1 ? [...state.data, ...page.content] : [...page.content],
    totalPages: page.totalPages || 1,
    pageNumber: page.number,
    pageSize: page.size,
    loading: false,
  })),
  on(FeedActions.setPageSize, (state, { pageSize }) => ({ ...state, pageSize })),
  on(FeedActions.setPageNumber, (state, { pageNumber }) => ({ ...state, pageNumber })),
  on(FeedActions.loadFeedFailure, (state, { error }) => ({ ...state, error, loading: false, })),
  on(FeedActions.clearFeed, (state) => ({ ...state, pageSize: 10, pageNumber: 1, totalPages: 1, })),
);
