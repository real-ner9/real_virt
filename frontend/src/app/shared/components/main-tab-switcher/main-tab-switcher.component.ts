import { Component } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-tab-switcher',
  templateUrl: './main-tab-switcher.component.html',
  styleUrls: ['./main-tab-switcher.component.scss']
})
export class MainTabSwitcherComponent {
  activeLinkIndex = 0;

  constructor(private router: Router) {}

  onTabChange(event: MatTabChangeEvent) {
    this.activeLinkIndex = event.index;
    switch (event.index) {
      case 0:
        this.router.navigate(['/matches']);
        break;
      case 1:
        this.router.navigate(['/feed']);
        break;
      case 2:
        this.router.navigate(['/settings']);
        break;
    }
  }
}
