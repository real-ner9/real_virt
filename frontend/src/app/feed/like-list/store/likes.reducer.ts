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
    data: state.data.length && action.data.number > 1 ? [...state.data, ...action.data.content] : [...action.data.content],
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
    data: [],
  })),

  on(LikesActions.like, (state, { userId }) => ({
    ...state,
    data: state.data.filter(({id}) => id !== userId),
    error: null,
  })),

  on(LikesActions.dislike, (state, { userId }) => ({
    ...state,
    data: state.data.filter(({id}) => id !== userId),
    error: null,
  })),

  on(LikesActions.liked, (state, { user, hasPartnerLikedUser }) => ({
    ...state,
    // Если пользователь его не лайкал, то переносим сюда, если же лайкнул, то добавляем в мэтчи
    data: !hasPartnerLikedUser ? [
      user,
      ...state.data
    ] : state.data,
    error: null,
  })),
);
