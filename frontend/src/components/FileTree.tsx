import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { FileNode } from '../types';

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
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500" />
      );
    }
    
    return <File className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
  };

  const isSelected = selectedFile === node.path;

  return (
    <div>
      <div
        className={`flex items-center px-2 py-1 rounded-md cursor-pointer transition-colors duration-150 ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' && (
          <span className="mr-1">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </span>
        )}
        {getFileIcon()}
        <span className="ml-2 text-sm font-medium truncate text-gray-700 dark:text-gray-300">{node.name}</span>
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
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">File Explorer</h2>
      </div>
      <div className="p-2">
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