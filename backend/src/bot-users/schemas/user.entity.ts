import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserState } from '../types/user-state';
import { UserRole } from '../types/user-role';
import { Like } from './like.entity';
import { Dislike } from './dislike.entity';
import { UserLiked } from './user-liked.entity';
import { Match } from './match.entity';
import { Connection } from './connection.entity';

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

  @Column({ type: 'text', nullable: true })
  username: string;

  @Column({ default: false })
  showUsername: boolean;

  @Column({ default: false })
  online: boolean;

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
  }
}
