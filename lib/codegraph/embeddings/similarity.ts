import { ParsedEntity } from '../types';

export function findSimilarFunctions(target: ParsedEntity, allFunctions: ParsedEntity[]): ParsedEntity[] {
    // A naive structural / naming similarity for MVP
    // In a real env, could use embeddings (cosine similarity)

    const targetWords = target.name.split(/(?=[A-Z])/).map(s => s.toLowerCase());

    const scored = allFunctions.map(func => {
        if (func.id === target.id) return { func, score: 0 };

        const funcWords = func.name.split(/(?=[A-Z])/).map(s => s.toLowerCase());
        const intersection = targetWords.filter(w => funcWords.includes(w));

        // Naive Jaccard similarity
        const score = intersection.length / (new Set([...targetWords, ...funcWords]).size);
        return { func, score };
    });

    return scored
        .filter(s => s.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .map(s => s.func)
        .slice(0, 3); // top 3
}
