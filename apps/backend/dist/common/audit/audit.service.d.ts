import { Repository } from 'typeorm';
import { AuditLogEntity } from './audit.entity.js';
export declare class AuditService {
    private readonly repo;
    constructor(repo: Repository<AuditLogEntity>);
    log(actor: string, action: string, details?: Record<string, unknown>): Promise<AuditLogEntity>;
}
