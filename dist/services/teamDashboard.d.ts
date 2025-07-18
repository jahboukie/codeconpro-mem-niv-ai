/**
 * Team Dashboard Engine - Real-time Team Intelligence Visualization
 * Worth every penny of that $1,000/seat/month price tag
 */
import { TeamMemoryEngine, TeamAnalytics, TeamMember, TeamMemory } from './teamMemoryEngine';
export interface DashboardData {
    teamOverview: TeamOverview;
    analytics: TeamAnalytics;
    recentActivity: ActivityFeed[];
    knowledgeGraph: KnowledgeGraphNode[];
    topMemories: TeamMemory[];
    memberStats: MemberDashboardStats[];
    alerts: DashboardAlert[];
}
export interface TeamOverview {
    teamName: string;
    memberCount: number;
    totalMemories: number;
    activeProjects: number;
    teamScore: number;
    trend: 'up' | 'down' | 'stable';
    lastUpdated: Date;
}
export interface ActivityFeed {
    id: string;
    type: 'memory_created' | 'memory_used' | 'member_joined' | 'vote_cast' | 'comment_added';
    actor: string;
    actorName: string;
    target?: string;
    targetName?: string;
    timestamp: Date;
    impact: 'high' | 'medium' | 'low';
    description: string;
}
export interface KnowledgeGraphNode {
    id: string;
    name: string;
    type: 'memory' | 'member' | 'project' | 'tag';
    size: number;
    connections: string[];
    x: number;
    y: number;
    color: string;
    metadata: Record<string, any>;
}
export interface MemberDashboardStats {
    member: TeamMember;
    stats: {
        memoriesCreated: number;
        memoriesUsed: number;
        successRate: number;
        collaborationScore: number;
        recentActivity: number;
        streak: number;
        badges: string[];
    };
    trend: 'up' | 'down' | 'stable';
}
export interface DashboardAlert {
    id: string;
    type: 'knowledge_gap' | 'low_engagement' | 'quality_issue' | 'collaboration_opportunity';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    actionable: boolean;
    suggestedAction?: string;
    timestamp: Date;
}
export declare class TeamDashboard {
    private teamMemoryEngine;
    private app;
    private port;
    constructor(teamMemoryEngine: TeamMemoryEngine, port?: number);
    private setupRoutes;
    getMemberDetailedStats(memberId: string): Promise<MemberDashboardStats | null>;
    generateDashboardData(): Promise<DashboardData>;
    private generateTeamOverview;
    private getActivityFeed;
    private generateKnowledgeGraph;
    private getTopMemories;
    private generateMemberStats;
    private generateAlerts;
    private calculateOverallTeamScore;
    private calculateTrend;
    private getMemoryColor;
    private calculateCollaborationScore;
    private calculateRecentActivity;
    private calculateStreak;
    private calculateBadges;
    private calculateMemberTrend;
    start(): Promise<void>;
    generateDashboardHTML(): Promise<string>;
}
export default TeamDashboard;
//# sourceMappingURL=teamDashboard.d.ts.map