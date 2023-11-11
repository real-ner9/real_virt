import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RequestsRoutingModule } from './requests-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { RequestListComponent } from './request-list/request-list.component';
import { requestsReducer } from './request-list/store/requests.reducer';
import { RequestsEffects } from './request-list/store/requests.effects';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    RequestListComponent,
  ],
  imports: [
    CommonModule,
    RequestsRoutingModule,
    StoreModule.forFeature('requests', requestsReducer),
    EffectsModule.forFeature([RequestsEffects]),
    SharedModule,
  ]
})
export class RequestsModule { }
