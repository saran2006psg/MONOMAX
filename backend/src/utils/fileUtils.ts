import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';

export class FileUtils {
  static async extractZip(zipPath: string, extractPath: string): Promise<void> {
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractPath, true);
    } catch (error) {
      throw new Error(`Failed to extract ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete file ${filePath}:`, error);
    }
  }

  static async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          // Skip common directories
          if (this.shouldSkipDirectory(item.name)) {
            continue;
          }
          
          const subFiles = await this.getAllFiles(itemPath);
          files.push(...subFiles);
        } else {
          files.push(itemPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dirPath}:`, error);
    }
    
    return files;
  }

  private static shouldSkipDirectory(dirName: string): boolean {
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
}