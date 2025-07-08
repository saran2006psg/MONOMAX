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

// Enhanced custom node components with advanced animations
const FileNode = ({ data, selected }) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  
  useEffect(() => {
    if (selected) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [selected]);
  
  return (
    <div 
      className={`relative px-5 py-4 rounded-2xl border-2 transition-all duration-500 min-w-[160px] max-w-[220px] cursor-pointer group overflow-hidden ${
        selected 
          ? theme === 'dark' 
            ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 border-blue-400 shadow-2xl shadow-blue-400/60 scale-110' 
            : 'bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 border-blue-500 shadow-2xl shadow-blue-500/40 scale-110'
          : theme === 'dark'
            ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border-gray-600 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-400/30 hover:scale-105'
            : 'bg-gradient-to-br from-white via-gray-50 to-blue-50 border-gray-300 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105'
      } ${pulseAnimation ? 'animate-pulse' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: selected ? 'scale(1.1) rotate(1deg)' : isHovered ? 'scale(1.05) rotate(0.5deg)' : 'scale(1)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full opacity-0 ${
              theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
            } ${isHovered || selected ? 'animate-ping' : ''}`}
            style={{
              top: `${20 + i * 30}%`,
              left: `${10 + i * 25}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: '2s',
            }}
          />
        ))}
      </div>
      
      {/* Glowing border effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 ${
        isHovered || selected ? 'opacity-100' : ''
      }`}>
        <div className={`absolute inset-0 rounded-2xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20' 
            : 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10'
        } animate-pulse`} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className={`font-bold text-base mb-3 truncate flex items-center ${
          theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
        }`} title={data.filename}>
          <div className="relative mr-3">
            <span className="text-2xl">📁</span>
            {(isHovered || selected) && (
              <div className="absolute -inset-1 bg-blue-500/20 rounded-full animate-ping" />
            )}
          </div>
          <span className="truncate">{data.label}</span>
        </div>
        
        <div className="space-y-2">
          <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
            theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-100/70 hover:bg-gray-200/70'
          }`}>
            <span className="flex items-center text-sm">
              <span className="mr-2 text-lg animate-bounce" style={{ animationDelay: '0.1s' }}>⚡</span>
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Functions</span>
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              theme === 'dark' ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'
            }`}>
              {data.functions}
            </span>
          </div>
          
          <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
            theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-100/70 hover:bg-gray-200/70'
          }`}>
            <span className="flex items-center text-sm">
              <span className="mr-2 text-lg animate-bounce" style={{ animationDelay: '0.2s' }}>📥</span>
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Imports</span>
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              theme === 'dark' ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-700'
            }`}>
              {data.imports}
            </span>
          </div>
        </div>
      </div>
      
      {/* Ripple effect on selection */}
      {selected && (
        <>
          <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 animate-ping opacity-75" />
          <div className="absolute inset-0 rounded-2xl border-2 border-blue-300 animate-ping opacity-50" style={{ animationDelay: '0.3s' }} />
        </>
      )}
      
      {/* Hover glow effect */}
      {isHovered && !selected && (
        <div className="absolute inset-0 rounded-2xl border border-blue-400/50 shadow-lg shadow-blue-400/20 animate-pulse" />
      )}
    </div>
  );
};

