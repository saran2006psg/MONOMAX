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

// Enhanced custom node components with animations
const FileNode = ({ data, selected }) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-300 min-w-[140px] max-w-[200px] cursor-pointer group ${
        selected 
          ? theme === 'dark' 
            ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-400 shadow-2xl shadow-blue-400/50 scale-110 animate-pulse' 
            : 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-500 shadow-2xl shadow-blue-500/30 scale-110'
          : theme === 'dark'
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-400/20 hover:scale-105'
            : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background glow */}
      <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 ${
        isHovered || selected ? 'opacity-100' : ''
      } ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10' 
          : 'bg-gradient-to-r from-blue-500/5 to-purple-500/5'
      }`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className={`font-bold text-sm mb-2 truncate flex items-center ${
          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
        }`} title={data.filename}>
          <span className="mr-2 text-lg animate-bounce">📁</span>
          {data.label}
        </div>
        <div className={`text-xs space-y-1 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <div className="flex items-center">
            <span className="mr-1">⚡</span>
            <span>{data.functions} functions</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">📥</span>
            <span>{data.imports} imports</span>
          </div>
        </div>
      </div>
      
      {/* Ripple effect on selection */}
      {selected && (
        <div className="absolute inset-0 rounded-xl border-2 border-blue-400 animate-ping opacity-75" />
      )}
    </div>
  );
};

const FunctionNode = ({ data, selected }) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`relative px-3 py-2 rounded-lg border-2 transition-all duration-300 min-w-[100px] max-w-[150px] cursor-pointer group ${
        selected 
          ? theme === 'dark' 
            ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-400 shadow-2xl shadow-purple-400/50 scale-110 animate-pulse' 
            : 'bg-gradient-to-br from-purple-100 to-purple-50 border-purple-500 shadow-2xl shadow-purple-500/30 scale-110'
          : theme === 'dark'
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-400/20 hover:scale-105'
            : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background glow */}
      <div className={`absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 ${
        isHovered || selected ? 'opacity-100' : ''
      } ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10' 
          : 'bg-gradient-to-r from-purple-500/5 to-pink-500/5'
      }`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className={`font-bold text-sm mb-1 truncate flex items-center ${
          theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
        }`} title={data.functionName}>
          <span className="mr-1 text-sm animate-spin">⚡</span>
          {data.label}
        </div>
        <div className={`text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Line {data.line}
        </div>
      </div>
      
      {/* Ripple effect on selection */}
      {selected && (
        <div className="absolute inset-0 rounded-lg border-2 border-purple-400 animate-ping opacity-75" />
      )}
    </div>
  );
};

const nodeTypes = {
  fileNode: FileNode,
  functionNode: FunctionNode,
};

