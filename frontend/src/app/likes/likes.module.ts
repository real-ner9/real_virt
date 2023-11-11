import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LikesRoutingModule } from './likes-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { LikeListComponent } from './like-list/like-list.component';
import { likesReducer } from './like-list/store/likes.reducer';
import { LikesEffects } from './like-list/store/likes.effects';
import { SharedModule } from '../shared/shared.module';
import { IntersectionObserverModule } from '@ng-web-apis/intersection-observer';


@NgModule({
  declarations: [
    LikeListComponent,
  ],
  imports: [
    CommonModule,
    LikesRoutingModule,
    StoreModule.forFeature('likes', likesReducer),
    EffectsModule.forFeature([LikesEffects]),
    SharedModule,
    IntersectionObserverModule,
  ]
})
export class LikesModule { }
