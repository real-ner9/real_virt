import { Component, OnDestroy, OnInit } from '@angular/core';
import { FeedFacade } from './store/feed.facade';

@Component({
  selector: 'app-feed-list',
  templateUrl: './feed-list.component.html',
  styleUrls: ['./feed-list.component.scss']
})
export class FeedListComponent implements OnInit, OnDestroy {
  feed$ = this.facade.feed$;

  constructor(
    private facade: FeedFacade,
  ) {}

  ngOnInit() {
    this.facade.loadFeed();
  }

  ngOnDestroy() {
    this.facade.clearFeed();
  }

  onIntersection(event: IntersectionObserverEntry[], index: number, itemsLength: number) {
    if (event[0].intersectionRatio > 0 && index === itemsLength - 2) {
      this.facade.onScroll();
    }
  }

  onLike(userId: number) {
    this.facade.like(userId);
  }

  onDislike(userId: number) {
    this.facade.dislike(userId);
  }
}
