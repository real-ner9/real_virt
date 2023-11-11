import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { FeedRoutingModule } from './feed-routing.module';
import { FeedTabSwitcherComponent } from './feed-tab-switcher/feed-tab-switcher.component';
import { FeedListComponent } from './feed-list/feed-list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { SharedModule } from '../shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { feedReducer } from './feed-list/store/feed.reducer';
import { FeedEffects } from './feed-list/store/feed.effects';
import { MatChipsModule } from '@angular/material/chips';
import { IntersectionObserverModule } from '@ng-web-apis/intersection-observer';
import { MatMenuModule } from '@angular/material/menu';

@NgModule({
  declarations: [
    FeedTabSwitcherComponent,
    FeedListComponent,
  ],
  imports: [
    CommonModule,
    FeedRoutingModule,
    MatTabsModule,
    SharedModule,
    MatButtonModule,
    InfiniteScrollModule,
    NgOptimizedImage,
    StoreModule.forFeature('feed', feedReducer),
    EffectsModule.forFeature([FeedEffects]),
    MatChipsModule,
    IntersectionObserverModule,
    MatMenuModule,
  ],
})
export class FeedModule { }
