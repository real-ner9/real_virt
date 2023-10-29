import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserBlockEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.blocks)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: false })
  blockedUserId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  blockedAt: Date;

  constructor(user: User, blockedUserId: string) {
    this.user = user;
    this.blockedUserId = blockedUserId;
  }
}
