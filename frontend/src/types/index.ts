export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  size?: number;
  extension?: string;
}

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

export interface ProjectData {
  files: FileNode[];
  parsedFiles: ParsedFile[];
  projectName: string;
  totalFiles: number;
  totalLines: number;
}

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  context: string;
  symbolName: string;
  symbolKind: string;
}