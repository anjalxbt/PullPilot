import { ParsedEntity, ParsedRelation } from '../types';

export class CodeGraph {
    private nodes: Map<string, ParsedEntity>;
    private edges: Map<string, ParsedRelation[]>;
    private inverseEdges: Map<string, ParsedRelation[]>;

    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.inverseEdges = new Map();
    }

    addNode(node: ParsedEntity) {
        this.nodes.set(node.id, node);
        if (!this.edges.has(node.id)) {
            this.edges.set(node.id, []);
        }
        if (!this.inverseEdges.has(node.id)) {
            this.inverseEdges.set(node.id, []);
        }
    }

    addEdge(relation: ParsedRelation) {
        if (!this.nodes.has(relation.fromId) || !this.nodes.has(relation.toId)) {
            return; // Or handle dynamically
        }

        const forwardEdges = this.edges.get(relation.fromId)!;
        forwardEdges.push(relation);

        const backwardEdges = this.inverseEdges.get(relation.toId)!;
        backwardEdges.push(relation);
    }

    getNode(id: string): ParsedEntity | undefined {
        return this.nodes.get(id);
    }

    getCallers(nodeId: string): ParsedEntity[] {
        const backward = this.inverseEdges.get(nodeId) || [];
        return backward
            .filter((rel) => rel.type === 'CALLS')
            .map((rel) => this.nodes.get(rel.fromId)!)
            .filter(Boolean);
    }

    getCallees(nodeId: string): ParsedEntity[] {
        const forward = this.edges.get(nodeId) || [];
        return forward
            .filter((rel) => rel.type === 'CALLS')
            .map((rel) => this.nodes.get(rel.toId)!)
            .filter(Boolean);
    }

    getImports(nodeId: string): ParsedEntity[] {
        const forward = this.edges.get(nodeId) || [];
        return forward
            .filter((rel) => rel.type === 'IMPORTS')
            .map((rel) => this.nodes.get(rel.toId)!)
            .filter(Boolean);
    }

    getAllNodes(): ParsedEntity[] {
        return Array.from(this.nodes.values());
    }

    // Find impact radius up to depth N
    getImpactRadius(nodeId: string, depth = 3): ParsedEntity[] {
        const impact = new Set<string>();
        const queue = [{ id: nodeId, curDepth: 0 }];

        while (queue.length > 0) {
            const { id, curDepth } = queue.shift()!;
            if (curDepth >= depth) continue;

            const callers = this.getCallers(id);
            for (const caller of callers) {
                if (!impact.has(caller.id)) {
                    impact.add(caller.id);
                    queue.push({ id: caller.id, curDepth: curDepth + 1 });
                }
            }
        }

        return Array.from(impact).map(id => this.nodes.get(id)!);
    }

    serialize(): string {
        return JSON.stringify({
            nodes: Array.from(this.nodes.entries()),
            edges: Array.from(this.edges.entries()),
            inverseEdges: Array.from(this.inverseEdges.entries()),
        });
    }

    deserialize(data: string) {
        const parsed = JSON.parse(data);
        this.nodes = new Map(parsed.nodes);
        this.edges = new Map(parsed.edges);
        this.inverseEdges = new Map(parsed.inverseEdges);
    }
}
