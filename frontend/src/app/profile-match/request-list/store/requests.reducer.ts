import { createReducer, on } from '@ngrx/store';
import {
  loadRequests,
  loadRequestsSuccess,
  loadRequestsFailure,
  addRequest,
  cancelRequest,
} from './requests.actions';
import { User } from '../../../shared/models/user';
import { matchRequestCanceled, matchRequested } from '../../match-list/store/matches.actions';
import { Match } from '../../../shared/models/match';

export interface RequestsState {
  requests: User[];
  loading: boolean;
  error: any;
}

export const initialRequestsState: RequestsState = {
  requests: [],
  loading: false,
  error: null
};

export const requestsReducer = createReducer(
  initialRequestsState,
  on(loadRequests, state => ({ ...state, loading: true })),
  on(loadRequestsSuccess, (state, { requests }) => ({ ...state, requests: [...requests.content], loading: false })),
  on(loadRequestsFailure, (state, { error }) => ({ ...state, error, loading: false })),
  on(addRequest, (state, { request }) => ({ ...state, requests: [...state.requests, request] })),
  on(cancelRequest, (state, { requestId }) => ({
    ...state,
    requests: state.requests.filter(request => request.id !== requestId)
  })),
  on(matchRequested, (state, {user}) => ({
    ...state,
    requests: [
      user,
      ...state.requests,
    ],
  })),

  on(matchRequestCanceled, (state, { user }) => ({
    ...state,
    requests: state.requests.length ? [...state.requests.filter((request) => user.id !== request.id)] : [],
  })),
);
