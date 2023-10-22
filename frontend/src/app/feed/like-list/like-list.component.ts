import { Component, OnInit } from '@angular/core';
import { LikesFacade } from './store/likes.facade';

@Component({
  selector: 'app-like-list',
  templateUrl: './like-list.component.html',
  styleUrls: ['./like-list.component.scss']
})
export class LikeListComponent implements OnInit {
  likes$ = this.facade.likes$;
  pageNumber = 1;
  pageSize = 10;

  scrollDistance = 1.5;
  scrollUpDistance = 1.5;
  throttle = 300;

  constructor(private readonly facade: LikesFacade) {}

  ngOnInit() {
    this.facade.clearLikes();
    this.facade.loadLikes(this.pageSize, this.pageNumber)
  }

  onScroll() {
    this.pageNumber++
    this.facade.loadLikes(this.pageSize, this.pageNumber)
  }

  ngOnDestroy() {
    this.facade.clearLikes();
  }
}
