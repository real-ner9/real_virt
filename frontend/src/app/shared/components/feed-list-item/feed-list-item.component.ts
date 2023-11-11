import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../models/user';
import { UserRoleMap } from '../../models/user-role';
import { ComplaintTypeMap, ComplaintType } from '../../models/complaint';
import { UserFacade } from '../../store/user.facade';


@Component({
  selector: 'app-feed-list-item',
  templateUrl: './feed-list-item.component.html',
  styleUrls: ['./feed-list-item.component.scss']
})
export class FeedListItemComponent {
  @Input() page: 'feed' | 'likes' = 'feed';
  @Input() value?: User;

  @Output() like = new EventEmitter<number>();
  @Output() dislike = new EventEmitter<number>();

  likedUser: Set<number> = new Set()

  protected UserRoleMap = UserRoleMap;
  protected readonly ComplaintType = ComplaintType;
  complaints = Object.keys(ComplaintTypeMap).map((complaint) => ({
    label: ComplaintTypeMap[complaint as ComplaintType],
    value: complaint as ComplaintType,
  }))

  constructor(private readonly userFacade: UserFacade) {}

  handleDislike(user: User) {
    this.likedUser.add(user.id);
    this.dislike.emit(user.id);
  }

  handleLike(user: User) {
    this.likedUser.add(user.id);
    this.like.emit(user.id);
  }

  onReport(complaint: ComplaintType) {
    this.value?.id && this.userFacade.reportUser(this.value.id, complaint);
    this.value && this.likedUser.add(this.value.id);
  }
  onBlockUser() {
    this.value?.id && this.userFacade.blockUser(this.value.id);
    this.value && this.likedUser.add(this.value.id);
  }
}
