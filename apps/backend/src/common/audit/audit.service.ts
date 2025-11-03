import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './audit.entity.js';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLogEntity) private readonly repo: Repository<AuditLogEntity>) {}

  async log(actor: string, action: string, details?: Record<string, unknown>) {
    const row = this.repo.create({ actor, action, details: details ?? null });
    return this.repo.save(row);
  }
}



