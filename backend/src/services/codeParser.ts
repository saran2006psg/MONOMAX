import { Project, SourceFile, SyntaxKind, ts } from 'ts-morph';
import fs from 'fs/promises';
import path from 'path';
import { FileUtils } from '../utils/fileUtils.js';

export interface CodeSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'variable' | 'import' | 'export';
  line: number;
  column: number;
  signature?: string;
}

export interface ParsedFile {
  path: string;
  content: string;
  symbols: CodeSymbol[];
  imports: string[];
  exports: string[];
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  size?: number;
  extension?: string;
}

export interface ProjectData {
  files: FileNode[];
  parsedFiles: ParsedFile[];
  totalFiles: number;
  totalLines: number;
}

export class CodeParser {
  private project: Project;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        allowJs: true,
        declaration: false,
        strict: false,
      },
    });
  }

  async parseProject(projectPath: string): Promise<ProjectData> {
    try {
      // Get file tree
      const files = await this.buildFileTree(projectPath);
      
      // Parse TypeScript/JavaScript files
      const parsedFiles = await this.parseFiles(projectPath);
      
      // Calculate stats
      const totalFiles = await this.countFiles(files);
      const totalLines = parsedFiles.reduce((sum, file) => sum + file.content.split('\n').length, 0);

      return {
        files,
        parsedFiles,
        totalFiles,
        totalLines,
      };
    } catch (error) {
      throw new Error(`Failed to parse project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async buildFileTree(dirPath: string): Promise<FileNode[]> {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      // Skip common directories that shouldn't be explored
      if (item.isDirectory() && this.shouldSkipDirectory(item.name)) {
        continue;
      }

      if (item.isDirectory()) {
        const children = await this.buildFileTree(itemPath);
        nodes.push({
          name: item.name,
          path: itemPath,
          type: 'folder',
          children,
        });
      } else {
        const stats = await fs.stat(itemPath);
        nodes.push({
          name: item.name,
          path: itemPath,
          type: 'file',
          size: stats.size,
          extension: path.extname(item.name).slice(1),
        });
      }
    }

    return nodes.sort((a, b) => {
      // Folders first, then files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      '.next',
      '.nuxt',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      'tmp',
      'temp',
      '.cache',
      '.DS_Store',
      'Thumbs.db',
    ];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  private async parseFiles(projectPath: string): Promise<ParsedFile[]> {
    const parsedFiles: ParsedFile[] = [];
    const files = await FileUtils.getAllFiles(projectPath);
    
    for (const filePath of files) {
      if (this.isSupportedFile(filePath)) {
        try {
          const parsedFile = await this.parseFile(filePath);
          parsedFiles.push(parsedFile);
        } catch (error) {
          console.warn(`Failed to parse ${filePath}:`, error);
        }
      }
    }

    return parsedFiles;
  }

  private isSupportedFile(filePath: string): boolean {
    const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
  }

  async parseFile(filePath: string): Promise<ParsedFile> {
    const content = await FileUtils.readFile(filePath);
    const symbols = await this.parseFileSymbols(filePath);
    
    return {
      path: filePath,
      content,
      symbols,
      imports: this.extractImports(content),
      exports: this.extractExports(content),
    };
  }

  async parseFileSymbols(filePath: string): Promise<CodeSymbol[]> {
    try {
      const content = await FileUtils.readFile(filePath);
      const symbols: CodeSymbol[] = [];

      // Add file to project
      const sourceFile = this.project.createSourceFile(filePath, content, { overwrite: true });

      // Parse functions
      sourceFile.getFunctions().forEach(fn => {
        const start = fn.getStart();
        const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
        
        symbols.push({
          name: fn.getName() || '<anonymous>',
          kind: 'function',
          line: lineAndColumn.line,
          column: lineAndColumn.column,
          signature: fn.getSignature().getDeclaration()?.getText() || '',
        });
      });

      // Parse classes
      sourceFile.getClasses().forEach(cls => {
        const start = cls.getStart();
        const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
        
        symbols.push({
          name: cls.getName() || '<anonymous>',
          kind: 'class',
          line: lineAndColumn.line,
          column: lineAndColumn.column,
          signature: `class ${cls.getName()}`,
        });
      });

      // Parse interfaces
      sourceFile.getInterfaces().forEach(iface => {
        const start = iface.getStart();
        const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
        
        symbols.push({
          name: iface.getName(),
          kind: 'interface',
          line: lineAndColumn.line,
          column: lineAndColumn.column,
          signature: `interface ${iface.getName()}`,
        });
      });

      // Parse variables
      sourceFile.getVariableDeclarations().forEach(variable => {
        const start = variable.getStart();
        const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
        
        symbols.push({
          name: variable.getName(),
          kind: 'variable',
          line: lineAndColumn.line,
          column: lineAndColumn.column,
          signature: variable.getText(),
        });
      });

      // Parse imports
      sourceFile.getImportDeclarations().forEach(importDecl => {
        const start = importDecl.getStart();
        const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
        
        symbols.push({
          name: importDecl.getModuleSpecifierValue(),
          kind: 'import',
          line: lineAndColumn.line,
          column: lineAndColumn.column,
          signature: importDecl.getText(),
        });
      });

      // Parse exports
      sourceFile.getExportDeclarations().forEach(exportDecl => {
        const start = exportDecl.getStart();
        const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
        
        symbols.push({
          name: exportDecl.getModuleSpecifierValue() || '<re-export>',
          kind: 'export',
          line: lineAndColumn.line,
          column: lineAndColumn.column,
          signature: exportDecl.getText(),
        });
      });

      return symbols;
    } catch (error) {
      console.warn(`Failed to parse symbols for ${filePath}:`, error);
      return [];
    }
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+|(?:async\s+)?(?:function|class|const|let|var)\s+)([A-Za-z_$][A-Za-z0-9_$]*)/g;
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  private async countFiles(nodes: FileNode[]): Promise<number> {
    let count = 0;
    
    for (const node of nodes) {
      if (node.type === 'file') {
        count++;
      } else if (node.children) {
        count += await this.countFiles(node.children);
      }
    }
    
    return count;
  }
}