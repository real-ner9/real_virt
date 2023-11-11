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

export const clearLikes = createAction('[Likes] Clear Users');

export const setPageSize = createAction(
  '[Likes] Set Page Size',
  props<{ pageSize: number }>()
);

export const setPageNumber = createAction(
  '[Likes] Set Page Number',
  props<{ pageNumber: number }>()
);

export const like = createAction(
  '[Likes] Like',
  props<{userId: number}>(),
);

export const dislike = createAction(
  '[Likes] Dislike',
  props<{userId: number}>(),
);

export const likeSuccess = createAction(
  '[Likes] Like Success',
);

export const liked = createAction(
  '[Likes] Liked',
  props<{user: User, hasPartnerLikedUser: boolean }>(),
);

export const likeFailure = createAction(
  '[Likes] Like Failure',
  props<{ error: any }>()
);
