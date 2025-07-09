import { extractFiles } from '../utils/fileUtils.js';

interface ParsedFile {
  path: string;
  content: string;
  type: string;
  size: number;
  symbols: any[];
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: TreeNode[];
}

function buildFileTree(files: ParsedFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Sort files by path to ensure proper hierarchy
  files.sort((a, b) => a.path.localeCompare(b.path));

  files.forEach(file => {
    const pathParts = file.path.split('/').filter(part => part.length > 0);
    let currentPath = '';
    let currentLevel = root;

    // Create directory structure
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath += (currentPath ? '/' : '') + part;
      
      if (i === pathParts.length - 1) {
        // This is the file
        const fileNode: TreeNode = {
          name: part,
          path: currentPath,
          type: 'file',
          size: file.size
        };
        currentLevel.push(fileNode);
        nodeMap.set(currentPath, fileNode);
      } else {
        // This is a directory
        let dirNode = nodeMap.get(currentPath);
        if (!dirNode) {
          dirNode = {
            name: part,
            path: currentPath,
            type: 'directory',
            children: []
          };
          currentLevel.push(dirNode);
          nodeMap.set(currentPath, dirNode);
        }
        currentLevel = dirNode.children!;
      }
    }
  });

  return root;
}

export async function parseCodebase(filePath: string) {
  try {
    console.log('🔍 Starting codebase parsing...');
    const files = await extractFiles(filePath);
    
    // Enhanced parsing logic
    const parsedFiles: ParsedFile[] = files.map(file => {
      const symbols = extractSymbolsFromContent(file.content, file.type);
      return {
        path: file.path,
        content: file.content,
        type: file.type,
        size: file.size,
        symbols
      };
    });

    // Build hierarchical file tree
    const fileTree = buildFileTree(parsedFiles);

    console.log('✅ Codebase parsing completed');
    return {
      files: fileTree,
      parsedFiles: parsedFiles,
      summary: {
        totalFiles: parsedFiles.length,
        totalSize: parsedFiles.reduce((sum, file) => sum + file.size, 0),
        fileTypes: getFileTypeStats(parsedFiles),
        totalSymbols: parsedFiles.reduce((sum, file) => sum + file.symbols.length, 0)
      }
    };
  } catch (error) {
    console.error('❌ Parse error:', error);
    throw new Error('Failed to parse codebase');
  }
}

function extractSymbolsFromContent(content: string, fileType: string): any[] {
  const symbols: any[] = [];
  const lines = content.split('\n');

  try {
    if (fileType === 'javascript' || fileType === 'typescript') {
      // Extract functions
      const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?function|(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|class\s+(\w+))/g;
      let match;
      
      while ((match = functionRegex.exec(content)) !== null) {
        const name = match[1] || match[2] || match[3] || match[4] || match[5];
        if (name) {
          const line = content.substring(0, match.index).split('\n').length;
          symbols.push({
            name,
            type: match[5] ? 'class' : 'function',
            line,
            startPosition: { row: line - 1, column: match.index - content.lastIndexOf('\n', match.index) - 1 }
          });
        }
      }

      // Extract imports
      const importRegex = /(?:import\s+.*?from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
      while ((match = importRegex.exec(content)) !== null) {
        const source = match[1] || match[2];
        if (source) {
          const line = content.substring(0, match.index).split('\n').length;
          symbols.push({
            name: source,
            type: 'import',
            line,
            startPosition: { row: line - 1, column: match.index - content.lastIndexOf('\n', match.index) - 1 }
          });
        }
      }
    } else if (fileType === 'python') {
      // Extract Python functions and classes
      const pythonRegex = /(?:def\s+(\w+)|class\s+(\w+))/g;
      let match;
      
      while ((match = pythonRegex.exec(content)) !== null) {
        const name = match[1] || match[2];
        if (name) {
          const line = content.substring(0, match.index).split('\n').length;
          symbols.push({
            name,
            type: match[2] ? 'class' : 'function',
            line,
            startPosition: { row: line - 1, column: match.index - content.lastIndexOf('\n', match.index) - 1 }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting symbols:', error);
  }

  return symbols;
}

function getFileTypeStats(parsedFiles: ParsedFile[]) {
  const stats: { [key: string]: number } = {};
  
  parsedFiles.forEach(file => {
    stats[file.type] = (stats[file.type] || 0) + 1;
  });
  
  return stats;
}