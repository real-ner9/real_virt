import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as MatchesSelectors from './matches.selectors';
import * as MatchesActions from './matches.actions';
import { Observable } from 'rxjs';
import { Match } from '../../../shared/models/match';

@Injectable({ providedIn: 'root' })
export class MatchesFacade {
  matches$: Observable<Match[]> = this.store.select(MatchesSelectors.selectAllMatches);
  loading$: Observable<boolean> = this.store.pipe(select(MatchesSelectors.selectLoading));
  error$: Observable<any> = this.store.pipe(select(MatchesSelectors.selectError));

  loadMatches() {
    this.store.dispatch(MatchesActions.loadMatches());
  }

  clearMatches() {
    this.store.dispatch(MatchesActions.clearMatches());
  }

  constructor(private store: Store) {}

  removeMatch(matchId: number) {
    this.store.dispatch(MatchesActions.removeMatch({ matchId }));
  }

  requestMatch(id: number) {
    this.store.dispatch(MatchesActions.requestMatch({id}));
  }

  cancelRequestMatch(id: number) {
    this.store.dispatch(MatchesActions.cancelRequestMatch({id}));
  }
}
