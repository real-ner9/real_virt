import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as LikesActions from './likes.actions';
import * as LikesSelectors from './likes.selectors';
import { combineLatest, filter, take } from 'rxjs';

@Injectable({providedIn: 'root'})
export class LikesFacade {
  likes$ = this.store.select(LikesSelectors.getLikesData);
  totalElements$ = this.store.select(LikesSelectors.getLikesTotalElements);
  error$ = this.store.select(LikesSelectors.getLikesError);
  totalPages$ = this.store.select(LikesSelectors.getTotalPages);
  pageSize$ = this.store.select(LikesSelectors.getPageSize);
  pageNumber$ = this.store.select(LikesSelectors.getPageNumber);
  prevPageNumber = 1;

  constructor(private store: Store) {
  }

  loadLikes() {
    combineLatest([
      this.pageSize$,
      this.pageNumber$,
    ])
      .pipe(take(1))
      .subscribe(([pageSize, pageNumber]) => {
        this.store.dispatch(LikesActions.loadLikes({pageSize, pageNumber}));
      })
  }

  clearLikes() {
    this.store.dispatch(LikesActions.clearLikes());
  }

  onScroll() {
    combineLatest([
      this.totalPages$,
      this.pageSize$,
      this.pageNumber$,
    ]).pipe(
      take(1),
      filter(([total, , pageNumber]) => total > 1 && pageNumber <= total && this.prevPageNumber !== pageNumber)
    ).subscribe(([, pageSize, pageNumber]) => {
      this.prevPageNumber++;
      this.store.dispatch(LikesActions.loadLikes({pageSize, pageNumber: ++pageNumber}));
    });
  }
}
