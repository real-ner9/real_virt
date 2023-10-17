import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-main-tab-switcher',
  templateUrl: './main-tab-switcher.component.html',
  styleUrls: ['./main-tab-switcher.component.scss']
})
export class MainTabSwitcherComponent implements OnInit, OnDestroy {
  activeLinkIndex: number | null = 0;
  private destroy$ = new Subject<void>();
  @ViewChild('tabGroup', { static: false }) tabGroup!: MatTabGroup;
  isChangeUrl = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.url.pipe(
      takeUntil(this.destroy$),
    ).subscribe((data) => {
      this.tabGroup && this.setActiveTabIndex(this.router.url);
    });

    setTimeout(() => {
      this.tabGroup && this.setActiveTabIndex(this.router.url);
    });
  }

  setActiveTabIndex(url: string) {
    if (url.includes('matches')) {
      this.activeLinkIndex = 0;
    } else if (url.includes('feed')) {
      this.isChangeUrl = true;
      this.activeLinkIndex = 1;
    } else if (url.includes('settings')) {
      this.isChangeUrl = true;
      this.activeLinkIndex = 2;
    } else {
      this.activeLinkIndex = 0;
    }
  }

  onTabChange(event: MatTabChangeEvent) {
    if (!this.isChangeUrl) {
      this.isChangeUrl = false;
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
    this.isChangeUrl = false;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
