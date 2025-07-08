import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Panel
} from '@reactflow/core';
import { Controls } from '@reactflow/controls';
import { Background } from '@reactflow/background';
import { MiniMap } from '@reactflow/minimap';
import '@reactflow/core/dist/style.css';
import dagre from 'dagre';
import { buildDependencyGraph, graphToReactFlow, findDownstreamNodes, findUpstreamNodes, getGraphStats } from '../utils/graphBuilder';
import { parseFiles } from '../utils/parser';
import GraphNodeTooltip from './GraphNodeTooltip';
import { useTheme } from '../hooks/useTheme';

// Custom node components with improved styling
const FileNode = ({ data, selected }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] max-w-[200px] ${
      selected 
        ? theme === 'dark' 
          ? 'bg-blue-900 border-blue-400 shadow-lg shadow-blue-400/50 scale-105' 
          : 'bg-blue-100 border-blue-500 shadow-lg shadow-blue-500/30 scale-105'
        : theme === 'dark'
          ? 'bg-gray-800 border-gray-600 hover:border-blue-400 hover:shadow-md'
          : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
    }`}>
      <div className={`font-bold text-sm mb-1 truncate ${
        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
      }`} title={data.filename}>
        📁 {data.label}
      </div>
      <div className={`text-xs space-y-1 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <div>⚡ {data.functions} functions</div>
        <div>📥 {data.imports} imports</div>
      </div>
    </div>
  );
};

const FunctionNode = ({ data, selected }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 min-w-[100px] max-w-[150px] ${
      selected 
        ? theme === 'dark' 
          ? 'bg-purple-900 border-purple-400 shadow-lg shadow-purple-400/50 scale-105' 
          : 'bg-purple-100 border-purple-500 shadow-lg shadow-purple-500/30 scale-105'
        : theme === 'dark'
          ? 'bg-gray-800 border-gray-600 hover:border-purple-400 hover:shadow-md'
          : 'bg-white border-gray-300 hover:border-purple-400 hover:shadow-md'
    }`}>
      <div className={`font-bold text-sm mb-1 truncate ${
        theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
      }`} title={data.functionName}>
        ⚡ {data.label}
      </div>
      <div className={`text-xs ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Line {data.line}
      </div>
    </div>
  );
};

const nodeTypes = {
  fileNode: FileNode,
  functionNode: FunctionNode,
};

