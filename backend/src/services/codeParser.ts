import { extractFiles } from '../utils/fileUtils.js';
import { indexCodeChunks } from '../utils/embedding.js';

export async function parseCodebase(filePath: string) {
  try {
    const files = await extractFiles(filePath);
    
    // Basic parsing logic - can be expanded
    const parsedFiles = files.map(file => ({
      path: file.path,
      content: file.content,
      type: getFileType(file.path),
      size: file.content.length
    }));

    // Extract code chunks for AI indexing
    const codeChunks = extractCodeChunks(parsedFiles);
    
    // Index code chunks for AI assistant (async, don't wait)
    if (codeChunks.length > 0) {
      indexCodeChunks(codeChunks).catch(error => {
        console.error('❌ Failed to index code chunks:', error);
      });
    }

    return {
      files: parsedFiles,
      summary: {
        totalFiles: parsedFiles.length,
        totalSize: parsedFiles.reduce((sum, file) => sum + file.size, 0)
      }
    };
  } catch (error) {
    console.error('Parse error:', error);
    throw new Error('Failed to parse codebase');
  }
}

function extractCodeChunks(parsedFiles: any[]) {
  const chunks: any[] = [];
  
  parsedFiles.forEach(file => {
    if (isCodeFile(file.path)) {
      const lines = file.content.split('\n');
      
      // Extract function-level chunks
      const functionMatches = file.content.matchAll(
        /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?function|class\s+(\w+))/g
      );
      
      for (const match of functionMatches) {
        const functionName = match[1] || match[2] || match[3] || match[4];
        const startIndex = match.index || 0;
        const lineNumber = file.content.substring(0, startIndex).split('\n').length;
        
        // Get surrounding context (5 lines before and after)
        const startLine = Math.max(0, lineNumber - 5);
        const endLine = Math.min(lines.length, lineNumber + 10);
        const contextLines = lines.slice(startLine, endLine);
        
        chunks.push({
          file: file.path,
          line: lineNumber,
          text: contextLines.join('\n'),
          type: 'function',
          function_name: functionName
        });
      }
      
      // Also add file-level chunks for imports and general structure
      const importLines = lines.filter(line => 
        line.trim().startsWith('import ') || 
        line.trim().startsWith('require(') ||
        line.trim().startsWith('export ')
      );
      
      if (importLines.length > 0) {
        chunks.push({
          file: file.path,
          line: 1,
          text: importLines.join('\n'),
          type: 'imports',
          function_name: null
        });
      }
    }
  });
  
  return chunks;
}

function isCodeFile(filePath: string): boolean {
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go'];
  return codeExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
}

function getFileType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
      return 'c';
    default:
      return 'text';
  }
}