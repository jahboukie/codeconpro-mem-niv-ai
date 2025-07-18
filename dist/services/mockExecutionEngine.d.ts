/**
 * Mock Execution Engine for AI Integration
 * This will be replaced with the real execution engine later
 */
export interface ExecutionRequest {
    id: string;
    language: 'javascript' | 'typescript' | 'python' | 'go' | 'rust';
    code: string;
    tests?: string[];
    dependencies?: string[];
    timeout?: number;
    memoryLimit?: string;
    projectContext?: any;
}
export interface ExecutionResult {
    id: string;
    success: boolean;
    output: string;
    errors: string[];
    exitCode: number;
    executionTime: number;
    memoryUsage: number;
    testResults?: any[];
    performanceMetrics?: any;
    securityReport?: any;
    improvements?: {
        codeImprovements: string[];
        performanceOptimizations: string[];
        securityEnhancements: string[];
    };
}
export declare class ExecutionEngine {
    constructor(sandboxDir?: string);
    executeCode(request: ExecutionRequest): Promise<ExecutionResult>;
}
export default ExecutionEngine;
//# sourceMappingURL=mockExecutionEngine.d.ts.map