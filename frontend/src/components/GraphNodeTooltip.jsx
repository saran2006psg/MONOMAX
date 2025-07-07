import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function GraphNodeTooltip({ node, position }) {
  const { theme } = useTheme();
  
  if (!node || !position) return null;

  const { data } = node;
  
  return (
    <div
      className={`fixed z-50 p-3 rounded-lg shadow-xl border pointer-events-none transition-all duration-200 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-600 text-white' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}
      style={{
        left: position.x + 10,
        top: position.y - 10,
        maxWidth: '300px'
      }}
    >
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">
            {data.type === 'file' ? '📁' : '⚡'}
          </span>
          <span className="font-bold text-sm">
            {data.label}
          </span>
        </div>
        
        <div className={`text-xs space-y-1 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {data.type === 'file' ? (
            <>
              <div><strong>File:</strong> {data.filename}</div>
              <div><strong>Functions:</strong> {data.functions}</div>
              <div><strong>Imports:</strong> {data.imports}</div>
            </>
          ) : (
            <>
              <div><strong>Function:</strong> {data.functionName}</div>
              <div><strong>File:</strong> {data.filename}</div>
              <div><strong>Line:</strong> {data.line}</div>
            </>
          )}
        </div>
        
        <div className={`text-xs pt-2 border-t ${
          theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'
        }`}>
          Click to see ripple effect
        </div>
      </div>
    </div>
  );
}