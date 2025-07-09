import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, FolderOpen, Code, Users, Clock, GitBranch, MessageCircle } from 'lucide-react';
import { FileTree } from './FileTree';
import { CodeViewer } from './CodeViewer';
import { FunctionList } from './FunctionList';
import RippleGraph from './RippleGraph';
import { ThemeToggle } from './ThemeToggle';
import { Chatbox } from './Chatbox';
import { ProjectData, FileNode, CodeSymbol, SearchResult } from '../types';
import { useTheme } from '../hooks/useTheme';
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
  const [activeTab, setActiveTab] = useState<'explorer' | 'graph'>('explorer');
  const [, setIsSearching] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { theme } = useTheme();
  // Unwrap single root folder for file tree and search lookup
  const fileTreeData =
    projectData.files.length === 1 && projectData.files[0].type === 'folder'
      ? projectData.files[0].children || []
      : projectData.files;

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
          const response = await axios.get(`http://localhost:3001/api/file-content?path=${encodeURIComponent(file.path)}`);
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
      const response = await axios.get(`http://localhost:3001/api/search?term=${encodeURIComponent(term)}`);
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
    <div className={`h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}>
                <FolderOpen className={`w-6 h-6 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <h1 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {projectData.projectName}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Code className={`w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {projectData.totalFiles} files
                </span>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Users className={`w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {projectData.totalLines} lines
                </span>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Clock className={`w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Analyzed
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search codebase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 w-64 rounded-lg border transition-colors duration-200 ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            
            <ThemeToggle />
            
            <button
              onClick={() => setIsChatOpen(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              } hover:scale-105 shadow-lg`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask AI</span>
            </button>
            
            <div className={`flex rounded-lg border ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <button
                onClick={() => setActiveTab('explorer')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  activeTab === 'explorer'
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FolderOpen className="w-4 h-4 inline mr-2" />
                Explorer
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  activeTab === 'graph'
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <GitBranch className="w-4 h-4 inline mr-2" />
                Dependencies
              </button>
            </div>
            
            <button
              onClick={onReset}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'explorer' ? (
          <>
            {/* File Tree */}
            <div className={`w-80 border-r flex flex-col transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`p-4 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Project Files
                </h2>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Navigate through your codebase
                </p>
              </div>
              {/* Unwrap root folder if present */}
              <FileTree
                files={fileTreeData}
                selectedFile={selectedFile?.path}
                onFileSelect={handleFileSelect}
              />
            </div>

            {/* Code Viewer */}
            <div className={`flex-1 flex flex-col transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <CodeViewer
                selectedFile={selectedFile}
                fileContent={fileContent}
              />
            </div>

            {/* Function List & Search Results */}
            <div className={`w-80 border-l flex flex-col transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              {searchResults.length > 0 ? (
                <div className="h-full flex flex-col">
                  <div className={`p-4 border-b ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h2 className={`text-lg font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Search Results
                    </h2>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {searchResults.length} results for "{searchTerm}"
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                            theme === 'dark' 
                              ? 'hover:bg-gray-700 border border-gray-700' 
                              : 'hover:bg-gray-50 border border-gray-200'
                          }`}
                          onClick={() => {
                            const file = fileTreeData.find(f => f.path === result.file);
                            if (file) handleFileSelect(file);
                          }}
                        >
                          <div className={`font-medium text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {result.file.split('/').pop()}
                          </div>
                          <div className={`text-xs mb-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Line {result.line} • {result.symbolKind}
                          </div>
                          <div className={`text-xs p-2 rounded ${
                            theme === 'dark' 
                              ? 'text-gray-300 bg-gray-700' 
                              : 'text-gray-600 bg-gray-50'
                          }`}>
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
          </>
        ) : (
          /* Dependency Graph View */
          <div className="flex-1">
            <RippleGraph 
              files={projectData.parsedFiles.map(pf => ({
                filename: pf.path,
                content: pf.content
              }))}
            />
          </div>
        )}
      </div>
      
      {/* AI Chatbox */}
      <Chatbox 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectData={projectData}
        selectedFile={selectedFile}
        fileContent={fileContent}
      />
    </div>
  );
};