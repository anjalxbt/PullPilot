import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { CodeGraph } from '../graph/CodeGraph';
import { TreeSitterParser } from '../parsers/tree-sitter';

const CACHE_FILE = path.join(process.cwd(), '.codegraph-cache.json');

export class RepositoryIndexer {
    private graph: CodeGraph;
    private fileHashes: Map<string, string>;

    constructor() {
        this.graph = new CodeGraph();
        this.fileHashes = new Map();
    }

    public getGraph(): CodeGraph {
        return this.graph;
    }

    public async loadCache(): Promise<boolean> {
        try {
            if (fs.existsSync(CACHE_FILE)) {
                const data = fs.readFileSync(CACHE_FILE, 'utf-8');
                const parsed = JSON.parse(data);
                this.graph.deserialize(parsed.graph);
                this.fileHashes = new Map(parsed.hashes);
                return true;
            }
        } catch (e) {
            console.error('Failed to load code graph cache', e);
        }
        return false;
    }

    public async saveCache() {
        try {
            const data = JSON.stringify({
                graph: this.graph.serialize(),
                hashes: Array.from(this.fileHashes.entries()),
            });
            fs.writeFileSync(CACHE_FILE, data, 'utf-8');
        } catch (e) {
            console.error('Failed to save code graph cache', e);
        }
    }

    private hashFile(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
                    arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
                }
            } else {
                if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
                    arrayOfFiles.push(fullPath);
                }
            }
        });

        return arrayOfFiles;
    }

    public async indexRepository(repoPath: string) {
        const allFiles = this.getAllFiles(repoPath);
        let changed = false;

        // TODO: parallel parsing workers mapping to promises
        for (const filePath of allFiles) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const hash = this.hashFile(content);

            if (this.fileHashes.get(filePath) !== hash) {
                this.fileHashes.set(filePath, hash);
                changed = true;

                // Determine parser language
                const lang = filePath.endsWith('.tsx') || filePath.endsWith('.jsx') ? 'tsx' : 'typescript';
                const parser = new TreeSitterParser(lang);

                try {
                    const { entities, relations } = parser.parseFile(filePath, content);

                    entities.forEach(entity => this.graph.addNode(entity));
                    relations.forEach(relation => this.graph.addEdge(relation));
                } catch (e) {
                    console.error(`Failed to parse ${filePath}`, e);
                }
            }
        }

        if (changed) {
            await this.saveCache();
        }
    }
}
