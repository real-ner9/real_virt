import { Component, OnDestroy, OnInit } from '@angular/core';
import { FeedFacade } from './store/feed.facade';

@Component({
  selector: 'app-feed-list',
  templateUrl: './feed-list.component.html',
  styleUrls: ['./feed-list.component.scss']
})
export class FeedListComponent implements OnInit, OnDestroy {
  feed$ = this.facade.feed$;

  scrollDistance = 1.5;
  scrollUpDistance = 1.5;
  throttle = 500;

  constructor(
    private facade: FeedFacade,
  ) {
  }

  ngOnInit() {
    this.facade.clearFeed();
    this.facade.loadFeed()
  }

  onScroll() {
    this.facade.onScroll();
  }

  ngOnDestroy() {
    this.facade.clearFeed();
  }
}
