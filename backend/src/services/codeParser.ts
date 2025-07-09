import { Project, ScriptTarget, ModuleKind } from 'ts-morph';
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
  projectName: string;
}

export class CodeParser {
  private project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: ScriptTarget.ES2020,
      module: ModuleKind.ESNext,
      allowJs: true,
      declaration: false,
      strict: false,
    },
  });

  async parseProject(projectPath: string): Promise<ProjectData> {
    // First, extract the ZIP file - assume all uploaded files are ZIP files
    const extractedPath = projectPath + '_extracted';
    await FileUtils.extractZip(projectPath, extractedPath);
    // Clean up the original ZIP file after extraction
    await FileUtils.deleteFile(projectPath);
    
    // Build file tree
    const files = await this.buildFileTree(extractedPath);
    // Parse files
    const parsedFiles = await this.parseFiles(extractedPath);
    // Stats
    const totalFiles = await this.countFiles(files);
    const totalLines = parsedFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0);
    
    // Extract project name from the path
    const projectName = path.basename(extractedPath).replace('_extracted', '');
    
    return { files, parsedFiles, totalFiles, totalLines, projectName };
  }

  private async buildFileTree(dir: string): Promise<FileNode[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nodes: FileNode[] = [];
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (this.shouldSkipDirectory(ent.name)) continue;
        const children = await this.buildFileTree(fullPath);
        nodes.push({ name: ent.name, path: fullPath, type: 'folder', children });
      } else {
        const stats = await fs.stat(fullPath);
        nodes.push({
          name: ent.name,
          path: fullPath,
          type: 'file',
          size: stats.size,
          extension: path.extname(ent.name).slice(1),
        });
      }
    }
    return nodes.sort((a, b) => (a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name)));
  }

  private shouldSkipDirectory(name: string) {
    const skip = ['node_modules', '.git', '.next', '.nuxt', 'dist', 'build', 'coverage', '.cache'];
    return skip.includes(name) || name.startsWith('.');
  }

  private async parseFiles(root: string): Promise<ParsedFile[]> {
    const all = await FileUtils.getAllFiles(root);
    const results: ParsedFile[] = [];
    for (const fp of all) {
      if (this.isSupported(fp)) {
        try {
          results.push(await this.parseFile(fp));
        } catch {}
      }
    }
    return results;
  }

  private isSupported(fp: string) {
    return ['.ts', '.tsx', '.js', '.jsx', '.json'].some(ext => fp.endsWith(ext));
  }

  private async parseFile(fp: string): Promise<ParsedFile> {
    const content = await FileUtils.readFile(fp);
    const symbols = await this.parseFileSymbols(fp);
    return { path: fp, content, symbols, imports: this.extractImports(content), exports: this.extractExports(content) };
  }

  async parseFileSymbols(fp: string): Promise<CodeSymbol[]> {
    const content = await FileUtils.readFile(fp);
    const src = this.project.createSourceFile(fp, content, { overwrite: true });
    const syms: CodeSymbol[] = [];
    src.getFunctions().forEach(f => {
      const pos = src.getLineAndColumnAtPos(f.getStart());
      syms.push({ name: f.getName() || '<anonymous>', kind: 'function', line: pos.line, column: pos.column, signature: f.getSignature().getDeclaration()?.getText() });
    });
    src.getClasses().forEach(c => {
      const pos = src.getLineAndColumnAtPos(c.getStart());
      syms.push({ name: c.getName() || '<anonymous>', kind: 'class', line: pos.line, column: pos.column, signature: `class ${c.getName()}` });
    });
    src.getInterfaces().forEach(i => {
      const pos = src.getLineAndColumnAtPos(i.getStart());
      syms.push({ name: i.getName(), kind: 'interface', line: pos.line, column: pos.column, signature: `interface ${i.getName()}` });
    });
    src.getVariableDeclarations().forEach(v => {
      const pos = src.getLineAndColumnAtPos(v.getStart());
      syms.push({ name: v.getName(), kind: 'variable', line: pos.line, column: pos.column, signature: v.getText() });
    });
    src.getImportDeclarations().forEach(id => {
      const pos = src.getLineAndColumnAtPos(id.getStart());
      syms.push({ name: id.getModuleSpecifierValue(), kind: 'import', line: pos.line, column: pos.column, signature: id.getText() });
    });
    src.getExportDeclarations().forEach(ed => {
      const pos = src.getLineAndColumnAtPos(ed.getStart());
      syms.push({ name: ed.getModuleSpecifierValue() || '<re-export>', kind: 'export', line: pos.line, column: pos.column, signature: ed.getText() });
    });
    return syms;
  }

  private extractImports(content: string): string[] {
    const arr: string[] = [];
    const regex = /import\s+.*?from\s+['"]([^'\"]+)['"]/g;
    let m; while ((m = regex.exec(content))) arr.push(m[1]);
    return arr;
  }

  private extractExports(content: string): string[] {
    const arr: string[] = [];
    const regex = /export\s+(?:default\s+|(?:async\s+)?(?:function|class|const|let|var)\s+)([A-Za-z_$][A-Za-z0-9_$]*)/g;
    let m; while ((m = regex.exec(content))) arr.push(m[1]);
    return arr;
  }

  private async countFiles(nodes: FileNode[]): Promise<number> {
    let count = 0;
    for (const n of nodes) {
      if (n.type === 'file') count++;
      else if (n.children) count += await this.countFiles(n.children);
    }
    return count;
  }
}