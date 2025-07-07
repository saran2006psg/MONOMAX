import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel
} from 'reactflow';
import dagre from 'dagre';
import { buildDependencyGraph, graphToReactFlow, findDownstreamNodes, findUpstreamNodes } from '../utils/graphBuilder';
import { parseFiles } from '../utils/parser';
import GraphNodeTooltip from './GraphNodeTooltip';
import { useTheme } from '../hooks/useTheme';

// Custom node components
const FileNode = ({ data, selected }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
      selected 
        ? theme === 'dark' 
          ? 'bg-blue-900 border-blue-400 shadow-lg shadow-blue-400/50' 
          : 'bg-blue-100 border-blue-500 shadow-lg shadow-blue-500/30'
        : theme === 'dark'
          ? 'bg-gray-800 border-gray-600 hover:border-blue-400'
          : 'bg-white border-gray-300 hover:border-blue-400'
    }`}>
      <div className={`font-bold text-sm ${
        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
      }`}>
        📁 {data.label}
      </div>
      <div className={`text-xs mt-1 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {data.functions} functions • {data.imports} imports
      </div>
    </div>
  );
};

const FunctionNode = ({ data, selected }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
      selected 
        ? theme === 'dark' 
          ? 'bg-purple-900 border-purple-400 shadow-lg shadow-purple-400/50' 
          : 'bg-purple-100 border-purple-500 shadow-lg shadow-purple-500/30'
        : theme === 'dark'
          ? 'bg-gray-800 border-gray-600 hover:border-purple-400'
          : 'bg-white border-gray-300 hover:border-purple-400'
    }`}>
      <div className={`font-bold text-sm ${
        theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
      }`}>
        ⚡ {data.label}
      </div>
      <div className={`text-xs mt-1 ${
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

// Layout algorithm using Dagre
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 75,
      y: nodeWithPosition.y - 40,
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
  const { theme } = useTheme();

  // Parse files and build graph
  useEffect(() => {
    if (!files || files.length === 0) return;

    const buildGraph = async () => {
      setIsLoading(true);
      try {
        console.log('Parsing files...', files.length);
        // Filter for JavaScript/TypeScript files only
        const jsFiles = files.filter(file => {
          const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
          return extensions.some(ext => file.filename.toLowerCase().endsWith(ext));
        });
        
        if (jsFiles.length === 0) {
          console.log('No JavaScript/TypeScript files found');
          setIsLoading(false);
          return;
        }
        
        const parsedFiles = await parseFiles(jsFiles);
        console.log('Parsed files:', parsedFiles);
        
        const dependencyGraph = buildDependencyGraph(parsedFiles);
        console.log('Built graph with', dependencyGraph.nodeCount(), 'nodes');
        
        const { nodes: flowNodes, edges: flowEdges } = graphToReactFlow(dependencyGraph);
        
        if (flowNodes.length === 0) {
          console.log('No nodes generated from graph');
          setIsLoading(false);
          return;
        }
        
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          flowNodes, 
          flowEdges, 
          layoutDirection
        );
        
        setGraph(dependencyGraph);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (error) {
        console.error('Error building graph:', error);
      } finally {
        setIsLoading(false);
      }
    };

    buildGraph();
  }, [files, layoutDirection, setNodes, setEdges]);

  // Handle node click for ripple effect
  const onNodeClick = useCallback((event, node) => {
    if (!graph) return;

    setSelectedNode(node.id);
    
    // Find downstream and upstream nodes
    const downstream = findDownstreamNodes(graph, node.id);
    const upstream = findUpstreamNodes(graph, node.id);
    
    const highlighted = new Set([node.id, ...downstream, ...upstream]);
    setHighlightedNodes(highlighted);

    // Update node styles
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: highlighted.has(n.id) ? 1 : 0.3,
          transform: highlighted.has(n.id) ? 'scale(1.05)' : 'scale(1)',
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
        },
      }))
    );

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: 1,
          strokeWidth: 2,
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

  const stats = useMemo(() => {
    if (!graph) return null;
    
    const fileNodes = nodes.filter(n => n.data.type === 'file').length;
    const functionNodes = nodes.filter(n => n.data.type === 'function').length;
    const importEdges = edges.filter(e => e.data.type === 'imports').length;
    const callEdges = edges.filter(e => e.data.type === 'calls').length;
    
    return { fileNodes, functionNodes, importEdges, callEdges };
  }, [graph, nodes, edges]);

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Building dependency graph...
          </p>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Parsing {files?.length || 0} files
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
      >
        <Background 
          color={theme === 'dark' ? '#374151' : '#e5e7eb'} 
          gap={20} 
        />
        <Controls 
          className={theme === 'dark' ? 'dark' : ''}
        />
        <MiniMap 
          nodeColor={(node) => {
            if (highlightedNodes.has(node.id)) {
              return node.data.type === 'file' ? '#3b82f6' : '#8b5cf6';
            }
            return theme === 'dark' ? '#6b7280' : '#d1d5db';
          }}
          className={theme === 'dark' ? 'dark' : ''}
        />
        
        <Panel position="top-left" className="space-y-2">
          <div className={`p-3 rounded-lg shadow-lg ${
            theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`font-bold text-sm mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Dependency Graph
            </h3>
            {stats && (
              <div className={`text-xs space-y-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div>📁 {stats.fileNodes} files</div>
                <div>⚡ {stats.functionNodes} functions</div>
                <div>📥 {stats.importEdges} imports</div>
                <div>🔗 {stats.callEdges} calls</div>
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-lg shadow-lg ${
            theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h4 className={`font-bold text-sm mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Layout
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => onLayout('TB')}
                className={`w-full text-xs px-2 py-1 rounded transition-colors ${
                  layoutDirection === 'TB'
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Top to Bottom
              </button>
              <button
                onClick={() => onLayout('LR')}
                className={`w-full text-xs px-2 py-1 rounded transition-colors ${
                  layoutDirection === 'LR'
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Left to Right
              </button>
            </div>
          </div>
          
          {selectedNode && (
            <div className={`p-3 rounded-lg shadow-lg ${
              theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <h4 className={`font-bold text-sm mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Ripple Effect
              </h4>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Showing {highlightedNodes.size} connected nodes
              </div>
              <button
                onClick={clearSelection}
                className={`mt-2 w-full text-xs px-2 py-1 rounded transition-colors ${
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