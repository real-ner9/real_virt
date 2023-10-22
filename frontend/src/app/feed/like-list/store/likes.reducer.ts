import { createReducer, on } from '@ngrx/store';
import * as LikesActions from './likes.actions';
import { User } from '../../../shared/models/user';
import { loadLikes } from './likes.actions';

export const likesFeatureKey = 'likes';

export interface State {
  data: User[];
  totalElements: number;
  error: any;
  loading: boolean;
  pageSize: number,
  pageNumber: number,
  totalPages: number;
}

export const initialState: State = {
  data: [],
  totalElements: 0,
  error: null,
  loading: false,
  pageSize: 10,
  pageNumber: 1,
  totalPages: 1,
};

export const likesReducer = createReducer(
  initialState,

  on(loadLikes, state => ({ ...state, loading: true })),
  on(LikesActions.setPageSize, (state, { pageSize }) => ({ ...state, pageSize })),
  on(LikesActions.setPageNumber, (state, { pageNumber }) => ({ ...state, pageNumber })),

  on(LikesActions.loadLikesSuccess, (state, action) => ({
    ...state,
    data: state.data.length && state.pageNumber > 1 ? [...state.data, ...action.data.content] : [...action.data.content],
    totalElements: action.data.size,
    totalPages: action.data.totalPages || 1,
    error: null,
    loading: false,
  })),

  on(LikesActions.loadLikesFailure, (state, action) => ({
    ...state,
    error: action.error,
    loading: false,
  })),

  on(LikesActions.clearLikes, state => ({
    ...state,
    totalElements: 0,
    pageSize: 10,
    pageNumber: 1,
    error: null,
  })),

  on(LikesActions.like, (state, { userId }) => ({
    ...state,
    data: state.data.filter(({id}) => id !== userId),
    totalElements: 0,
    error: null,
  })),

  on(LikesActions.dislike, (state, { userId }) => ({
    ...state,
    data: state.data.filter(({id}) => id !== userId),
    totalElements: 0,
    totalPages: 1,
    error: null,
  })),
);
