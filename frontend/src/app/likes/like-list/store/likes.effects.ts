import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { UserService } from '../../../shared/services/user.service';
import * as LikesActions from './likes.actions';
import { debounceTime, of } from 'rxjs';
import { SocketService } from '../../../shared/services/user-socket.service';

@Injectable()
export class LikesEffects {
  loadLikes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LikesActions.loadLikes),
      debounceTime(200),
      mergeMap(action =>
        this.userService.getUsersWhoLikedMe({
          pageSize: action.pageSize,
          pageNumber: action.pageNumber,
        }).pipe(
          map(page => LikesActions.loadLikesSuccess({data: page})),
          catchError(error => [LikesActions.loadLikesFailure({error})])
        )
      )
    )
  );

  like$ = createEffect(() => this.actions$.pipe(
    ofType(LikesActions.like),
    mergeMap(action =>
      this.socketService.sendLike(action.userId).pipe(
        map(() => LikesActions.likeSuccess()),
        catchError(error => of(LikesActions.likeFailure({ error })))
      )
    )
  ));

  liked$ = createEffect(() =>
    this.socketService.liked().pipe(
      map(({ user, hasPartnerLikedUser}) => LikesActions.liked({ user, hasPartnerLikedUser })),
      catchError(error => of(LikesActions.loadLikesFailure({ error })))
    )
  );

  constructor(
    private actions$: Actions,
    private userService: UserService,
    private socketService: SocketService,
  ) {
  }
}
