import { Component } from '@angular/core';

@Component({
  selector: 'app-feed-tab-switcher',
  templateUrl: './feed-tab-switcher.component.html',
  styleUrls: ['./feed-tab-switcher.component.scss']
})
export class FeedTabSwitcherComponent {
  navLinks: any[];
  constructor() {
    this.navLinks = [
      {
        label: 'Лента',
        labelKey: 'feed',
        link: '/feed/list',
        index: 0,
      },
      {
        label: 'Тебя лайкнули',
        labelKey: 'likes',
        link: '/feed/likes',
        index: 1,
      },
    ];
  }
}