// Layout algorithm using Dagre with improved spacing
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 160;
  const nodeHeight = 80;
  const rankSep = direction === 'TB' ? 150 : 200;
  const nodeSep = direction === 'TB' ? 100 : 150;
  
  dagreGraph.setGraph({ 
    rankdir: direction, 
    ranksep: rankSep, 
    nodesep: nodeSep,
    marginx: 50,
    marginy: 50
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

export default function RippleGraph({ files }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [graph, setGraph] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [layoutDirection, setLayoutDirection] = useState('TB');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();

  // Parse files and build graph with progress tracking
  useEffect(() => {
    if (!files || files.length === 0) return;

    const buildGraph = async () => {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      
      try {
        console.log('Starting graph build process...');
        
        // Filter for JavaScript/TypeScript files only
        const jsFiles = files.filter(file => {
          const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
          return extensions.some(ext => file.filename.toLowerCase().endsWith(ext));
        });
        
        if (jsFiles.length === 0) {
          setError('No JavaScript/TypeScript files found in the uploaded project.');
          setIsLoading(false);
          return;
        }
        
        setProgress(20);
        console.log(`Found ${jsFiles.length} JS/TS files to parse`);
        
        // Parse files
        const parsedFiles = await parseFiles(jsFiles);
        setProgress(50);
        
        if (parsedFiles.length === 0) {
          setError('Failed to parse any files. Please check if the files contain valid JavaScript/TypeScript code.');
          setIsLoading(false);
          return;
        }
        
        console.log(`Successfully parsed ${parsedFiles.length} files`);
        
        // Build dependency graph
        const dependencyGraph = buildDependencyGraph(parsedFiles);
        setProgress(70);
        
        if (dependencyGraph.nodeCount() === 0) {
          setError('No dependencies or functions found in the analyzed files.');
          setIsLoading(false);
          return;
        }
        
        // Convert to React Flow format
        const { nodes: flowNodes, edges: flowEdges } = graphToReactFlow(dependencyGraph);
        setProgress(85);
        
        // Apply layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          flowNodes, 
          flowEdges, 
          layoutDirection
        );
        
        setProgress(100);
        
        setGraph(dependencyGraph);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        
        console.log(`Graph built successfully: ${layoutedNodes.length} nodes, ${layoutedEdges.length} edges`);
      } catch (error) {
        console.error('Error building graph:', error);
        setError(`Failed to build dependency graph: ${error.message}`);
      } finally {
        setIsLoading(false);
        setProgress(0);
      }
    };

    buildGraph();
  }, [files, layoutDirection, setNodes, setEdges]);

  // Handle node click for ripple effect
  const onNodeClick = useCallback((event, node) => {
    if (!graph) return;

    console.log('Node clicked:', node.id);
    setSelectedNode(node.id);
    
    // Find downstream and upstream nodes
    const downstream = findDownstreamNodes(graph, node.id);
    const upstream = findUpstreamNodes(graph, node.id);
    
    const highlighted = new Set([node.id, ...downstream, ...upstream]);
    setHighlightedNodes(highlighted);

    console.log(`Ripple effect: ${highlighted.size} nodes highlighted`);

    // Update node styles with smooth transitions
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: highlighted.has(n.id) ? 1 : 0.3,
          transform: highlighted.has(n.id) ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.3s ease',
        },
      }))
    );

    // Update edge styles
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: highlighted.has(e.source) && highlighted.has(e.target) ? 1 : 0.2,
          strokeWidth: highlighted.has(e.source) && highlighted.has(e.target) ? 3 : 1,
          transition: 'all 0.3s ease',
        },
      }))
    );
  }, [graph, setNodes, setEdges]);

  // Handle node hover for tooltip
  const onNodeMouseEnter = useCallback((event, node) => {
    setTooltipData({
      node,
      position: { x: event.clientX, y: event.clientY }
    });
    setShowTooltip(true);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setShowTooltip(false);
    setTooltipData(null);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setHighlightedNodes(new Set());
    
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
          transform: 'scale(1)',
          transition: 'all 0.3s ease',
        },
      }))
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: 1,
          strokeWidth: e.data?.type === 'imports' ? 3 : e.data?.type === 'calls' ? 2 : 1,
          transition: 'all 0.3s ease',
        },
      }))
    );
  }, [setNodes, setEdges]);

  // Re-layout graph
  const onLayout = useCallback((direction) => {
    setLayoutDirection(direction);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!graph) return null;
    return getGraphStats(graph);
  }, [graph]);

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {progress}%
              </span>
            </div>
          </div>
          <p className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Building dependency graph...
          </p>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Analyzing {files?.length || 0} files
          </p>
          <div className={`mt-4 w-64 h-2 rounded-full mx-auto ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-full flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center max-w-md">
          <div className={`mb-4 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-500'
          }`}>
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-500'
          }`}>
            Error Building Graph
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {error}
          </p>
          <p className={`text-xs mt-2 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Try uploading a project with JavaScript or TypeScript files
          </p>
        </div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`mb-4 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            No files to analyze
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Upload a codebase to see the dependency graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full relative ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={clearSelection}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className={theme === 'dark' ? 'dark' : ''}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background 
          color={theme === 'dark' ? '#374151' : '#e5e7eb'} 
          gap={20} 
          size={1}
        />
        <Controls 
          className={theme === 'dark' ? 'dark' : ''}
          showInteractive={false}
        />
        <MiniMap 
          nodeColor={(node) => {
            if (highlightedNodes.has(node.id)) {
              return node.data.type === 'file' ? '#3b82f6' : '#8b5cf6';
            }
            return theme === 'dark' ? '#6b7280' : '#d1d5db';
          }}
          className={theme === 'dark' ? 'dark' : ''}
          pannable
          zoomable
        />
        
        <Panel position="top-left" className="space-y-3">
          {/* Graph Statistics */}
          <div className={`p-4 rounded-lg shadow-lg backdrop-blur-sm ${
            theme === 'dark' ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90 border border-gray-200'
          }`}>
            <h3 className={`font-bold text-sm mb-3 flex items-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="mr-2">📊</span>
              Dependency Graph
            </h3>
            {stats && (
              <div className={`text-xs space-y-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className="flex justify-between">
                  <span>📁 Files:</span>
                  <span className="font-mono">{stats.fileNodes}</span>
                </div>
                <div className="flex justify-between">
                  <span>⚡ Functions:</span>
                  <span className="font-mono">{stats.functionNodes}</span>
                </div>
                <div className="flex justify-between">
                  <span>📥 Imports:</span>
                  <span className="font-mono">{stats.importEdges}</span>
                </div>
                <div className="flex justify-between">
                  <span>🔗 Calls:</span>
                  <span className="font-mono">{stats.callEdges}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Layout Controls */}
          <div className={`p-4 rounded-lg shadow-lg backdrop-blur-sm ${
            theme === 'dark' ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90 border border-gray-200'
          }`}>
            <h4 className={`font-bold text-sm mb-3 flex items-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="mr-2">🎛️</span>
              Layout
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => onLayout('TB')}
                className={`w-full text-xs px-3 py-2 rounded transition-colors ${
                  layoutDirection === 'TB'
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⬇️ Top to Bottom
              </button>
              <button
                onClick={() => onLayout('LR')}
                className={`w-full text-xs px-3 py-2 rounded transition-colors ${
                  layoutDirection === 'LR'
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ➡️ Left to Right
              </button>
            </div>
          </div>
          
          {/* Ripple Effect Info */}
          {selectedNode && (
            <div className={`p-4 rounded-lg shadow-lg backdrop-blur-sm ${
              theme === 'dark' ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90 border border-gray-200'
            }`}>
              <h4 className={`font-bold text-sm mb-2 flex items-center ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="mr-2">🌊</span>
                Ripple Effect
              </h4>
              <div className={`text-xs mb-3 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Showing {highlightedNodes.size} connected nodes
              </div>
              <button
                onClick={clearSelection}
                className={`w-full text-xs px-3 py-2 rounded transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Clear Selection
              </button>
            </div>
          )}
        </Panel>
      </ReactFlow>
      
      {showTooltip && tooltipData && (
        <GraphNodeTooltip
          node={tooltipData.node}
          position={tooltipData.position}
        />
      )}
    </div>
  );
}