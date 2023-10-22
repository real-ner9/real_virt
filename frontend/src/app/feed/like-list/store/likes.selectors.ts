import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromLikes from './likes.reducer';

export const selectLikesState = createFeatureSelector<fromLikes.State>(
  fromLikes.likesFeatureKey
);

export const getLikesData = createSelector(
  selectLikesState,
  state => state.data
);

export const getLikesTotalElements = createSelector(
  selectLikesState,
  state => state.totalElements
);

export const getLikesError = createSelector(
  selectLikesState,
  state => state.error
);

export const getLikedUsersLoading = createSelector(
  selectLikesState,
  state => state.loading
);

export const getTotalPages = createSelector(
  selectLikesState,
  state => state.totalPages
);

export const getPageSize = createSelector(
  selectLikesState,
  state => state.pageSize
);

export const getPageNumber = createSelector(
  selectLikesState,
  state => state.pageNumber
);
