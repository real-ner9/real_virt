import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LikeListComponent } from './like-list/like-list.component';

const routes: Routes = [
  { path: '', component: LikeListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LikesRoutingModule { }
