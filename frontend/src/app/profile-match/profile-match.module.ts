import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { ProfileMatchRoutingModule } from './profile-match-routing.module';
import { ProfileMatchComponent } from './profile-match/profile-match.component';
import { MatchTabSwitcherComponent } from './match-tab-switcher/match-tab-switcher.component';
import { MatTabsModule } from '@angular/material/tabs';
import { RequestListComponent } from './request-list/request-list.component';
import { MatchListComponent } from './match-list/match-list.component';
import { SharedModule } from '../shared/shared.module';
import { ListItemComponent } from './list-item/list-item.component';
import { MatButtonModule } from '@angular/material/button';
import { matchesReducer } from './match-list/store/matches.reducer';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { MatchesEffects } from './match-list/store/matches.effects';
import { requestsReducer } from './request-list/store/requests.reducer';
import { RequestsEffects } from './request-list/store/requests.effects';
import { MatChipsModule } from '@angular/material/chips';


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
    MatButtonModule,
    StoreModule.forFeature('matches', matchesReducer),
    EffectsModule.forFeature([MatchesEffects]),
    StoreModule.forFeature('requests', requestsReducer),
    EffectsModule.forFeature([RequestsEffects]),
    NgOptimizedImage,
    MatChipsModule,
  ]
})
export class ProfileMatchModule { }
