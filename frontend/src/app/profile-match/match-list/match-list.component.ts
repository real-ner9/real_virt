import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatchesFacade } from './store/matches.facade';

@Component({
  selector: 'app-match-list',
  templateUrl: './match-list.component.html',
  styleUrls: ['./match-list.component.scss']
})
export class MatchListComponent implements OnInit, OnDestroy {
  matches$ = this.matchesFacade.matches$;
  loading$ = this.matchesFacade.loading$;
  error$ = this.matchesFacade.error$;

  constructor(private matchesFacade: MatchesFacade) {}

  ngOnInit() {
    this.matchesFacade.loadMatches();
  }

  onMatchRemoved(matchId: number) {
    this.matchesFacade.removeMatch(matchId);
  }

  onRequest(id: number) {
    this.matchesFacade.requestMatch(id);
  }

  onCancelRequest(id: number) {
    this.matchesFacade.cancelRequestMatch(id);
  }

  ngOnDestroy() {
    this.matchesFacade.clearMatches();
  }
}
