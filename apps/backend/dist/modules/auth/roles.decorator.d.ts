export declare const ROLES_KEY = "roles";
export type AppRole = 'admin' | 'dispatcher' | 'support' | 'driver';
export declare const Roles: (...roles: AppRole[]) => import("@nestjs/common").CustomDecorator<string>;
