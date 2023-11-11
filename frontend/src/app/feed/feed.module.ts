import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { FeedRoutingModule } from './feed-routing.module';
import { FeedListComponent } from './feed-list/feed-list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { SharedModule } from '../shared/shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { feedReducer } from './feed-list/store/feed.reducer';
import { FeedEffects } from './feed-list/store/feed.effects';
import { IntersectionObserverModule } from '@ng-web-apis/intersection-observer';

@NgModule({
  declarations: [
    FeedListComponent,
  ],
  imports: [
    CommonModule,
    FeedRoutingModule,
    MatTabsModule,
    SharedModule,
    StoreModule.forFeature('feed', feedReducer),
    EffectsModule.forFeature([FeedEffects]),
    IntersectionObserverModule,
  ],
})
export class FeedModule { }
