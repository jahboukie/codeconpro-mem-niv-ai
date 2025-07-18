/**
 * Team Memory Engine - Shared Intelligence System
 * The core that enables team superintelligence
 */
import { MemoryEngine } from './memoryEngine';
export interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'developer' | 'observer';
    joinedAt: Date;
    lastActive: Date;
    permissions: TeamPermissions;
}
export interface TeamPermissions {
    canCreateMemories: boolean;
    canEditMemories: boolean;
    canDeleteMemories: boolean;
    canViewPrivateMemories: boolean;
    canManageTeam: boolean;
    canAccessAnalytics: boolean;
}
export interface TeamMemory {
    id: string;
    type: 'architectural_decision' | 'code_pattern' | 'conversation' | 'best_practice' | 'lesson_learned';
    title: string;
    content: string;
    context: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    visibility: 'public' | 'private' | 'team_only';
    projectId?: string;
    metadata: Record<string, any>;
    votes: TeamMemoryVote[];
    comments: TeamMemoryComment[];
    usageCount: number;
    successScore: number;
}
export interface TeamMemoryVote {
    memberId: string;
    vote: 'upvote' | 'downvote';
    timestamp: Date;
}
export interface TeamMemoryComment {
    id: string;
    memberId: string;
    content: string;
    timestamp: Date;
    parentCommentId?: string;
}
export interface TeamProject {
    id: string;
    name: string;
    description: string;
    techStack: string[];
    createdBy: string;
    createdAt: Date;
    members: string[];
    memoryCount: number;
    lastActivity: Date;
}
export interface TeamAnalytics {
    totalMemories: number;
    activeMemories: number;
    topContributors: ContributorStats[];
    memoryGrowthRate: number;
    teamProductivityScore: number;
    knowledgeHealthScore: number;
    collaborationIndex: number;
    memoryUtilizationRate: number;
}
export interface ContributorStats {
    memberId: string;
    name: string;
    memoriesCreated: number;
    memoriesUsed: number;
    successScore: number;
    lastContribution: Date;
}
export declare class TeamMemoryEngine extends MemoryEngine {
    private teamId;
    private teamDbPath;
    constructor(teamId: string, projectPath: string);
    initialize(): Promise<void>;
    private createTeamTables;
    /**
     * Team Member Management
     */
    addTeamMember(member: Omit<TeamMember, 'id' | 'joinedAt' | 'lastActive'>): Promise<string>;
    getTeamMembers(): Promise<TeamMember[]>;
    /**
     * Team Memory Management
     */
    createTeamMemory(memory: Omit<TeamMemory, 'id' | 'createdAt' | 'updatedAt' | 'votes' | 'comments' | 'usageCount' | 'successScore'>): Promise<string>;
    getTeamMemories(filter?: {
        type?: string;
        createdBy?: string;
        projectId?: string;
        visibility?: string;
        tags?: string[];
    }): Promise<TeamMemory[]>;
    searchTeamMemories(query: string, memberId?: string): Promise<TeamMemory[]>;
    /**
     * Memory Voting System
     */
    voteOnMemory(memoryId: string, memberId: string, vote: 'upvote' | 'downvote'): Promise<void>;
    private getMemoryVotes;
    private updateMemorySuccessScore;
    /**
     * Memory Comments System
     */
    addMemoryComment(memoryId: string, memberId: string, content: string, parentCommentId?: string): Promise<string>;
    private getMemoryComments;
    /**
     * Memory Usage Tracking
     */
    trackMemoryUsage(memoryId: string, usedBy: string, context: string, success: boolean): Promise<void>;
    /**
     * Team Analytics
     */
    getTeamAnalytics(): Promise<TeamAnalytics>;
    private calculateProductivityScore;
    private calculateKnowledgeHealthScore;
    private calculateCollaborationIndex;
    private calculateUtilizationRate;
}
export default TeamMemoryEngine;
//# sourceMappingURL=teamMemoryEngine.d.ts.map