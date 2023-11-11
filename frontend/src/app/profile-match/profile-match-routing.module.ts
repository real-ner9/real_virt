import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileMatchComponent } from './profile-match/profile-match.component';
import { RequestListComponent } from './request-list/request-list.component';
import { MatchListComponent } from './match-list/match-list.component';

const routes: Routes = [
  { path: '', component: MatchListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileMatchRoutingModule { }
