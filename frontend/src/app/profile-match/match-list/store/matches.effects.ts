import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { debounceTime, of } from 'rxjs';

import * as matchesActions from './matches.actions';
import { UserService } from '../../../shared/services/user.service';
import { SocketService } from '../../../shared/services/user-socket.service';
import * as LikesActions from '../../../likes/like-list/store/likes.actions';

@Injectable()
export class MatchesEffects {
  loadMatches$ = createEffect(() => this.actions$.pipe(
    ofType(matchesActions.loadMatches),
    debounceTime(200),
    mergeMap(() => this.userService.getMatches()
      .pipe(
        map(matches => {
          return matchesActions.loadMatchesSuccess({ matches })
        }),
        catchError(error => of(matchesActions.loadMatchesFailure({ error })))
      )
    )
  ));

  requestMatch$ = createEffect(() => this.actions$.pipe(
    ofType(matchesActions.requestMatch),
    mergeMap(action =>
      this.socketService.sendRequestMatch(action.id).pipe(
        map((match) => matchesActions.requestMatchSuccess({ match })),
        catchError(error => of(matchesActions.requestMatchFailure({ error })))
      )
    )
  ));

  cancelRequestMatch$ = createEffect(() => this.actions$.pipe(
    ofType(matchesActions.cancelRequestMatch),
    mergeMap(action =>
      this.socketService.sendCancelRequestMatch(action.id).pipe(
        map(() => matchesActions.cancelRequestMatchSuccess({ id: action.id })),
        catchError(error => of(matchesActions.cancelRequestMatchFailure({ error })))
      )
    )
  ));

  matchRequested$ = createEffect(() =>
    this.socketService.onMatchRequest().pipe(
      map(user => matchesActions.matchRequested({ user })),
      catchError(error => of(matchesActions.loadMatchesFailure({ error })))  // или другой action для обработки ошибок
    )
  );

  matchRequestCanceled$ = createEffect(() =>
    this.socketService.onMatchRequestCanceled().pipe(
      map(user => matchesActions.matchRequestCanceled({ user })),
      catchError(error => of(matchesActions.loadMatchesFailure({ error })))  // или другой action для обработки ошибок
    )
  );

  requestCanceled$ = createEffect(() =>
    this.socketService.onRequestCanceled().pipe(
      map(user => matchesActions.requestCanceled({ user })),
      catchError(error => of(matchesActions.loadMatchesFailure({ error })))  // или другой action для обработки ошибок
    )
  );

  liked$ = createEffect(() =>
    this.socketService.liked().pipe(
      map(({ user, hasPartnerLikedUser}) =>
        matchesActions.addMatch({ hasPartnerLikedUser, match: {...user, chatRequested: false} })
      ),
      catchError(error => of(LikesActions.loadLikesFailure({ error })))  // или другой action для обработки ошибок
    )
  );

  constructor(
    private actions$: Actions,
    private userService: UserService,
    private socketService: SocketService,
  ) {}
}
