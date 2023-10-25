import { Component, OnDestroy, OnInit } from '@angular/core';
import { RequestsFacade } from './store/requests.facade';

@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss']
})
export class RequestListComponent implements OnInit, OnDestroy {
  requests$ = this.requestsFacade.requests$;
  loading$ = this.requestsFacade.loading$;
  error$ = this.requestsFacade.error$;

  constructor(private requestsFacade: RequestsFacade) {}

  ngOnInit() {
    this.requestsFacade.loadRequests();
  }

  onRequestRemoved(requestId: number) {
    this.requestsFacade.removeRequest(requestId);
  }

  onApprove(id: number) {
    this.requestsFacade.approveRequest(id);
  }

  onCancel(id: number) {
    this.requestsFacade.cancelRequest(id);
  }

  ngOnDestroy() {
    this.requestsFacade.clearRequests();
  }
}
