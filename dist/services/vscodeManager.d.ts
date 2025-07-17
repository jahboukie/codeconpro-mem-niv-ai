export declare class VSCodeExtensionManager {
    private extensionId;
    private extensionPath;
    constructor();
    ensureExtensionInstalled(): Promise<void>;
    configureForProject(projectPath: string): Promise<void>;
    private createPlaceholderExtension;
    isExtensionInstalled(): Promise<boolean>;
    getExtensionVersion(): Promise<string>;
    checkVSCodeInstallation(): Promise<boolean>;
    installExtensionFromMarketplace(): Promise<void>;
    uninstallExtension(): Promise<void>;
    openProjectInVSCode(projectPath: string): Promise<void>;
    createExtensionDevelopmentEnvironment(projectPath: string): Promise<void>;
}
//# sourceMappingURL=vscodeManager.d.ts.map