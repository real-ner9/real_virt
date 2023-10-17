import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeedComponent } from './feed/feed.component';
import { FeedListComponent } from './feed-list/feed-list.component';
import { LikeListComponent } from './like-list/like-list.component';

const routes: Routes = [
  { path: '', component: FeedComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: FeedListComponent },
      { path: 'likes', component: LikeListComponent },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FeedRoutingModule { }
