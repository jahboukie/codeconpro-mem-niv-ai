/**
 * Memory Permissions & Access Control System
 * Enterprise-grade security for $1,000/seat/month teams
 */
import { TeamMemoryEngine } from './teamMemoryEngine';
export interface PermissionRule {
    id: string;
    resourceType: 'memory' | 'project' | 'team' | 'dashboard';
    resourceId?: string;
    subjectType: 'user' | 'role' | 'team';
    subjectId: string;
    permissions: Permission[];
    conditions?: PermissionCondition[];
    createdBy: string;
    createdAt: Date;
    expiresAt?: Date;
    isActive: boolean;
}
export interface Permission {
    action: 'read' | 'write' | 'delete' | 'share' | 'vote' | 'comment' | 'moderate' | 'admin';
    granted: boolean;
    restrictions?: PermissionRestriction[];
}
export interface PermissionCondition {
    type: 'time_window' | 'location' | 'project_context' | 'memory_type' | 'approval_required';
    value: any;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
}
export interface PermissionRestriction {
    type: 'rate_limit' | 'content_filter' | 'approval_workflow' | 'audit_required';
    value: any;
}
export interface AccessRequest {
    id: string;
    requesterId: string;
    requesterName: string;
    resourceType: 'memory' | 'project' | 'team';
    resourceId: string;
    resourceName: string;
    requestedPermissions: Permission[];
    justification: string;
    status: 'pending' | 'approved' | 'denied' | 'expired';
    approvers: string[];
    createdAt: Date;
    approvedAt?: Date;
    approvedBy?: string;
    denyReason?: string;
    expiresAt?: Date;
}
export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    resourceType: string;
    resourceId: string;
    resourceName: string;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
}
export interface PermissionMatrix {
    [role: string]: {
        [action: string]: boolean;
    };
}
export declare class MemoryPermissionsEngine {
    private teamMemoryEngine;
    private permissionRules;
    private accessRequests;
    private auditLogs;
    private defaultPermissions;
    constructor(teamMemoryEngine: TeamMemoryEngine);
    /**
     * Core Permission Checking
     */
    checkPermission(userId: string, action: string, resourceType: string, resourceId?: string, context?: Record<string, any>): Promise<boolean>;
    private checkExplicitPermissions;
    private checkRolePermissions;
    private checkMemoryPermissions;
    private evaluateConditions;
    private isInTimeWindow;
    private checkApprovalStatus;
    /**
     * Permission Rule Management
     */
    createPermissionRule(rule: Omit<PermissionRule, 'id' | 'createdAt'>): Promise<string>;
    updatePermissionRule(ruleId: string, updates: Partial<PermissionRule>, updatedBy: string): Promise<boolean>;
    deletePermissionRule(ruleId: string, deletedBy: string): Promise<boolean>;
    getPermissionRules(filters?: {
        resourceType?: string;
        resourceId?: string;
        subjectId?: string;
        isActive?: boolean;
    }): Promise<PermissionRule[]>;
    /**
     * Access Request Management
     */
    createAccessRequest(request: Omit<AccessRequest, 'id' | 'createdAt' | 'status'>): Promise<string>;
    approveAccessRequest(requestId: string, approverId: string, approverName: string): Promise<boolean>;
    denyAccessRequest(requestId: string, denierId: string, reason: string): Promise<boolean>;
    getAccessRequests(filters?: {
        requesterId?: string;
        status?: string;
        resourceType?: string;
    }): Promise<AccessRequest[]>;
    /**
     * Memory Sharing Functions
     */
    shareMemory(memoryId: string, sharedBy: string, sharedWith: string[], permissions: Permission[], message?: string): Promise<boolean>;
    revokeMemoryAccess(memoryId: string, revokedBy: string, revokedFrom: string): Promise<boolean>;
    /**
     * Audit Logging
     */
    private logAudit;
    getAuditLogs(filters?: {
        userId?: string;
        action?: string;
        resourceType?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<AuditLog[]>;
    /**
     * Bulk Operations
     */
    bulkUpdatePermissions(updates: Array<{
        userId: string;
        resourceType: 'memory' | 'project' | 'team' | 'dashboard';
        resourceId?: string;
        permissions: Permission[];
    }>, updatedBy: string): Promise<boolean>;
    /**
     * Compliance & Reporting
     */
    generateComplianceReport(startDate: Date, endDate: Date): Promise<{
        totalActions: number;
        uniqueUsers: number;
        permissionChanges: number;
        accessRequests: number;
        securityEvents: number;
        topActions: Array<{
            action: string;
            count: number;
        }>;
        riskEvents: AuditLog[];
    }>;
}
export default MemoryPermissionsEngine;
//# sourceMappingURL=memoryPermissions.d.ts.map