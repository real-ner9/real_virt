import { createAction, props } from '@ngrx/store';
import { Page } from '../../../shared/models/page';
import { User } from '../../../shared/models/user';

export const loadRequests = createAction('[Requests] Load Requests');
export const clearRequests = createAction('[Requests] Clear Requests');
export const loadRequestsSuccess = createAction('[Requests] Load Requests Success', props<{ requests: Page<User> }>());
export const loadRequestsFailure = createAction('[Requests] Load Requests Failure', props<{ error: any }>());

export const addRequest = createAction('[Requests] Add Request', props<{ request: User }>());
export const approveRequest = createAction('[Requests] Approve Request', props<{ requestId: number }>());
export const cancelRequest = createAction('[Requests] Cancel Request', props<{ requestId: number }>());
export const matchRequested = createAction('[Requests] Match Requested', props<{ user: User }>());
export const matchRequestCanceled = createAction('[Requests] Match Request Canceled', props<{ user: User }>());
export const approveRequestSuccess = createAction(
  '[Requests] Approve Request Success',
);

export const approveRequestFailure = createAction(
  '[Requests] Approve Request Failure',
  props<{ error: any }>()
);

export const cancelRequestSuccess = createAction(
  '[Requests] Cancel Request Success',
);

export const cancelRequestFailure = createAction(
  '[Requests] Cancel Request Failure',
  props<{ error: any }>()
);

export const requestApproved = createAction('[Requests] Request Approved', props<{ user: User }>());
export const requestCanceled = createAction('[Requests] Request Canceled', props<{ user: User }>());

