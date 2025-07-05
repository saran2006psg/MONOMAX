import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { FileNode } from '../types';
import { useTheme } from '../hooks/useTheme';

interface CodeViewerProps {
  selectedFile?: FileNode;
  fileContent?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ selectedFile, fileContent }) => {
  const { theme } = useTheme();
  const [editorTheme, setEditorTheme] = useState('vs');

  useEffect(() => {
    setEditorTheme(theme === 'dark' ? 'vs-dark' : 'vs');
  }, [theme]);

  const getLanguage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'cc':
        return 'cpp';
      case 'c':
        return 'c';
      case 'sh':
        return 'shell';
      case 'yml':
      case 'yaml':
        return 'yaml';
      case 'xml':
        return 'xml';
      default:
        return 'plaintext';
    }
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
            Select a file to view its contents
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Choose a file from the explorer to see its code with syntax highlighting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedFile.name}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {getLanguage(selectedFile.name)}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedFile.path}
        </div>
      </div>
      
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguage(selectedFile.name)}
          theme={editorTheme}
          value={fileContent || '// Loading...'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            automaticLayout: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
            },
          }}
        />
      </div>
    </div>
  );
};