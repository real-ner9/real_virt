import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class UserEntity {
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
}
