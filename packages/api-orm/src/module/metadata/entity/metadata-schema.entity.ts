import { EntityType } from '@repo/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FieldType } from '@repo/shared';
import type { MetadataValidationRule } from '../interface/metadata-validation-rule.interface';

@Entity('metadata_schemas')
@Index(['entity_type', 'field_key'], { unique: true })
export class MetadataSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EntityType,
    default: EntityType.Property,
  })
  entity_type: EntityType;

  @Column({ type: 'varchar', length: 100 })
  field_key: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  field_label?: string;

  @Column({ type: 'enum', enum: FieldType })
  field_type: FieldType;

  @Column({ type: 'jsonb', nullable: true })
  validation_rules?: MetadataValidationRule;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
