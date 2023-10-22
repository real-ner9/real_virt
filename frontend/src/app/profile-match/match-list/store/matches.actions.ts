import { createAction, props } from '@ngrx/store';
import { Page } from '../../../shared/models/page';
import { Match } from '../../../shared/models/match';
import { User } from '../../../shared/models/user';

export const loadMatches = createAction('[Matches] Load Matches');
export const loadMatchesSuccess = createAction('[Matches] Load Matches Success', props<{ matches: Page<Match> }>());
export const loadMatchesFailure = createAction('[Matches] Load Matches Failure', props<{ error: any }>());

export const addMatch = createAction('[Matches] Add Match', props<{ match: Match }>());
export const matchToRequest = createAction('[Matches] Match To Request', props<{ matchId: number }>());
export const removeMatch = createAction('[Matches] Remove Match', props<{ matchId: number }>());
export const requestMatch = createAction(
  '[Matches] Request Match',
  props<{ id: number }>()
);

export const cancelRequestMatch = createAction(
  '[Matches] Cancel Request Match',
  props<{ id: number }>()
);

export const requestMatchSuccess = createAction(
  '[Matches] Request Match Success',
  props<{ match: Match }>()
);

export const requestMatchFailure = createAction(
  '[Matches] Request Match Failure',
  props<{ error: any }>()
);

export const cancelRequestMatchSuccess = createAction(
  '[Matches] Cancel Request Match Success',
  props<{ id: number }>()
);

export const cancelRequestMatchFailure = createAction(
  '[Matches] Cancel Request Match Failure',
  props<{ error: any }>()
);

export const matchRequested = createAction('[Matches] Match Requested', props<{ user: User }>());
export const matchRequestCanceled = createAction('[Matches] Match Request Canceled', props<{ user: User }>());


