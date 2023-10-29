import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ComplaintType {
  // Неприемлемый контент
  UNACCEPTABLE_CONTENT = 'UNACCEPTABLE_CONTENT',
  // Оскорбительное поведение
  OFFENSIVE_BEHAVIOR = 'OFFENSIVE_BEHAVIOR',
  // Возрастное нарушение
  AGE_VIOLATION = 'AGE_VIOLATION',
}

@Entity()
export class UserComplaint {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.complaints)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user: User;

  @Column({ type: 'text' })
  reportedUserId: string;

  @Column({ type: 'text' })
  reason: ComplaintType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  reportedAt: Date;

  constructor(user: User, reportedUserId: string, reason: ComplaintType) {
    this.user = user;
    this.reportedUserId = reportedUserId;
    this.reason = reason;
  }
}
