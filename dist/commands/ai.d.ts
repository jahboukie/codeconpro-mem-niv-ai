/**
 * AI Command - The Ultimate Developer Experience
 * Combines Claude/GPT with Memory + Execution = CURSOR KILLER
 */
import { Command } from 'commander';
export declare class AICommand {
    private aiManager;
    private memoryEngine;
    private executionEngine;
    constructor();
    /**
     * Register AI commands
     */
    register(program: Command): void;
    /**
     * Handle chat command
     */
    private handleChat;
    /**
     * Handle single provider response
     */
    private handleSingleProvider;
    /**
     * Handle provider comparison
     */
    private handleCompareProviders;
    /**
     * Handle setup command
     */
    private handleSetup;
    /**
     * Handle switch provider command
     */
    private handleSwitchProvider;
    /**
     * Handle status command
     */
    private handleStatus;
    /**
     * Handle interactive mode
     */
    private handleInteractiveMode;
    /**
     * Ensure AI providers are initialized
     */
    private ensureInitialized;
    /**
     * Get current project context
     */
    private getProjectContext;
    /**
     * Get file context
     */
    private getFileContext;
    /**
     * Infer tech stack from package.json
     */
    private inferTechStack;
}
export default AICommand;
//# sourceMappingURL=ai.d.ts.map