import { createAction, props } from '@ngrx/store';
import { User } from '../../../shared/models/user';
import { Page } from '../../../shared/models/page';

export const loadLikes = createAction(
  '[Likes] Load Users',
  props<{ pageSize: number; pageNumber: number }>()
);

export const loadLikesSuccess = createAction(
  '[Likes] Load Users Success',
  props<{ data: Page<User>; }>()
);

export const loadLikesFailure = createAction(
  '[Likes] Load Users Failure',
  props<{ error: any }>()
);

export const like = createAction(
  '[Likes] Like',
  props<{ userId: number }>()
);

export const dislike = createAction(
  '[Likes] Dislike',
  props<{ userId: number }>()
);

export const clearLikes = createAction('[Likes] Clear Users');

export const setPageSize = createAction(
  '[Likes] Set Page Size',
  props<{ pageSize: number }>()
);

export const setPageNumber = createAction(
  '[Likes] Set Page Number',
  props<{ pageNumber: number }>()
);
