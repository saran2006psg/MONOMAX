import { Graph } from 'graphlib';

// Create a dependency graph from parsed files
export function buildDependencyGraph(parsedFiles) {
  console.log('Building dependency graph from', parsedFiles.length, 'files');
  
  const graph = new Graph({ directed: true });
  const fileMap = new Map();
  const functionMap = new Map();
  
  // First pass: Create file nodes and function nodes
  parsedFiles.forEach(file => {
    const fileId = `file:${file.filename}`;
    const fileName = file.filename.split('/').pop() || file.filename;
    
    // Add file node
    graph.setNode(fileId, {
      id: fileId,
      type: 'file',
      label: fileName,
      filename: file.filename,
      functions: file.functions.length,
      imports: file.imports.length,
      size: file.functions.length + file.imports.length
    });
    
    fileMap.set(file.filename, fileId);
    
    // Add function nodes for this file
    file.functions.forEach((func, index) => {
      const functionId = `func:${file.filename}:${func.name}:${func.line || index}`;
      
      graph.setNode(functionId, {
        id: functionId,
        type: 'function',
        label: func.name,
        filename: file.filename,
        functionName: func.name,
        line: func.line || index + 1,
        parentFile: fileId
      });
      
      // Store function mapping for lookup
      functionMap.set(`${file.filename}:${func.name}`, functionId);
      functionMap.set(func.name, functionId); // Global lookup
      
      // Connect function to its file
      graph.setEdge(fileId, functionId, {
        type: 'contains',
        label: 'contains'
      });
    });
  });
  
  // Second pass: Create import edges (file-level dependencies)
  parsedFiles.forEach(file => {
    const sourceFileId = fileMap.get(file.filename);
    if (!sourceFileId) return;
    
    file.imports.forEach(imp => {
      const resolvedPath = resolveImportPath(imp.source, file.filename, Array.from(fileMap.keys()));
      const targetFileId = fileMap.get(resolvedPath);
      
      if (targetFileId && sourceFileId !== targetFileId) {
        graph.setEdge(sourceFileId, targetFileId, {
          type: 'imports',
          label: `imports`,
          source: imp.source,
          importType: imp.type
        });
      }
    });
  });
  
  // Third pass: Create function call edges
  parsedFiles.forEach(file => {
    if (!file.functionCalls) return;
    
    file.functionCalls.forEach(call => {
      // Find the target function
      let targetFunctionId = functionMap.get(`${file.filename}:${call.name}`);
      
      // If not found in same file, look globally
      if (!targetFunctionId) {
        // Look for the function in other files
        for (const [key, id] of functionMap.entries()) {
          if (key.includes(':') && key.endsWith(`:${call.name}`)) {
            targetFunctionId = id;
            break;
          }
        }
      }
      
      if (targetFunctionId) {
        // Find the calling function (the function that contains this call)
        const callingFunction = findContainingFunction(file.functions, call.line);
        
        if (callingFunction) {
          const callingFunctionId = functionMap.get(`${file.filename}:${callingFunction.name}`);
          if (callingFunctionId && callingFunctionId !== targetFunctionId) {
            graph.setEdge(callingFunctionId, targetFunctionId, {
              type: 'calls',
              label: 'calls',
              line: call.line
            });
          }
        }
      }
    });
  });
  
  console.log(`Graph built with ${graph.nodeCount()} nodes and ${graph.edgeCount()} edges`);
  return graph;
}

// Find which function contains a given line number
function findContainingFunction(functions, line) {
  if (!line || !functions.length) return null;
  
  // Sort functions by line number
  const sortedFunctions = functions.sort((a, b) => (a.line || 0) - (b.line || 0));
  
  // Find the function that starts before or at the line and ends after it
  for (let i = 0; i < sortedFunctions.length; i++) {
    const func = sortedFunctions[i];
    const nextFunc = sortedFunctions[i + 1];
    
    const funcStart = func.line || 0;
    const funcEnd = nextFunc ? nextFunc.line : Infinity;
    
    if (line >= funcStart && line < funcEnd) {
      return func;
    }
  }
  
  // If not found, return the last function (likely contains the call)
  return sortedFunctions[sortedFunctions.length - 1];
}

