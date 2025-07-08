import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function GraphNodeTooltip({ node, position }) {
  const { theme } = useTheme();
  
  if (!node || !position) return null;

  const { data } = node;
  
  return (
    <div
      className={`fixed z-50 p-4 rounded-lg shadow-xl border pointer-events-none transition-all duration-200 max-w-xs ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-600 text-white' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}
      style={{
        left: Math.min(position.x + 15, window.innerWidth - 300),
        top: Math.max(position.y - 10, 10),
      }}
    >
      <div className="space-y-3">
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
              <div className="flex justify-between">
                <span><strong>File:</strong></span>
                <span className="truncate ml-2" title={data.filename}>
                  {data.filename.split('/').pop()}
                </span>
              </div>
              <div className="flex justify-between">
                <span><strong>Functions:</strong></span>
                <span>{data.functions}</span>
              </div>
              <div className="flex justify-between">
                <span><strong>Imports:</strong></span>
                <span>{data.imports}</span>
              </div>
              <div className="flex justify-between">
                <span><strong>Size:</strong></span>
                <span>{data.size || 0} items</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span><strong>Function:</strong></span>
                <span className="truncate ml-2" title={data.functionName}>
                  {data.functionName}
                </span>
              </div>
              <div className="flex justify-between">
                <span><strong>File:</strong></span>
                <span className="truncate ml-2" title={data.filename}>
                  {data.filename.split('/').pop()}
                </span>
              </div>
              <div className="flex justify-between">
                <span><strong>Line:</strong></span>
                <span>{data.line}</span>
              </div>
            </>
          )}
        </div>
        
        <div className={`text-xs pt-2 border-t flex items-center space-x-1 ${
          theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'
        }`}>
          <span>💡</span>
          <span>Click to see ripple effect</span>
        </div>
      </div>
    </div>
  );
}