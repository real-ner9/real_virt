import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as LikesActions from './likes.actions';
import * as LikesSelectors from './likes.selectors';

@Injectable({ providedIn: 'root' })
export class LikesFacade {
  likes$ = this.store.select(LikesSelectors.getLikesData);
  totalElements$ = this.store.select(LikesSelectors.getLikesTotalElements);
  error$ = this.store.select(LikesSelectors.getLikesError);

  constructor(private store: Store) {}

  loadLikes(pageSize: number, pageNumber: number) {
    this.store.dispatch(LikesActions.setPageSize({ pageSize }));
    this.store.dispatch(LikesActions.setPageNumber({ pageNumber }));
    this.store.dispatch(LikesActions.loadLikes({ pageSize, pageNumber }));
  }

  clearLikes() {
    this.store.dispatch(LikesActions.clearLikes());
  }
}
