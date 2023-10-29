import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserState } from '../types/user-state';
import { UserRole } from '../types/user-role';
import { Like } from './like.entity';
import { Dislike } from './dislike.entity';
import { UserLiked } from './user-liked.entity';
import { Match } from './match.entity';
import { Connection } from './connection.entity';
import { ChatRequest } from './chat-request.entity';
import { UserBlock } from './user-block.entity';
import { ComplaintType, UserComplaint } from './user.complaint.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  activeRoom: string;

  @Column('text', { array: true, nullable: true })
  pastPartners: string[];

  @Column({ type: 'text', nullable: true })
  currentPartner: string;

  @Column({ type: 'bigint', nullable: true })
  lastCleaned: number;

  @Column({ type: 'bigint', nullable: true })
  lastSearchTimestamp: number;

  @Column({ type: 'bigint', nullable: true })
  lastNotificationTimestamp: number;

  @Column({ type: 'text', nullable: false, unique: true })
  userId: string;

  // Эта блокировка не связана с основной блокировкой
  // она предназначена для того, когда челов сам блокирует бота
  @Column({ default: false })
  isBlocked: boolean;

  @Column({ default: true })
  enableNotification: boolean;

  @Column({ type: 'bigint', nullable: true })
  lastMessageTimestamp: number;

  @Column({ type: 'text', default: UserState.QUICK_SEARCH })
  state: UserState;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @Column({ type: 'text', nullable: true })
  role: UserRole;

  @Column({ default: false })
  isVisibleToOthers: boolean;

  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  username: string;

  @Column({ default: false })
  showUsername: boolean;

  @Column({ default: false })
  online: boolean;

  @Column({ type: 'bigint', nullable: true })
  lastLoginTimestamp: number;

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Dislike, (dislike) => dislike.user)
  dislikes: Dislike[];

  @OneToMany(() => UserLiked, (userLiked) => userLiked.user)
  userLikes: UserLiked[];

  @OneToMany(() => Match, (match) => match.user)
  matches: Match[];

  @OneToMany(() => Connection, (connection) => connection.user)
  connections: Connection[];

  /**
   * Отношение к таблице ChatRequest, где текущий пользователь является отправителем запроса на чат.
   * Это позволяет получить все запросы на чат, отправленные этим пользователем.
   */
  @OneToMany(() => ChatRequest, (chatRequest) => chatRequest.sender)
  sentRequests: ChatRequest[];

  /**
   * Отношение к таблице ChatRequest, где текущий пользователь является получателем запроса на чат.
   * Это позволяет получить все запросы на чат, которые были отправлены этому пользователю.
   */
  @OneToMany(() => ChatRequest, (chatRequest) => chatRequest.receiver)
  receivedRequests: ChatRequest[];

  // жалобы пользователя
  @OneToMany(() => UserComplaint, (userComplaint) => userComplaint.user)
  complaints: UserComplaint[];

  // // юзер может заблокировать пользователя
  @OneToMany(() => UserBlock, (block) => block.user)
  blocks: UserBlock[];

  @Column({ type: 'timestamp', nullable: true })
  blockedUntil: Date | null;

  @Column({ type: 'text', nullable: true })
  blockReason: ComplaintType;

  constructor(userId: string) {
    this.userId = userId;
    this.isBlocked = false;
    this.enableNotification = true;
    this.activeRoom = '';
    this.pastPartners = [];
    this.currentPartner = null;
    this.lastCleaned = Date.now();
    this.lastSearchTimestamp = null;
    this.lastNotificationTimestamp = null;
    this.lastMessageTimestamp = null;
    // По дефолту QUICK_SEARCH
    this.state = UserState.QUICK_SEARCH;
    this.age = null;
    this.description = null;
    this.photoUrl = null;
    this.role = null;
    this.isVisibleToOthers = false;
    this.name = null;
    this.username = null;
    this.showUsername = false;
    this.lastLoginTimestamp = null;
    this.blockedUntil = null;
    this.blockReason = null;
  }
}
