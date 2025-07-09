import fs from 'fs';
import path from 'path';
import yauzl from 'yauzl';

export interface FileInfo {
  path: string;
  content: string;
  size: number;
  type: string;
}

export async function extractFiles(zipFilePath: string): Promise<FileInfo[]> {
  return new Promise((resolve, reject) => {
    const files: FileInfo[] = [];
    let processedEntries = 0;
    let totalEntries = 0;
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('ZIP extraction timed out after 30 seconds'));
    }, 30000);

    yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        clearTimeout(timeout);
        console.error('❌ Error opening ZIP file:', err);
        return reject(new Error('Failed to open ZIP file'));
      }

      // Get total entry count for progress tracking
      totalEntries = zipfile.entryCount;
      console.log(`📦 Processing ZIP file with ${totalEntries} entries`);

      zipfile.on('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ ZIP file processing error:', err);
        reject(err);
      });

      zipfile.on('end', () => {
        clearTimeout(timeout);
        console.log(`✅ Extracted ${files.length} files from ${totalEntries} entries`);
        resolve(files);
      });

      zipfile.on('entry', (entry) => {
        processedEntries++;
        
        if (processedEntries % 100 === 0) {
          console.log(`📊 Progress: ${processedEntries}/${totalEntries} entries processed`);
        }

        // Skip directories and system files
        if (/\/$/.test(entry.fileName) || 
            entry.fileName.includes('__MACOSX') ||
            entry.fileName.includes('.DS_Store') ||
            entry.fileName.includes('node_modules/') ||
            entry.fileName.includes('.git/') ||
            entry.fileName.includes('.vscode/') ||
            entry.fileName.includes('dist/') ||
            entry.fileName.includes('build/') ||
            entry.fileName.includes('coverage/')) {
          zipfile.readEntry();
          return;
        }

        // Only process text files that we can parse
        const supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.html', '.css', '.json', '.xml', '.md', '.txt', '.vue', '.svelte', '.yaml', '.yml', '.toml', '.ini', '.cfg'];
        const isSupported = supportedExtensions.some(ext => entry.fileName.toLowerCase().endsWith(ext));
        
        if (!isSupported) {
          zipfile.readEntry();
          return;
        }

        // Skip files that are too large
        if (entry.uncompressedSize > 1024 * 1024) { // 1MB limit
          console.log(`⚠️ Skipping large file: ${entry.fileName} (${entry.uncompressedSize} bytes)`);
          zipfile.readEntry();
          return;
        }

        // Process the file
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err || !readStream) {
            console.error('❌ Error reading stream for entry:', entry.fileName, err);
            zipfile.readEntry();
            return;
          }

          const chunks: Buffer[] = [];
          readStream.on('data', (chunk) => chunks.push(chunk as Buffer));
          readStream.on('end', () => {
            try {
              const content = Buffer.concat(chunks).toString('utf8');
              
              // Validate content is text (not binary)
              if (content.includes('\0')) {
                console.log(`⚠️ Skipping binary file: ${entry.fileName}`);
                zipfile.readEntry();
                return;
              }

              files.push({
                path: entry.fileName,
                content: content,
                size: entry.uncompressedSize,
                type: getFileType(entry.fileName),
              });
              
              console.log(`✅ Processed: ${entry.fileName} (${entry.uncompressedSize} bytes)`);
            } catch (error) {
              console.error('❌ Error processing file content:', entry.fileName, error);
            }
            zipfile.readEntry();
          });
          readStream.on('error', (streamErr) => {
            console.error('❌ Error in stream for entry:', entry.fileName, streamErr);
            zipfile.readEntry();
          });
        });
      });

      // Start reading entries.
      zipfile.readEntry();
    });
  });
}

export function getFileType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  const typeMap: { [key: string]: string } = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.xml': 'xml',
    '.md': 'markdown',
    '.txt': 'text',
  };
  
  return typeMap[ext] || 'text';
}