import { Component } from '@angular/core';

@Component({
  selector: 'app-match-tab-switcher',
  templateUrl: './match-tab-switcher.component.html',
  styleUrls: ['./match-tab-switcher.component.scss']
})
export class MatchTabSwitcherComponent {
  navLinks: any[];
  constructor() {
    this.navLinks = [
      {
        label: 'Мэтчи',
        labelKey: 'matches',
        link: '/matches/list',
        index: 0,
      },
      {
        label: 'Приглашения',
        labelKey: 'requests',
        link: '/matches/requests',
        index: 1,
      },
    ];
  }
}
