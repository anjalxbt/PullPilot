import Parser from 'tree-sitter';
import ts from 'tree-sitter-typescript';
import { ParsedEntity, ParsedRelation } from '../types';

interface ParseResult {
    entities: ParsedEntity[];
    relations: ParsedRelation[];
}

export class TreeSitterParser {
    private parser: Parser;

    constructor(language: 'typescript' | 'tsx' = 'typescript') {
        this.parser = new Parser();
        // tree-sitter-typescript exports { typescript, tsx }
        const grammar = language === 'tsx' ? ts.tsx : ts.typescript;
        this.parser.setLanguage(grammar as unknown as Parser.Language);
    }

    parseFile(filePath: string, code: string): ParseResult {
        const tree = this.parser.parse(code);
        const entities: ParsedEntity[] = [];
        const relations: ParsedRelation[] = [];

        const fileNodeId = `file:${filePath}`;
        entities.push({
            id: fileNodeId,
            type: 'file',
            name: filePath.split('/').pop() || filePath,
            filePath,
            startLine: 0,
            endLine: tree.rootNode.endPosition.row,
        });

        const traverse = (node: Parser.SyntaxNode, parentEntityId?: string) => {
            let currentEntityId = parentEntityId;

            if (node.type === 'function_declaration' || node.type === 'method_definition' || node.type === 'arrow_function') {
                const nameNode = node.childForFieldName('name') ||
                    (node.parent?.type === 'variable_declarator' ? node.parent.childForFieldName('name') : null);

                if (nameNode) {
                    const name = nameNode.text;
                    const entityId = `func:${filePath}:${name}`;
                    currentEntityId = entityId;

                    entities.push({
                        id: entityId,
                        type: 'function',
                        name,
                        filePath,
                        startLine: node.startPosition.row,
                        endLine: node.endPosition.row,
                    });

                    relations.push({
                        fromId: fileNodeId,
                        toId: entityId,
                        type: 'DEFINES',
                    });
                }
            }

            if (node.type === 'class_declaration') {
                const nameNode = node.childForFieldName('name');
                if (nameNode) {
                    const name = nameNode.text;
                    const entityId = `class:${filePath}:${name}`;
                    currentEntityId = entityId;

                    entities.push({
                        id: entityId,
                        type: 'class',
                        name,
                        filePath,
                        startLine: node.startPosition.row,
                        endLine: node.endPosition.row,
                    });

                    relations.push({
                        fromId: fileNodeId,
                        toId: entityId,
                        type: 'DEFINES',
                    });
                }
            }

            // Track imports
            if (node.type === 'import_statement') {
                const sourceNode = node.childForFieldName('source');
                if (sourceNode) {
                    const importPath = sourceNode.text.replace(/['"]/g, '');
                    relations.push({
                        fromId: fileNodeId,
                        toId: `file:${importPath}`, // Basic resolution lacking full module res
                        type: 'IMPORTS',
                    });
                }
            }

            if (node.type === 'call_expression') {
                const funcNode = node.childForFieldName('function');
                if (funcNode && currentEntityId) {
                    const calleeName = funcNode.text;
                    relations.push({
                        fromId: currentEntityId,
                        toId: `func:UNKNOWN:${calleeName}`, // Abstract id since exact file resolution requires a second pass
                        type: 'CALLS',
                    });
                }
            }

            for (let i = 0; i < node.childCount; i++) {
                traverse(node.child(i)!, currentEntityId);
            }
        };

        traverse(tree.rootNode, fileNodeId);

        return { entities, relations };
    }
}
