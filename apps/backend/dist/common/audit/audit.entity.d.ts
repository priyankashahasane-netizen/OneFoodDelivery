export declare class AuditLogEntity {
    id: string;
    createdAt: Date;
    actor: string;
    action: string;
    details: Record<string, unknown> | null;
}
