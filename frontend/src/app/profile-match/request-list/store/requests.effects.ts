import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { debounceTime, of } from 'rxjs';

import * as requestActions from './requests.actions';
import { UserService } from '../../../shared/services/user.service';
import { SocketService } from '../../../shared/services/user-socket.service';

@Injectable()
export class RequestsEffects {
  loadMatches$ = createEffect(() => this.actions$.pipe(
    ofType(requestActions.loadRequests),
    debounceTime(200),
    mergeMap(() => this.userService.getRequests()
      .pipe(
        map(requests => {
          return requestActions.loadRequestsSuccess({ requests })
        }),
        catchError(error => of(requestActions.loadRequestsFailure({ error })))
      )
    )
  ));

  matchRequested$ = createEffect(() =>
    this.socketService.onMatchRequest().pipe(
      map(user => requestActions.matchRequested({ user })),
      catchError(error => of(requestActions.loadRequestsFailure({ error })))  // или другой action для обработки ошибок
    )
  );

  matchRequestCanceled$ = createEffect(() =>
    this.socketService.onMatchRequestCanceled().pipe(
      map(user => requestActions.matchRequestCanceled({ user })),
      catchError(error => of(requestActions.loadRequestsFailure({ error })))  // или другой action для обработки ошибок
    )
  );

  constructor(
    private actions$: Actions,
    private userService: UserService,
    private socketService: SocketService,
  ) {}
}
