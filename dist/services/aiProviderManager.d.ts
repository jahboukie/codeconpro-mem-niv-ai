/**
 * AI Provider Manager - The Ultimate AI Integration System
 * Supports Claude, GPT, and any future AI provider
 * With persistent memory and execution capabilities
 */
import { MemoryEngine } from './memoryEngine';
import { ExecutionEngine } from './mockExecutionEngine';
export interface AIProvider {
    name: string;
    model: string;
    apiKey: string;
    capabilities: AICapability[];
}
export interface AICapability {
    type: 'chat' | 'code_generation' | 'code_analysis' | 'debugging';
    supportedLanguages: string[];
    maxTokens: number;
}
export interface EnhancedAIRequest {
    message: string;
    projectContext?: ProjectContext;
    codeContext?: string[];
    executionRequired?: boolean;
    memoryRetrieval?: boolean;
}
export interface EnhancedAIResponse {
    response: string;
    code?: GeneratedCode[];
    executionResults?: ExecutionResult[];
    memoryUpdates?: MemoryUpdate[];
    confidence: number;
    reasoning: string;
}
export interface GeneratedCode {
    language: string;
    code: string;
    filePath?: string;
    description: string;
    tests?: string[];
}
export interface ProjectContext {
    projectId: string;
    workingDirectory: string;
    techStack: string[];
    recentChanges: FileChange[];
    dependencies: Record<string, string>;
}
export declare class AIProviderManager {
    private anthropic;
    private openai;
    private memoryEngine;
    private executionEngine;
    private activeProvider;
    constructor(memoryEngine: MemoryEngine, executionEngine: ExecutionEngine);
    /**
     * Initialize AI providers with API keys
     */
    initializeProviders(config: {
        anthropicKey?: string;
        openaiKey?: string;
        defaultProvider: 'claude' | 'gpt';
    }): Promise<void>;
    /**
     * Enhanced AI chat with memory and execution
     */
    enhancedChat(request: EnhancedAIRequest): Promise<EnhancedAIResponse>;
    /**
     * Switch AI provider on the fly
     */
    switchProvider(provider: 'claude' | 'gpt'): Promise<void>;
    /**
     * Compare responses from multiple providers
     */
    compareProviders(request: EnhancedAIRequest): Promise<{
        claude?: EnhancedAIResponse;
        gpt?: EnhancedAIResponse;
        recommendation: 'claude' | 'gpt';
        reasoning: string;
    }>;
    private buildEnhancedContext;
    private sendToAI;
    private parseAIResponse;
    private updateMemory;
    private calculateConfidence;
    private generateReasoning;
    private determineRecommendation;
    private generateComparisonReasoning;
}
interface ExecutionResult {
    id: string;
    success: boolean;
    output: string;
    errors: string[];
    exitCode: number;
    executionTime: number;
    memoryUsage: number;
}
interface MemoryUpdate {
    type: string;
    content: string;
}
interface FileChange {
    path: string;
    type: 'added' | 'modified' | 'deleted';
    timestamp: Date;
}
export default AIProviderManager;
//# sourceMappingURL=aiProviderManager.d.ts.map