const FunctionNode = ({ data, selected }) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [sparkleAnimation, setSparkleAnimation] = useState(false);
  
  useEffect(() => {
    if (selected) {
      setSparkleAnimation(true);
      const timer = setTimeout(() => setSparkleAnimation(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [selected]);
  
  return (
    <div 
      className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-500 min-w-[120px] max-w-[180px] cursor-pointer group overflow-hidden ${
        selected 
          ? theme === 'dark' 
            ? 'bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 border-purple-400 shadow-2xl shadow-purple-400/60 scale-110' 
            : 'bg-gradient-to-br from-purple-100 via-purple-50 to-pink-100 border-purple-500 shadow-2xl shadow-purple-500/40 scale-110'
          : theme === 'dark'
            ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border-gray-600 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-400/30 hover:scale-105'
            : 'bg-gradient-to-br from-white via-gray-50 to-purple-50 border-gray-300 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: selected ? 'scale(1.1) rotate(-1deg)' : isHovered ? 'scale(1.05) rotate(-0.5deg)' : 'scale(1)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Sparkle effects */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        {sparkleAnimation && [...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${
              theme === 'dark' ? 'bg-purple-300' : 'bg-purple-600'
            } animate-ping`}
            style={{
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
      
      {/* Animated background glow */}
      <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 ${
        isHovered || selected ? 'opacity-100' : ''
      }`}>
        <div className={`absolute inset-0 rounded-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20' 
            : 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10'
        } animate-pulse`} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className={`font-bold text-sm mb-2 truncate flex items-center ${
          theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
        }`} title={data.functionName}>
          <div className="relative mr-2">
            <span className="text-lg">⚡</span>
            {(isHovered || selected) && (
              <div className="absolute -inset-1 bg-purple-500/30 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
            )}
          </div>
          <span className="truncate">{data.label}</span>
        </div>
        
        <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
          theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-100/70 hover:bg-gray-200/70'
        }`}>
          <span className="flex items-center text-xs">
            <span className="mr-1 text-sm">📍</span>
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Line</span>
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
          }`}>
            {data.line}
          </span>
        </div>
      </div>
      
      {/* Ripple effect on selection */}
      {selected && (
        <>
          <div className="absolute inset-0 rounded-xl border-2 border-purple-400 animate-ping opacity-75" />
          <div className="absolute inset-0 rounded-xl border-2 border-purple-300 animate-ping opacity-50" style={{ animationDelay: '0.2s' }} />
        </>
      )}
      
      {/* Hover glow effect */}
      {isHovered && !selected && (
        <div className="absolute inset-0 rounded-xl border border-purple-400/50 shadow-lg shadow-purple-400/20 animate-pulse" />
      )}
    </div>
  );
};

const nodeTypes = {
  fileNode: FileNode,
  functionNode: FunctionNode,
};

// Enhanced layout algorithm with better spacing and positioning
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 200;
  const nodeHeight = 120;
  const rankSep = direction === 'TB' ? 250 : 300;
  const nodeSep = direction === 'TB' ? 150 : 200;
  
  dagreGraph.setGraph({ 
    rankdir: direction, 
    ranksep: rankSep, 
    nodesep: nodeSep,
    marginx: 100,
    marginy: 100,
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
  const [showStats, setShowStats] = useState(true);
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
        
        // Animate nodes appearing with staggered entrance
        const animatedNodes = layoutedNodes.map((node, index) => ({
          ...node,
          style: {
            ...node.style,
            opacity: 0,
            transform: 'scale(0.3) rotate(180deg)',
            transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s`,
          },
        }));
        
        const animatedEdges = layoutedEdges.map((edge, index) => ({
          ...edge,
          style: {
            ...edge.style,
            opacity: 0,
            strokeDasharray: '10,10',
            strokeDashoffset: '20',
            transition: `all 0.8s ease ${index * 0.05 + 0.5}s`,
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
              transform: 'scale(1) rotate(0deg)',
            },
          })));
          
          setEdges(eds => eds.map(edge => ({
            ...edge,
            style: {
              ...edge.style,
              opacity: 1,
              strokeDasharray: edge.data?.type === 'calls' ? '5,5' : 'none',
              strokeDashoffset: '0',
            },
          })));
        }, 300);
        
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

    // Enhanced node animations with wave effect
    setNodes((nds) =>
      nds.map((n, index) => ({
        ...n,
        style: {
          ...n.style,
          opacity: highlighted.has(n.id) ? 1 : 0.15,
          transform: highlighted.has(n.id) ? 'scale(1.15) rotate(2deg)' : 'scale(0.9)',
          transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05}s`,
          filter: highlighted.has(n.id) ? 'brightness(1.3) saturate(1.2)' : 'brightness(0.6) saturate(0.8)',
          zIndex: highlighted.has(n.id) ? 1000 : 1,
        },
      }))
    );

    // Enhanced edge animations with flowing effect
    setEdges((eds) =>
      eds.map((e, index) => ({
        ...e,
        style: {
          ...e.style,
          opacity: highlighted.has(e.source) && highlighted.has(e.target) ? 1 : 0.05,
          strokeWidth: highlighted.has(e.source) && highlighted.has(e.target) ? 5 : 1,
          transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.03}s`,
          filter: highlighted.has(e.source) && highlighted.has(e.target) ? 'drop-shadow(0 0 12px currentColor)' : 'none',
          strokeDasharray: highlighted.has(e.source) && highlighted.has(e.target) ? '8,4' : e.style.strokeDasharray,
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
      nds.map((n, index) => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
          transform: 'scale(1) rotate(0deg)',
          transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.03}s`,
          filter: 'brightness(1) saturate(1)',
          zIndex: 1,
        },
      }))
    );

    setEdges((eds) =>
      eds.map((e, index) => ({
        ...e,
        style: {
          ...e.style,
          opacity: 1,
          strokeWidth: e.data?.type === 'imports' ? 3 : e.data?.type === 'calls' ? 2 : 1,
          transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.02}s`,
          filter: 'none',
          strokeDasharray: e.data?.type === 'calls' ? '5,5' : e.data?.type === 'contains' ? '3,3' : 'none',
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
    
    // Animate layout change with spring effect
    setNodes(layoutedNodes.map((node, index) => ({
      ...node,
      style: {
        ...node.style,
        transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05}s`,
      },
    })));
    
    setEdges(layoutedEdges.map((edge, index) => ({
      ...edge,
      style: {
        ...edge.style,
        transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.03}s`,
      },
    })));
  }, [nodes, edges, setNodes, setEdges]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!graph) return null;
    return getGraphStats(graph);
  }, [graph]);

  // Enhanced loading screen with particle effects
  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center relative overflow-hidden ${
        theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-blue-50'
      }`}>
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full opacity-30 animate-pulse ${
                theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
              }`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        
        <div className="text-center z-10">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-500"></div>
            <div className="absolute inset-2 animate-spin rounded-full border-b-4 border-purple-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {progress}%
              </span>
            </div>
          </div>
          
          <p className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Building dependency graph...
          </p>
          
          <p className={`text-lg mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {animationPhase === 'parsing' && '🔍 Parsing files...'}
            {animationPhase === 'analyzing' && '🧠 Analyzing code structure...'}
            {animationPhase === 'building' && '🏗️ Building dependency graph...'}
            {animationPhase === 'rendering' && '🎨 Preparing visualization...'}
            {animationPhase === 'layouting' && '📐 Calculating layout...'}
            {animationPhase === 'complete' && '✨ Almost ready...'}
          </p>
          
          <div className={`w-96 h-4 rounded-full mx-auto mb-4 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="h-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-ping" />
            </div>
          </div>
          
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Analyzing {files?.length || 0} files • Creating interactive visualization
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
            <svg className="w-32 h-32 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-500'
          }`}>
            Error Building Graph
          </h3>
          <p className={`text-base mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {error}
          </p>
          <p className={`text-sm ${
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
          <div className={`mb-8 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <svg className="w-32 h-32 mx-auto animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            No files to analyze
          </h3>
          <p className={`text-base ${
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
        maxZoom={3}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
      >
        <Background 
          color={theme === 'dark' ? '#374151' : '#e5e7eb'} 
          gap={30} 
          size={2}
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
          {showStats && (
            <div className={`p-6 rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-800/95 border-gray-700/50 shadow-gray-900/50' 
                : 'bg-white/95 border-gray-200/50 shadow-gray-500/20'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold text-lg flex items-center ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <span className="mr-3 text-2xl animate-pulse">📊</span>
                  Graph Statistics
                </h3>
                <button
                  onClick={() => setShowStats(false)}
                  className={`p-1 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  ✕
                </button>
              </div>
              {stats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    theme === 'dark' ? 'bg-blue-900/30 hover:bg-blue-900/40' : 'bg-blue-100 hover:bg-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm">
                        <span className="mr-2 text-lg">📁</span>
                        Files
                      </span>
                      <span className={`font-mono font-bold text-lg ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {stats.fileNodes}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    theme === 'dark' ? 'bg-purple-900/30 hover:bg-purple-900/40' : 'bg-purple-100 hover:bg-purple-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm">
                        <span className="mr-2 text-lg">⚡</span>
                        Functions
                      </span>
                      <span className={`font-mono font-bold text-lg ${
                        theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        {stats.functionNodes}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    theme === 'dark' ? 'bg-orange-900/30 hover:bg-orange-900/40' : 'bg-orange-100 hover:bg-orange-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm">
                        <span className="mr-2 text-lg">📥</span>
                        Imports
                      </span>
                      <span className={`font-mono font-bold text-lg ${
                        theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        {stats.importEdges}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    theme === 'dark' ? 'bg-green-900/30 hover:bg-green-900/40' : 'bg-green-100 hover:bg-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm">
                        <span className="mr-2 text-lg">🔗</span>
                        Calls
                      </span>
                      <span className={`font-mono font-bold text-lg ${
                        theme === 'dark' ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {stats.callEdges}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Enhanced Layout Controls */}
          <div className={`p-6 rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800/95 border-gray-700/50 shadow-gray-900/50' 
              : 'bg-white/95 border-gray-200/50 shadow-gray-500/20'
          }`}>
            <h4 className={`font-bold text-lg mb-4 flex items-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="mr-3 text-2xl">🎛️</span>
              Layout Controls
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => onLayout('TB')}
                className={`w-full text-sm px-5 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${
                  layoutDirection === 'TB'
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 scale-105'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md hover:scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md hover:scale-105'
                }`}
              >
                <span className="mr-3 text-lg">⬇️</span>
                Top to Bottom
              </button>
              <button
                onClick={() => onLayout('LR')}
                className={`w-full text-sm px-5 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${
                  layoutDirection === 'LR'
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 scale-105'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md hover:scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md hover:scale-105'
                }`}
              >
                <span className="mr-3 text-lg">➡️</span>
                Left to Right
              </button>
            </div>
          </div>
          
          {/* Enhanced Ripple Effect Info */}
          {selectedNode && (
            <div className={`p-6 rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-300 animate-in slide-in-from-left ${
              theme === 'dark' 
                ? 'bg-gray-800/95 border-gray-700/50 shadow-gray-900/50' 
                : 'bg-white/95 border-gray-200/50 shadow-gray-500/20'
            }`}>
              <h4 className={`font-bold text-lg mb-4 flex items-center ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="mr-3 text-2xl animate-bounce">🌊</span>
                Ripple Effect Active
              </h4>
              <div className={`text-base mb-4 p-3 rounded-lg ${
                theme === 'dark' ? 'text-gray-300 bg-gray-700/50' : 'text-gray-600 bg-gray-100'
              }`}>
                Showing <span className="font-bold text-blue-500">{highlightedNodes.size}</span> connected nodes
              </div>
              <button
                onClick={clearSelection}
                className={`w-full text-sm px-5 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md hover:scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md hover:scale-105'
                }`}
              >
                <span className="mr-3 text-lg">✨</span>
                Clear Selection
              </button>
            </div>
          )}
        </Panel>
        
        {/* Toggle Stats Button */}
        {!showStats && (
          <Panel position="top-left">
            <button
              onClick={() => setShowStats(true)}
              className={`p-3 rounded-xl shadow-lg transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <span className="text-xl">📊</span>
            </button>
          </Panel>
        )}
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