// Improved import path resolution
function resolveImportPath(importPath, currentFile, allFiles) {
  // Handle relative imports
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const currentDir = currentFile.split('/').slice(0, -1);
    const importParts = importPath.split('/');
    const resolvedParts = [...currentDir];
    
    for (const part of importParts) {
      if (part === '..') {
        resolvedParts.pop();
      } else if (part !== '.') {
        resolvedParts.push(part);
      }
    }
    
    let resolved = resolvedParts.join('/');
    
    // Try different extensions
    const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.json', '/index.js', '/index.ts'];
    for (const ext of extensions) {
      const candidate = resolved + ext;
      if (allFiles.includes(candidate)) {
        return candidate;
      }
    }
    
    return resolved + '.js'; // Default fallback
  }
  
  // Handle absolute imports - look for matching files
  const possiblePaths = allFiles.filter(file => 
    file.includes(importPath) || 
    file.endsWith(`/${importPath}.js`) ||
    file.endsWith(`/${importPath}.ts`) ||
    file.endsWith(`/${importPath}/index.js`) ||
    file.endsWith(`/${importPath}/index.ts`)
  );
  
  if (possiblePaths.length > 0) {
    return possiblePaths[0];
  }
  
  // For npm packages and unresolved imports, return as-is
  return importPath;
}

// Convert graphlib graph to React Flow format
export function graphToReactFlow(graph) {
  const nodes = [];
  const edges = [];
  
  // Convert nodes
  graph.nodes().forEach(nodeId => {
    const nodeData = graph.node(nodeId);
    
    nodes.push({
      id: nodeId,
      type: nodeData.type === 'file' ? 'fileNode' : 'functionNode',
      data: nodeData,
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
    });
  });
  
  // Convert edges
  graph.edges().forEach(edge => {
    const edgeData = graph.edge(edge.v, edge.w);
    
    edges.push({
      id: `${edge.v}-${edge.w}`,
      source: edge.v,
      target: edge.w,
      type: 'smoothstep',
      data: edgeData,
      style: {
        stroke: getEdgeColor(edgeData.type),
        strokeWidth: getEdgeWidth(edgeData.type),
        strokeDasharray: edgeData.type === 'contains' ? '5,5' : 'none'
      },
      label: edgeData.label,
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold',
        fill: getEdgeColor(edgeData.type)
      },
      animated: edgeData.type === 'calls'
    });
  });
  
  console.log(`Converted to React Flow: ${nodes.length} nodes, ${edges.length} edges`);
  return { nodes, edges };
}

function getEdgeColor(type) {
  switch (type) {
    case 'imports':
      return '#ff9800'; // Orange
    case 'calls':
      return '#4caf50'; // Green
    case 'contains':
      return '#9e9e9e'; // Gray
    default:
      return '#666';
  }
}

function getEdgeWidth(type) {
  switch (type) {
    case 'imports':
      return 3;
    case 'calls':
      return 2;
    case 'contains':
      return 1;
    default:
      return 2;
  }
}

// Find all downstream nodes (ripple effect)
export function findDownstreamNodes(graph, startNodeId) {
  const visited = new Set();
  const downstream = new Set();
  
  function dfs(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const successors = graph.successors(nodeId) || [];
    successors.forEach(successor => {
      downstream.add(successor);
      dfs(successor);
    });
  }
  
  dfs(startNodeId);
  return Array.from(downstream);
}

// Find all upstream nodes
export function findUpstreamNodes(graph, startNodeId) {
  const visited = new Set();
  const upstream = new Set();
  
  function dfs(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const predecessors = graph.predecessors(nodeId) || [];
    predecessors.forEach(predecessor => {
      upstream.add(predecessor);
      dfs(predecessor);
    });
  }
  
  dfs(startNodeId);
  return Array.from(upstream);
}

// Get graph statistics
export function getGraphStats(graph) {
  const nodes = graph.nodes();
  const edges = graph.edges();
  
  const fileNodes = nodes.filter(id => graph.node(id).type === 'file').length;
  const functionNodes = nodes.filter(id => graph.node(id).type === 'function').length;
  const importEdges = edges.filter(e => graph.edge(e.v, e.w).type === 'imports').length;
  const callEdges = edges.filter(e => graph.edge(e.v, e.w).type === 'calls').length;
  const containsEdges = edges.filter(e => graph.edge(e.v, e.w).type === 'contains').length;
  
  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    fileNodes,
    functionNodes,
    importEdges,
    callEdges,
    containsEdges
  };
}