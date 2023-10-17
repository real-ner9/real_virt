import { NgModule } from '@angular/core';
import { MainTabSwitcherComponent } from './components/main-tab-switcher/main-tab-switcher.component';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from './components/icon/icon.component';
import { BackgroundForSwitcherComponent } from './background-for-switcher/background-for-switcher.component';

@NgModule({
  declarations: [
    MainTabSwitcherComponent,
    IconComponent,
    BackgroundForSwitcherComponent,
  ],
  exports: [
    MainTabSwitcherComponent,
    BackgroundForSwitcherComponent,
    IconComponent
  ],
  imports: [
    MatTabsModule,
    RouterOutlet,
    CommonModule,
  ]
})
export class SharedModule { }
