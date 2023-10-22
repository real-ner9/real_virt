import { Component, OnDestroy, OnInit } from '@angular/core';
import { LikesFacade } from './store/likes.facade';

@Component({
  selector: 'app-like-list',
  templateUrl: './like-list.component.html',
  styleUrls: ['./like-list.component.scss']
})
export class LikeListComponent implements OnInit, OnDestroy {
  likes$ = this.facade.likes$;

  scrollDistance = 1.5;
  scrollUpDistance = 1.5;
  throttle = 500;

  constructor(private readonly facade: LikesFacade) {}

  ngOnInit() {
    this.facade.clearLikes();
    this.facade.loadLikes();
  }

  onScroll() {
    this.facade.onScroll();
  }

  ngOnDestroy() {
    this.facade.clearLikes();
  }
}
