import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileMatchRoutingModule } from './profile-match-routing.module';
import { MatchListComponent } from './match-list/match-list.component';
import { SharedModule } from '../shared/shared.module';
import { matchesReducer } from './match-list/store/matches.reducer';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { MatchesEffects } from './match-list/store/matches.effects';


@NgModule({
  declarations: [
    MatchListComponent,
  ],
  imports: [
    CommonModule,
    ProfileMatchRoutingModule,
    SharedModule,
    StoreModule.forFeature('matches', matchesReducer),
    EffectsModule.forFeature([MatchesEffects]),
  ]
})
export class ProfileMatchModule { }
