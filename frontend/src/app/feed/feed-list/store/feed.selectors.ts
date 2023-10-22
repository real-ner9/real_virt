import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './feed.reducer';

const getFeedState = createFeatureSelector<State>('feed');

export const getFeedData = createSelector(
  getFeedState,
  (state: State) => state.data
);

export const getFeedTotalElements = createSelector(
  getFeedState,
  (state: State) => state.totalElements
);

export const getFeedError = createSelector(
  getFeedState,
  (state: State) => state.error
);

export const getFeedPageSize = createSelector(
  getFeedState,
  (state: State) => state.pageSize
);

export const getFeedPageNumber = createSelector(
  getFeedState,
  (state: State) => state.pageNumber
);

export const getLoading = createSelector(
  getFeedState,
  (state: State) => state.loading
);
