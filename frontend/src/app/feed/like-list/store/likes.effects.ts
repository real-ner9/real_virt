import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { UserService } from '../../../shared/services/user.service';
import * as LikesActions from './likes.actions';
import { debounceTime } from 'rxjs';

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

  constructor(
    private actions$: Actions,
    private userService: UserService
  ) {
  }
}
