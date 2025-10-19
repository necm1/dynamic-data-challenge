import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from '../../property';
import { ListingStatus } from '@repo/shared';

@Entity({ name: 'listings' })
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.ACTIVE,
  })
  status: ListingStatus;

  @Index()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Index()
  @Column({ type: 'uuid' })
  property_id: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'property_id', referencedColumnName: 'id' })
  property: Property;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
