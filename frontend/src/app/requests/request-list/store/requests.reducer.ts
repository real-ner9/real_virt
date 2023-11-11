import { createReducer, on } from '@ngrx/store';
import {
  loadRequests,
  loadRequestsSuccess,
  loadRequestsFailure,
  addRequest,
  cancelRequest, approveRequest, requestApproved, requestCanceled, approveRequestSuccess, clearRequests,
} from './requests.actions';
import { User } from '../../../shared/models/user';
import { matchRequestCanceled, matchRequested } from '../../../profile-match/match-list/store/matches.actions';
import { blockUserSuccess, removeMatchSuccess, reportUserSuccess } from '../../../shared/store/user.actions';

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
  on(clearRequests, (state) => ({ ...state, requests: [], loading: false })),
  on(loadRequestsFailure, (state, { error }) => ({ ...state, error, loading: false })),
  on(
    removeMatchSuccess,
    blockUserSuccess,
    reportUserSuccess,
    (state, { id }) => ({
      ...state,
      requests: state.requests.filter(request => request.id !== id)
    })
  ),
  on(addRequest, (state, { request }) => ({ ...state, requests: [...state.requests, request] })),
  on(cancelRequest, (state, { requestId }) => ({
    ...state,
    requests: state.requests.filter(request => request.id !== requestId)
  })),
  on(approveRequest, (state, { requestId }) => ({
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

  on(approveRequestSuccess, (state) => ({
    ...state,
    requests: [],
  })),

  on(requestApproved, (state) => ({
    ...state,
    requests: [],
  })),

  on(matchRequestCanceled, (state, { user }) => ({
    ...state,
    requests: state.requests.length ? [...state.requests.filter((request) => user.id !== request.id)] : [],
  })),

  on(requestCanceled, (state, { user }) => ({
    ...state,
    requests: state.requests.length ? [...state.requests.filter((request) => user.id !== request.id)] : [],
  })),
);
