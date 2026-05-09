import { CodeGraph } from '../graph/CodeGraph';
import { GraphQueryData, ParsedEntity } from '../types';

export class GraphQueries {
    private graph: CodeGraph;

    constructor(graph: CodeGraph) {
        this.graph = graph;
    }

    public getContextForFunction(functionName: string, filePath?: string): GraphQueryData {
        // Attempt to resolve the exact function or find the first matching one
        let targetNode: ParsedEntity | undefined;

        if (filePath) {
            targetNode = this.graph.getNode(`func:${filePath}:${functionName}`);
        }

        if (!targetNode) {
            // Find matching function name
            const allNodes = this.graph.getAllNodes();
            targetNode = allNodes.find(n => n.type === 'function' && n.name === functionName);
        }

        if (!targetNode) {
            return { callers: [], dependencies: [] };
        }

        const callers = this.graph.getCallers(targetNode.id).map(n => n.name);
        const callees = this.graph.getCallees(targetNode.id).map(n => n.name);
        const imports = this.graph.getImports(targetNode.id).map(n => n.name);

        return {
            changedFunction: targetNode.name,
            callers: Array.from(new Set(callers)),
            dependencies: Array.from(new Set([...callees, ...imports])),
        };
    }

    public getImpactRadiusNames(functionName: string): string[] {
        const allNodes = this.graph.getAllNodes();
        const targetNode = allNodes.find(n => n.type === 'function' && n.name === functionName);
        if (!targetNode) return [];

        const impacted = this.graph.getImpactRadius(targetNode.id, 2);
        return Array.from(new Set(impacted.map(n => n.name)));
    }
}
