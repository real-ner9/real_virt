import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RequestsState } from './requests.reducer';

export const selectRequestsState = createFeatureSelector<RequestsState>('requests');

export const selectAllRequests = createSelector(
  selectRequestsState,
  (state: RequestsState) => state.requests
);

export const selectLoading = createSelector(
  selectRequestsState,
  (state: RequestsState) => state.loading
);

export const selectError = createSelector(
  selectRequestsState,
  (state: RequestsState) => state.error
);
