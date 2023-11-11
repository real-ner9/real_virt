import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileMatchModule } from './profile-match/profile-match.module';
import { FeedModule } from './feed/feed.module';
import { SettingsModule } from './settings/settings.module';
import { RequestsModule } from './requests/requests.module';
import { LikesModule } from './likes/likes.module';

const routes: Routes = [
  // { path: '**', component: PageNotFoundComponent },
  { path: '', redirectTo: 'feed', pathMatch: 'full' },
  { path: 'feed', loadChildren: () => FeedModule },
  { path: 'matches', loadChildren: () => ProfileMatchModule },
  { path: 'settings', loadChildren: () => SettingsModule },
  { path: 'likes', loadChildren: () => LikesModule },
  { path: 'requests', loadChildren: () => RequestsModule },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
