import { EntityType } from '@repo/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'entity_metadata' })
@Index('ux_entity_metadata_entity_unique', ['entity_type', 'entity_id'], {
  unique: true,
})
export class MetadataEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EntityType,
    default: EntityType.Property,
  })
  entity_type: EntityType;

  @Column({ type: 'uuid' })
  entity_id: string;

  @Column({ type: 'jsonb', nullable: false, default: () => "'{}'::jsonb" })
  fields: unknown;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
