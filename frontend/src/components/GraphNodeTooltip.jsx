import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function GraphNodeTooltip({ node, position }) {
  const { theme } = useTheme();
  
  if (!node || !position) return null;

  const { data } = node;
  
  return (
    <div
      className={`fixed z-50 p-4 rounded-xl shadow-2xl border pointer-events-none transition-all duration-200 max-w-xs backdrop-blur-md ${
        theme === 'dark' 
          ? 'bg-gray-800/95 border-gray-600/50 text-white shadow-gray-900/50' 
          : 'bg-white/95 border-gray-200/50 text-gray-900 shadow-gray-500/20'
      }`}
      style={{
        left: Math.min(position.x + 15, window.innerWidth - 320),
        top: Math.max(position.y - 10, 10),
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl animate-bounce">
            {data.type === 'file' ? '📁' : '⚡'}
          </span>
          <div>
            <span className="font-bold text-base block">
              {data.label}
            </span>
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {data.type === 'file' ? 'File Node' : 'Function Node'}
            </span>
          </div>
        </div>
        
        <div className={`text-sm space-y-2 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {data.type === 'file' ? (
            <>
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <span className="flex items-center">
                  <span className="mr-2">📄</span>
                  <strong>File:</strong>
                </span>
                <span className="truncate ml-2 font-mono text-xs" title={data.filename}>
                  {data.filename.split('/').pop()}
                </span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <span className="flex items-center">
                  <span className="mr-2">⚡</span>
                  <strong>Functions:</strong>
                </span>
                <span className={`px-2 py-1 rounded font-mono text-xs ${
                  theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'
                }`}>
                  {data.functions}
                </span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <span className="flex items-center">
                  <span className="mr-2">📥</span>
                  <strong>Imports:</strong>
                </span>
                <span className={`px-2 py-1 rounded font-mono text-xs ${
                  theme === 'dark' ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'
                }`}>
                  {data.imports}
                </span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <span className="flex items-center">
                  <span className="mr-2">📊</span>
                  <strong>Size:</strong>
                </span>
                <span className={`px-2 py-1 rounded font-mono text-xs ${
                  theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  {data.size || 0} items
                </span>
              </div>
            </>
          ) : (
            <>
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <span className="flex items-center">
                  <span className="mr-2">⚡</span>
                  <strong>Function:</strong>
                </span>
                <span className="truncate ml-2 font-mono text-xs" title={data.functionName}>
                  {data.functionName}
                </span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <span className="flex items-center">
                  <span className="mr-2">📄</span>
                  <strong>File:</strong>
                </span>
                <span className="truncate ml-2 font-mono text-xs" title={data.filename}>
                  {data.filename.split('/').pop()}
                </span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <span className="flex items-center">
                  <span className="mr-2">📍</span>
                  <strong>Line:</strong>
                </span>
                <span className={`px-2 py-1 rounded font-mono text-xs ${
                  theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                }`}>
                  {data.line}
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className={`text-xs pt-3 border-t flex items-center space-x-2 ${
          theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'
        }`}>
          <span className="animate-pulse">💡</span>
          <span>Click to see ripple effect</span>
        </div>
      </div>
    </div>
  );
}