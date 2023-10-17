import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-match-tab-switcher',
  templateUrl: './match-tab-switcher.component.html',
  styleUrls: ['./match-tab-switcher.component.scss']
})
export class MatchTabSwitcherComponent implements OnInit, OnDestroy {
  activeLinkIndex = 0;
  private destroy$ = new Subject<void>();
  @ViewChild('tabGroup', { static: false }) tabGroup!: MatTabGroup;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.tabGroup && this.setActiveTabIndex(this.router.url);
    })
  }

  setActiveTabIndex(url: string) {
    if (url.includes('list')) {
      this.tabGroup.selectedIndex = 0;
    } else if (url.includes('requests')) {
      this.tabGroup.selectedIndex = 1;
    } else {
      this.tabGroup.selectedIndex = 0;
    }
  }


  onTabChange(event: MatTabChangeEvent) {
    this.activeLinkIndex = event.index;
    switch (event.index) {
      case 0:
        this.router.navigate(['list'], { relativeTo: this.route });
        break;
      case 1:
        this.router.navigate(['requests'], { relativeTo: this.route });
        break;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