// Enhanced layout algorithm with better spacing
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 180;
  const nodeHeight = 90;
  const rankSep = direction === 'TB' ? 200 : 250;
  const nodeSep = direction === 'TB' ? 120 : 180;
  
  dagreGraph.setGraph({ 
    rankdir: direction, 
    ranksep: rankSep, 
    nodesep: nodeSep,
    marginx: 80,
    marginy: 80,
    acyclicer: 'greedy',
    ranker: 'tight-tree'
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
  const [animationPhase, setAnimationPhase] = useState('idle');
  const { theme } = useTheme();

  // Parse files and build graph with enhanced progress tracking
  useEffect(() => {
    if (!files || files.length === 0) return;

    const buildGraph = async () => {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      setAnimationPhase('parsing');
      
      try {
        console.log('Starting enhanced graph build process...');
        
        // Filter for JavaScript/TypeScript files only
        const jsFiles = files.filter(file => {
          const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
          return extensions.some(ext => file.filename.toLowerCase().endsWith(ext));
        });
        
        if (jsFiles.length === 0) {
          setError('No JavaScript/TypeScript files found in the uploaded project.');
          setIsLoading(false);
          setAnimationPhase('idle');
          return;
        }
        
        setProgress(15);
        console.log(`Found ${jsFiles.length} JS/TS files to parse`);
        
        // Parse files with progress updates
        setAnimationPhase('analyzing');
        const parsedFiles = await parseFiles(jsFiles);
        setProgress(40);
        
        if (parsedFiles.length === 0) {
          setError('Failed to parse any files. Please check if the files contain valid JavaScript/TypeScript code.');
          setIsLoading(false);
          setAnimationPhase('idle');
          return;
        }
        
        console.log(`Successfully parsed ${parsedFiles.length} files`);
        
        // Build dependency graph
        setAnimationPhase('building');
        const dependencyGraph = buildDependencyGraph(parsedFiles);
        setProgress(65);
        
        if (dependencyGraph.nodeCount() === 0) {
          setError('No dependencies or functions found in the analyzed files.');
          setIsLoading(false);
          setAnimationPhase('idle');
          return;
        }
        
        // Convert to React Flow format
        setAnimationPhase('rendering');
        const { nodes: flowNodes, edges: flowEdges } = graphToReactFlow(dependencyGraph);
        setProgress(80);
        
        // Apply layout
        setAnimationPhase('layouting');
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          flowNodes, 
          flowEdges, 
          layoutDirection
        );
        
        setProgress(95);
        
        // Animate nodes appearing
        const animatedNodes = layoutedNodes.map((node, index) => ({
          ...node,
          style: {
            ...node.style,
            opacity: 0,
            transform: 'scale(0.8)',
            transition: `all 0.5s ease ${index * 0.1}s`,
          },
        }));
        
        const animatedEdges = layoutedEdges.map((edge, index) => ({
          ...edge,
          style: {
            ...edge.style,
            opacity: 0,
            transition: `all 0.5s ease ${index * 0.05 + 0.3}s`,
          },
        }));
        
        setGraph(dependencyGraph);
        setNodes(animatedNodes);
        setEdges(animatedEdges);
        
        setProgress(100);
        setAnimationPhase('complete');
        
        // Animate in after a short delay
        setTimeout(() => {
          setNodes(nds => nds.map(node => ({
            ...node,
            style: {
              ...node.style,
              opacity: 1,
              transform: 'scale(1)',
            },
          })));
          
          setEdges(eds => eds.map(edge => ({
            ...edge,
            style: {
              ...edge.style,
              opacity: 1,
            },
          })));
        }, 200);
        
        console.log(`Enhanced graph built successfully: ${layoutedNodes.length} nodes, ${layoutedEdges.length} edges`);
      } catch (error) {
        console.error('Error building graph:', error);
        setError(`Failed to build dependency graph: ${error.message}`);
        setAnimationPhase('error');
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
          if (animationPhase !== 'error') {
            setAnimationPhase('idle');
          }
        }, 1000);
      }
    };

    buildGraph();
  }, [files, layoutDirection, setNodes, setEdges]);

  // Enhanced node click handler with smooth animations
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

    // Enhanced node animations
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: highlighted.has(n.id) ? 1 : 0.2,
          transform: highlighted.has(n.id) ? 'scale(1.1)' : 'scale(0.95)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: highlighted.has(n.id) ? 'brightness(1.2)' : 'brightness(0.7)',
        },
      }))
    );

    // Enhanced edge animations
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: highlighted.has(e.source) && highlighted.has(e.target) ? 1 : 0.1,
          strokeWidth: highlighted.has(e.source) && highlighted.has(e.target) ? 4 : 1,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: highlighted.has(e.source) && highlighted.has(e.target) ? 'drop-shadow(0 0 8px currentColor)' : 'none',
        },
        animated: highlighted.has(e.source) && highlighted.has(e.target),
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

  // Enhanced clear selection with smooth animations
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
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: 'brightness(1)',
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
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: 'none',
        },
        animated: e.data?.type === 'calls',
      }))
    );
  }, [setNodes, setEdges]);

  // Re-layout graph with animation
  const onLayout = useCallback((direction) => {
    setLayoutDirection(direction);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction
    );
    
    // Animate layout change
    setNodes(layoutedNodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    })));
    
    setEdges(layoutedEdges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    })));
  }, [nodes, edges, setNodes, setEdges]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!graph) return null;
    return getGraphStats(graph);
  }, [graph]);

  // Enhanced loading screen
  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center relative overflow-hidden ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-20 animate-pulse ${
            theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
          }`} />
          <div className={`absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full opacity-20 animate-pulse delay-300 ${
            theme === 'dark' ? 'bg-purple-500' : 'bg-purple-400'
          }`} />
        </div>
        
        <div className="text-center z-10">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {progress}%
              </span>
            </div>
          </div>
          
          <p className={`text-xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Building dependency graph...
          </p>
          
          <p className={`text-sm mb-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {animationPhase === 'parsing' && '🔍 Parsing files...'}
            {animationPhase === 'analyzing' && '🧠 Analyzing code structure...'}
            {animationPhase === 'building' && '🏗️ Building dependency graph...'}
            {animationPhase === 'rendering' && '🎨 Preparing visualization...'}
            {animationPhase === 'layouting' && '📐 Calculating layout...'}
            {animationPhase === 'complete' && '✨ Almost ready...'}
          </p>
          
          <div className={`w-80 h-3 rounded-full mx-auto ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          
          <p className={`text-xs mt-2 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Analyzing {files?.length || 0} files
          </p>
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
          <div className={`mb-6 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-500'
          }`}>
            <svg className="w-24 h-24 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className={`text-xl font-bold mb-3 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-500'
          }`}>
            Error Building Graph
          </h3>
          <p className={`text-sm mb-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {error}
          </p>
          <p className={`text-xs ${
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
          <div className={`mb-6 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <svg className="w-24 h-24 mx-auto animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className={`text-xl font-bold mb-3 ${
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
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background 
          color={theme === 'dark' ? '#374151' : '#e5e7eb'} 
          gap={25} 
          size={1.5}
          variant="dots"
        />
        <Controls 
          className={`${theme === 'dark' ? 'dark' : ''} transition-all duration-300`}
          showInteractive={false}
        />
        <MiniMap 
          nodeColor={(node) => {
            if (highlightedNodes.has(node.id)) {
              return node.data.type === 'file' ? '#3b82f6' : '#8b5cf6';
            }
            return theme === 'dark' ? '#6b7280' : '#d1d5db';
          }}
          className={`${theme === 'dark' ? 'dark' : ''} transition-all duration-300`}
          pannable
          zoomable
        />
        
        <Panel position="top-left" className="space-y-4">
          {/* Enhanced Graph Statistics */}
          <div className={`p-5 rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800/95 border-gray-700/50 shadow-gray-900/50' 
              : 'bg-white/95 border-gray-200/50 shadow-gray-500/20'
          }`}>
            <h3 className={`font-bold text-base mb-4 flex items-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="mr-2 text-xl animate-pulse">📊</span>
              Dependency Graph
            </h3>
            {stats && (
              <div className={`text-sm space-y-3 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="mr-2">📁</span>
                    Files:
                  </span>
                  <span className={`font-mono font-bold px-2 py-1 rounded ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {stats.fileNodes}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="mr-2">⚡</span>
                    Functions:
                  </span>
                  <span className={`font-mono font-bold px-2 py-1 rounded ${
                    theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {stats.functionNodes}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="mr-2">📥</span>
                    Imports:
                  </span>
                  <span className={`font-mono font-bold px-2 py-1 rounded ${
                    theme === 'dark' ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {stats.importEdges}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="mr-2">🔗</span>
                    Calls:
                  </span>
                  <span className={`font-mono font-bold px-2 py-1 rounded ${
                    theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                  }`}>
                    {stats.callEdges}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Layout Controls */}
          <div className={`p-5 rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800/95 border-gray-700/50 shadow-gray-900/50' 
              : 'bg-white/95 border-gray-200/50 shadow-gray-500/20'
          }`}>
            <h4 className={`font-bold text-base mb-4 flex items-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="mr-2 text-xl">🎛️</span>
              Layout
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => onLayout('TB')}
                className={`w-full text-sm px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                  layoutDirection === 'TB'
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <span className="mr-2">⬇️</span>
                Top to Bottom
              </button>
              <button
                onClick={() => onLayout('LR')}
                className={`w-full text-sm px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                  layoutDirection === 'LR'
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <span className="mr-2">➡️</span>
                Left to Right
              </button>
            </div>
          </div>
          
          {/* Enhanced Ripple Effect Info */}
          {selectedNode && (
            <div className={`p-5 rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-300 animate-in slide-in-from-left ${
              theme === 'dark' 
                ? 'bg-gray-800/95 border-gray-700/50 shadow-gray-900/50' 
                : 'bg-white/95 border-gray-200/50 shadow-gray-500/20'
            }`}>
              <h4 className={`font-bold text-base mb-3 flex items-center ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="mr-2 text-xl animate-bounce">🌊</span>
                Ripple Effect
              </h4>
              <div className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Showing <span className="font-bold text-blue-500">{highlightedNodes.size}</span> connected nodes
              </div>
              <button
                onClick={clearSelection}
                className={`w-full text-sm px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <span className="mr-2">✨</span>
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