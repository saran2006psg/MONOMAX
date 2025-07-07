import React, { useState } from 'react';
import { Search, FunctionSquare as Function, Box, FileText, Import, Import as Export } from 'lucide-react';
import { CodeSymbol } from '../types';
import { useTheme } from '../hooks/useTheme';

interface FunctionListProps {
  symbols: CodeSymbol[];
  onSymbolClick: (symbol: CodeSymbol) => void;
}

export const FunctionList: React.FC<FunctionListProps> = ({ symbols, onSymbolClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { theme } = useTheme();

  const filteredSymbols = symbols.filter(symbol => {
    const matchesSearch = symbol.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || symbol.kind === selectedType;
    return matchesSearch && matchesType;
  });

  const getSymbolIcon = (kind: string) => {
    switch (kind) {
      case 'function':
        return <Function className={`w-4 h-4 ${
          theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
        }`} />;
      case 'class':
        return <Box className={`w-4 h-4 ${
          theme === 'dark' ? 'text-green-400' : 'text-green-500'
        }`} />;
      case 'interface':
        return <FileText className={`w-4 h-4 ${
          theme === 'dark' ? 'text-purple-400' : 'text-purple-500'
        }`} />;
      case 'import':
        return <Import className={`w-4 h-4 ${
          theme === 'dark' ? 'text-orange-400' : 'text-orange-500'
        }`} />;
      case 'export':
        return <Export className={`w-4 h-4 ${
          theme === 'dark' ? 'text-red-400' : 'text-red-500'
        }`} />;
      default:
        return <FileText className={`w-4 h-4 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`} />;
    }
  };

  const symbolCounts = symbols.reduce((acc, symbol) => {
    acc[symbol.kind] = (acc[symbol.kind] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full flex flex-col">
      <div className={`p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Code Symbols
        </h2>
        
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors duration-200 ${
              theme === 'dark' 
                ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 ${
            theme === 'dark' 
              ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-500' 
              : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-150 border ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 border-gray-700 hover:border-gray-600' 
                  : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              {getSymbolIcon(symbol.kind)}
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {symbol.name}
                </div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Line {symbol.line} • {symbol.kind}
                </div>
                {symbol.signature && (
                  <div className={`text-xs truncate ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
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
              <div className={`mb-2 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {searchTerm ? 'No symbols found' : 'No symbols in this file'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};