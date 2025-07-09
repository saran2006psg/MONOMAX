// Legacy extractFiles removed; use FileUtils.extractZip and FileUtils.getAllFiles instead

// Utility class for file system operations
import extract from 'extract-zip';
import fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';

export class FileUtils {
  // Extract ZIP archive to output directory
  static async extractZip(zipPath: string, outDir: string): Promise<void> {
    await fsPromises.mkdir(outDir, { recursive: true });
    await extract(zipPath, { dir: outDir });
  }

  // Delete a file
  static async deleteFile(filePath: string): Promise<void> {
    await fsPromises.unlink(filePath);
  }

  // Read file content as UTF-8 text
  static async readFile(filePath: string): Promise<string> {
    return fsPromises.readFile(filePath, 'utf8');
  }

  // Recursively get all file paths under a directory
  static async getAllFiles(dir: string): Promise<string[]> {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    let files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const children = await FileUtils.getAllFiles(fullPath);
        files = files.concat(children);
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }
  // Determine file type by extension
  static getFileType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case '.js': case '.jsx': return 'javascript';
      case '.ts': case '.tsx': return 'typescript';
      case '.py': return 'python';
      case '.java': return 'java';
      case '.cpp': case '.cc': case '.cxx': return 'cpp';
      case '.c': return 'c';
      case '.cs': return 'csharp';
      case '.php': return 'php';
      case '.rb': return 'ruby';
      case '.go': return 'go';
      case '.rs': return 'rust';
      case '.html': return 'html';
      case '.css': return 'css';
      case '.json': return 'json';
      case '.xml': return 'xml';
      case '.md': return 'markdown';
      case '.txt': return 'text';
      case '.vue': return 'vue';
      case '.svelte': return 'svelte';
      case '.yaml': case '.yml': return 'yaml';
      default: return 'text';
    }
  }
}
