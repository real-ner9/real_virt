import { Component } from '@angular/core';

@Component({
  selector: 'app-main-tab-switcher',
  templateUrl: './main-tab-switcher.component.html',
  styleUrls: ['./main-tab-switcher.component.scss']
})
export class MainTabSwitcherComponent {
  title = 'angular-material-tab-router';
  navLinks: any[];
  constructor() {
    this.navLinks = [
      {
        label: 'Мэтчи',
        labelKey: 'matches',
        link: '/matches',
        index: 0,
        icon: 'matches',
      },
      {
        label: 'Приглашения',
        labelKey: 'requests',
        link: '/requests',
        index: 1,
        icon: 'requests',
      },
      {
        label: 'Лента',
        labelKey: 'feed',
        link: '/feed',
        index: 2,
        icon: 'feed',
      },
      {
        label: 'Лайки',
        labelKey: 'likes',
        link: '/likes',
        index: 3,
        icon: 'likes',
      },
      {
        label: 'Профиль',
        labelKey: 'settings',
        link: '/settings',
        index: 4,
        icon: 'settings',
      },
    ];
  }
}
