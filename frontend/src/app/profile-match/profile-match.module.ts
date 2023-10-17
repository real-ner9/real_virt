import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileMatchRoutingModule } from './profile-match-routing.module';
import { ProfileMatchComponent } from './profile-match/profile-match.component';
import { MatchTabSwitcherComponent } from './match-tab-switcher/match-tab-switcher.component';
import { MatTabsModule } from '@angular/material/tabs';
import { RequestListComponent } from './request-list/request-list.component';
import { MatchListComponent } from './match-list/match-list.component';
import { SharedModule } from '../shared/shared.module';
import { ListItemComponent } from './list-item/list-item.component';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
    ProfileMatchComponent,
    MatchTabSwitcherComponent,
    RequestListComponent,
    MatchListComponent,
    ListItemComponent
  ],
  imports: [
    CommonModule,
    ProfileMatchRoutingModule,
    MatTabsModule,
    SharedModule,
    MatButtonModule
  ]
})
export class ProfileMatchModule { }
