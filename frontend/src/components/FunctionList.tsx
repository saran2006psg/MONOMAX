import React, { useState } from 'react';
import { Search, FunctionSquare as Function, Box, FileText, Import, Import as Export } from 'lucide-react';
import { CodeSymbol } from '../types';

interface FunctionListProps {
  symbols: CodeSymbol[];
  onSymbolClick: (symbol: CodeSymbol) => void;
}

export const FunctionList: React.FC<FunctionListProps> = ({ symbols, onSymbolClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredSymbols = symbols.filter(symbol => {
    const matchesSearch = symbol.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || symbol.kind === selectedType;
    return matchesSearch && matchesType;
  });

  const getSymbolIcon = (kind: string) => {
    switch (kind) {
      case 'function':
        return <Function className="w-4 h-4 text-blue-500" />;
      case 'class':
        return <Box className="w-4 h-4 text-green-500" />;
      case 'interface':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'import':
        return <Import className="w-4 h-4 text-orange-500" />;
      case 'export':
        return <Export className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const symbolCounts = symbols.reduce((acc, symbol) => {
    acc[symbol.kind] = (acc[symbol.kind] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Code Symbols
        </h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types ({symbols.length})</option>
          {Object.entries(symbolCounts).map(([type, count]) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}s ({count})
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredSymbols.map((symbol, index) => (
            <div
              key={index}
              onClick={() => onSymbolClick(symbol)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
            >
              {getSymbolIcon(symbol.kind)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {symbol.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Line {symbol.line} • {symbol.kind}
                </div>
                {symbol.signature && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {symbol.signature}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {filteredSymbols.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No symbols found' : 'No symbols in this file'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};