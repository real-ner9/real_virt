import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as FeedActions from './feed.actions';
import * as FeedSelectors from './feed.selectors';
import { combineLatest, filter, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FeedFacade {
  feed$ = this.store.select(FeedSelectors.getFeedData);
  loading$ = this.store.select(FeedSelectors.getLoading);
  totalElements$ = this.store.select(FeedSelectors.getFeedTotalElements);
  pageSize$ = this.store.select(FeedSelectors.getFeedPageSize);
  pageNumber$ = this.store.select(FeedSelectors.getFeedPageNumber);
  error$ = this.store.select(FeedSelectors.getFeedError);
  totalPages$ = this.store.select(FeedSelectors.getTotalPages);
  prevPageNumber = 1;

  constructor(private store: Store) {}

  loadFeed() {
    combineLatest([
      this.pageSize$,
      this.pageNumber$,
    ]).pipe(
      take(1)
    ).subscribe(([pageSize, pageNumber]) => {
      this.store.dispatch(FeedActions.loadFeed({ pageSize, pageNumber }));
    })
  }

  setPageSize(pageSize: number) {
    this.store.dispatch(FeedActions.setPageSize({ pageSize }));
  }

  setPageNumber(pageNumber: number) {
    this.store.dispatch(FeedActions.setPageNumber({ pageNumber }));
  }

  clearFeed() {
    this.store.dispatch(FeedActions.clearFeed());
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
      this.store.dispatch(FeedActions.loadFeed({ pageSize, pageNumber: ++pageNumber }));
    });
  }
}
