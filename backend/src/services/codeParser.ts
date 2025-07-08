import { extractFiles } from '../utils/fileUtils.js';

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