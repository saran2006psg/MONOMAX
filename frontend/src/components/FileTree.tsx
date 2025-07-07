import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { FileNode } from '../types';
import { useTheme } from '../hooks/useTheme';

interface FileTreeProps {
  files: FileNode[];
  selectedFile?: string;
  onFileSelect: (file: FileNode) => void;
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  selectedFile?: string;
  onFileSelect: (file: FileNode) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, level, selectedFile, onFileSelect }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const { theme } = useTheme();

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node);
    }
  };

  const getFileIcon = () => {
    if (node.type === 'folder') {
      return isExpanded ? (
        <FolderOpen className={`w-4 h-4 ${
          theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
        }`} />
      ) : (
        <Folder className={`w-4 h-4 ${
          theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
        }`} />
      );
    }
    
    return <File className={`w-4 h-4 ${
      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
    }`} />;
  };

  const isSelected = selectedFile === node.path;

  return (
    <div>
      <div
        className={`flex items-center px-2 py-1 rounded-md cursor-pointer transition-all duration-150 ${
          isSelected
            ? theme === 'dark'
              ? 'bg-blue-900/30 text-blue-300 border border-blue-800/50'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
            : theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' && (
          <span className="mr-1">
            {isExpanded ? (
              <ChevronDown className={`w-4 h-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            ) : (
              <ChevronRight className={`w-4 h-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            )}
          </span>
        )}
        {getFileIcon()}
        <span className="ml-2 text-sm font-medium truncate">
          {node.name}
        </span>
      </div>
      
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ files, selectedFile, onFileSelect }) => {
  return (
    <div className="h-full overflow-y-auto flex-1">
      <div className="p-2 space-y-1">
        {files.map((file, index) => (
          <FileTreeNode
            key={`${file.path}-${index}`}
            node={file}
            level={0}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
};