import { CreateDateColumn, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ length: 64 })
  actor!: string;

  @Column({ length: 64 })
  action!: string;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;
}



