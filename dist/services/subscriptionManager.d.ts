import { SubscriptionInfo, UsageStats } from './memoryEngine';
export declare class SubscriptionManager {
    private configPath;
    private subscription;
    constructor(projectPath: string);
    initialize(): Promise<void>;
    loadSubscription(): Promise<SubscriptionInfo | null>;
    saveSubscription(): Promise<void>;
    createFreeSubscription(): Promise<void>;
    createTrialSubscription(): Promise<void>;
    checkAndResetMonthlyUsage(): Promise<void>;
    canExecute(): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    canTrackFile(): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    recordExecution(): Promise<void>;
    recordFileTracked(): Promise<void>;
    getUsageStats(): UsageStats | null;
    getSubscriptionStatus(): SubscriptionInfo | null;
    activatePaidSubscription(userId: string): Promise<void>;
    getTrialDaysRemaining(): number;
    getUsageSummary(): string;
    extendTrial(days: number): Promise<void>;
}
//# sourceMappingURL=subscriptionManager.d.ts.map