export interface ParsedEntity {
    id: string;
    type: "function" | "class" | "file" | "variable";
    name: string;
    filePath: string;
    startLine: number;
    endLine: number;
    code?: string; // Optional full snippet if needed
}

export interface ParsedRelation {
    fromId: string;
    toId: string;
    type: "CALLS" | "IMPORTS" | "USES" | "DEFINES";
}

export interface GraphQueryData {
    changedFunction?: string;
    callers: string[];
    dependencies: string[];
    similarFunctions?: string[];
    architecturalPatterns?: string[];
    riskAnalysis?: string[];
}
