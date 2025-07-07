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
      <div className={`h-full flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className={`mb-4 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Select a file to view its contents
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Choose a file from the explorer to see its code with syntax highlighting
          </p>
        </div>
      </div>
    );
  }

  const language = getLanguage(selectedFile.name);

  return (
    <div className="h-full flex flex-col">
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <h2 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {selectedFile.name}
          </h2>
          <span key={selectedFile.path} className={`text-sm px-2 py-1 rounded ${
            theme === 'dark' 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {language}
          </span>
        </div>
        <div className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {selectedFile.path}
        </div>
      </div>
      
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
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
            fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
            fontLigatures: true,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            wordWrap: 'on',
            wrappingStrategy: 'advanced',
          }}
        />
      </div>
    </div>
  );
};