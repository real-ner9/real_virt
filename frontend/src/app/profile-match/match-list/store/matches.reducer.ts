import { createReducer, on } from '@ngrx/store';
import {
  loadMatches,
  loadMatchesSuccess,
  loadMatchesFailure,
  addMatch,
  removeMatch, requestMatch, cancelRequestMatch, matchRequested, matchRequestCanceled, requestCanceled, clearMatches
} from './matches.actions';
import { Match } from '../../../shared/models/match';

export interface MatchesState {
  matches: Match[];
  loading: boolean;
  error: any;
}

export const initialMatchesState: MatchesState = {
  matches: [],
  loading: false,
  error: null
};

export const matchesReducer = createReducer(
  initialMatchesState,
  on(loadMatches, state => ({ ...state, loading: true })),
  on(loadMatchesSuccess, (state, { matches }) => ({ ...state, matches: [...matches.content], loading: false })),
  on(clearMatches, (state) => ({ ...state, matches: [], loading: false })),
  on(loadMatchesFailure, (state, { error }) => ({ ...state, error, loading: false })),
  on(addMatch, (state, { match, hasPartnerLikedUser }) => ({
    ...state,
    matches: hasPartnerLikedUser ? [match, ...state.matches] : state.matches,
  })),
  on(removeMatch, (state, { matchId }) => ({
    ...state,
    matches: state.matches.filter(match => match.id !== matchId)
  })),
  on(requestMatch, (state, { id }) => ({
    ...state,
    matches: state.matches.map(match => ({
      ...match,
      chatRequested: match.id === id ? true : match.chatRequested
    }))
  })),
  on(cancelRequestMatch, (state, { id }) => ({
    ...state,
    matches: state.matches.map(match => ({
      ...match,
      chatRequested: match.id === id ? false : match.chatRequested
    })),
  })),

  on(requestCanceled, (state, { user }) => ({
    ...state,
    matches: state.matches.map(match => ({
      ...match,
      chatRequested: match.id === user.id ? false : match.chatRequested
    })),
  })),

  on(matchRequested, (state, {user}) => ({
    ...state,
    matches: state.matches.length ? [...state.matches.filter((match) => user.id !== match.id)] : [],
  })),

  on(matchRequestCanceled, (state, { user }) => ({
    ...state,
    matches: [
      user as Match,
      ...state.matches,
    ]
  })),
);
