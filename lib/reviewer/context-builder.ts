import { findSimilarFunctions } from '../codegraph/embeddings/similarity';
import { RepositoryIndexer } from '../codegraph/indexer/repository-indexer';
import { GraphQueries } from '../codegraph/queries';
import { GraphQueryData } from '../codegraph/types';

export class ContextBuilder {
    private indexer: RepositoryIndexer;
    private queries: GraphQueries;

    constructor(indexer: RepositoryIndexer) {
        this.indexer = indexer;
        this.queries = new GraphQueries(this.indexer.getGraph());
    }

    public async buildEnrichedPrompt(changedFunctions: string[]): Promise<GraphQueryData[]> {
        const contextList: GraphQueryData[] = [];
        const allFunctions = this.indexer.getGraph().getAllNodes().filter(n => n.type === 'function');

        for (const funcName of changedFunctions) {
            const context = this.queries.getContextForFunction(funcName);

            const targetEntity = allFunctions.find(f => f.name === funcName);
            if (targetEntity) {
                const similar = findSimilarFunctions(targetEntity, allFunctions);
                context.similarFunctions = similar.map(s => s.name);
            }

            // Basic heuristic risk analysis
            const callers = context.callers || [];
            const riskAnalysis = [];
            if (callers.some(c => c.toLowerCase().includes('auth') || c.toLowerCase().includes('admin'))) {
                riskAnalysis.push('function affects authentication/admin flows');
            }

            const impacted = this.queries.getImpactRadiusNames(funcName);
            if (impacted.length > 5) {
                riskAnalysis.push(`utility change affects multiple files (${impacted.length} downstream components)`);
            }

            context.riskAnalysis = riskAnalysis;

            // Basic architectural pattern check
            const patterns = [];
            if (funcName.toLowerCase().includes('update') && !context.dependencies.some(d => d.toLowerCase().includes('validate'))) {
                patterns.push('update function does not seem to call validation before writes');
            }
            context.architecturalPatterns = patterns;

            contextList.push(context);
        }

        return contextList;
    }
}
