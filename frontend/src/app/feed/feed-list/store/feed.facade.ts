import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as FeedActions from './feed.actions';
import * as FeedSelectors from './feed.selectors';

@Injectable({ providedIn: 'root' })
export class FeedFacade {
  feed$ = this.store.select(FeedSelectors.getFeedData);
  loading$ = this.store.select(FeedSelectors.getLoading);
  totalElements$ = this.store.select(FeedSelectors.getFeedTotalElements);
  pageSize$ = this.store.select(FeedSelectors.getFeedPageSize);
  pageNumber$ = this.store.select(FeedSelectors.getFeedPageNumber);
  error$ = this.store.select(FeedSelectors.getFeedError);

  constructor(private store: Store) {}

  loadFeed(pageSize: number, pageNumber: number) {
    this.store.dispatch(FeedActions.setPageSize({ pageSize }));
    this.store.dispatch(FeedActions.setPageNumber({ pageNumber }));
    this.store.dispatch(FeedActions.loadFeed({ pageSize, pageNumber }));
  }

  setPageSize(pageSize: number) {
    this.store.dispatch(FeedActions.setPageSize({ pageSize }));
  }

  setPageNumber(pageNumber: number) {
    this.store.dispatch(FeedActions.setPageNumber({ pageNumber }));
  }

  clearFeed() {
    console.log('clear feed');
    this.store.dispatch(FeedActions.clearFeed());
  }
}
