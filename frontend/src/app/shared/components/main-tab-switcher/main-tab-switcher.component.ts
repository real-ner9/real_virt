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
        label: 'Лента',
        labelKey: 'feed',
        link: '/feed',
        index: 1,
        icon: 'feed',
      },
      {
        label: 'Профиль',
        labelKey: 'settings',
        link: '/settings',
        disabled: true,
        index: 1,
        icon: 'settings',
      },
    ];
  }
}
