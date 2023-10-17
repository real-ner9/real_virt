import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent {
  @Input() page: 'requests' | 'matches' = 'requests';
  handleCancel() {
    console.log('handleCancel');
  }

  handleApprove() {
    console.log('handleApprove');
  }

  handleRequest() {
    console.log('handleRequest');
  }

  handleCancelRequest() {
    console.log('handleCancelRequest');
  }
}
