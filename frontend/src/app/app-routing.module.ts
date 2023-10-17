import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileMatchModule } from './profile-match/profile-match.module';
import { FeedModule } from './feed/feed.module';
import { SettingsModule } from './settings/settings.module';

const routes: Routes = [
  // { path: '**', component: PageNotFoundComponent },
  { path: '', redirectTo: 'matches', pathMatch: 'full' },
  { path: 'matches', loadChildren: () => ProfileMatchModule },
  { path: 'feed', loadChildren: () => FeedModule },
  { path: 'settings', loadChildren: () => SettingsModule },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
