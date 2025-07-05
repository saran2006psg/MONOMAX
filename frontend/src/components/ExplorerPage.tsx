import React, { useState, useEffect } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { FileTree } from './FileTree';
import { CodeViewer } from './CodeViewer';
import { FunctionList } from './FunctionList';
import { ThemeToggle } from './ThemeToggle';
import { ProjectData, FileNode, CodeSymbol, SearchResult } from '../types';
import axios from 'axios';

interface ExplorerPageProps {
  projectData: ProjectData;
  onReset: () => void;
}

export const ExplorerPage: React.FC<ExplorerPageProps> = ({ projectData, onReset }) => {
  const [selectedFile, setSelectedFile] = useState<FileNode | undefined>();
  const [fileContent, setFileContent] = useState<string>('');
  const [currentSymbols, setCurrentSymbols] = useState<CodeSymbol[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [, setIsSearching] = useState(false);

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      
      // Find parsed file data
      const parsedFile = projectData.parsedFiles.find(pf => pf.path === file.path);
      if (parsedFile) {
        setFileContent(parsedFile.content);
        setCurrentSymbols(parsedFile.symbols);
      } else {
        try {
          const response = await axios.get(`/api/file-content?path=${encodeURIComponent(file.path)}`);
          setFileContent(response.data.content);
          setCurrentSymbols(response.data.symbols || []);
        } catch (error) {
          console.error('Error fetching file content:', error);
          setFileContent('// Error loading file content');
          setCurrentSymbols([]);
        }
      }
    }
  };

  const handleSymbolClick = (symbol: CodeSymbol) => {
    // This would typically scroll to the symbol in the editor
    console.log('Navigate to symbol:', symbol);
  };

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/search?term=${encodeURIComponent(term)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {projectData.projectName}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{projectData.totalFiles} files</span>
              <span>•</span>
              <span>{projectData.totalLines} lines</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search codebase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <ThemeToggle />
            
            <button
              onClick={onReset}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <FileTree
            files={projectData.files}
            selectedFile={selectedFile?.path}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Code Viewer */}
        <div className="flex-1 bg-white dark:bg-gray-800 flex flex-col">
          <CodeViewer
            selectedFile={selectedFile}
            fileContent={fileContent}
          />
        </div>

        {/* Function List & Search Results */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          {searchResults.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Search Results
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchResults.length} results for "{searchTerm}"
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                      onClick={() => {
                        const file = projectData.files.find(f => f.path === result.file);
                        if (file) handleFileSelect(file);
                      }}
                    >
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {result.file.split('/').pop()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Line {result.line} • {result.symbolKind}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {result.context}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <FunctionList
              symbols={currentSymbols}
              onSymbolClick={handleSymbolClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};