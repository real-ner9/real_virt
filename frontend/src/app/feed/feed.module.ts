import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { FeedRoutingModule } from './feed-routing.module';
import { FeedComponent } from './feed/feed.component';
import { FeedTabSwitcherComponent } from './feed-tab-switcher/feed-tab-switcher.component';
import { ListItemComponent } from './list-item/list-item.component';
import { FeedListComponent } from './feed-list/feed-list.component';
import { LikeListComponent } from './like-list/like-list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { SharedModule } from '../shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { feedReducer } from './feed-list/store/feed.reducer';
import { FeedEffects } from './feed-list/store/feed.effects';
import { likesReducer } from './like-list/store/likes.reducer';
import { LikesEffects } from './like-list/store/likes.effects';
import { MatChipsModule } from '@angular/material/chips';
import { IntersectionObserverModule } from '@ng-web-apis/intersection-observer';
import { MatMenuModule } from '@angular/material/menu';

@NgModule({
  declarations: [
    FeedComponent,
    FeedTabSwitcherComponent,
    ListItemComponent,
    FeedListComponent,
    LikeListComponent
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
    StoreModule.forFeature('likes', likesReducer),
    EffectsModule.forFeature([LikesEffects]),
    MatChipsModule,
    IntersectionObserverModule,
    MatMenuModule,
  ],
})
export class FeedModule { }
