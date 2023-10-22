import { Component, OnDestroy, OnInit } from '@angular/core';
import { LikesFacade } from './store/likes.facade';

@Component({
  selector: 'app-like-list',
  templateUrl: './like-list.component.html',
  styleUrls: ['./like-list.component.scss']
})
export class LikeListComponent implements OnInit, OnDestroy {
  likes$ = this.facade.likes$;

  constructor(private readonly facade: LikesFacade) {}

  ngOnInit() {
    this.facade.clearLikes();
    this.facade.loadLikes();
  }

  ngOnDestroy() {
    this.facade.clearLikes();
  }

  onIntersection(event: IntersectionObserverEntry[], index: number, itemsLength: number) {
    if (event[0].intersectionRatio > 0 && index === itemsLength - 2) {
      this.facade.onScroll();
    }
  }
}
