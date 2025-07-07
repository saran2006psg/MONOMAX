import { Graph } from 'graphlib';

// Create a dependency graph from parsed files
export function buildDependencyGraph(parsedFiles) {
  const graph = new Graph({ directed: true });
  const fileMap = new Map();
  const functionMap = new Map();
  
  // Create file nodes and function nodes
  parsedFiles.forEach(file => {
    const fileId = `file:${file.filename}`;
    
    // Add file node
    graph.setNode(fileId, {
      id: fileId,
      type: 'file',
      label: file.filename.split('/').pop() || file.filename,
      filename: file.filename,
      functions: file.functions.length,
      imports: file.imports.length
    });
    
    fileMap.set(file.filename, fileId);
    
    // Add function nodes
    file.functions.forEach(func => {
      const functionId = `func:${file.filename}:${func.name}:${func.line}`;
      
      graph.setNode(functionId, {
        id: functionId,
        type: 'function',
        label: func.name,
        filename: file.filename,
        functionName: func.name,
        line: func.line,
        parentFile: fileId
      });
      
      functionMap.set(`${file.filename}:${func.name}`, functionId);
      
      // Connect function to its file
      graph.setEdge(fileId, functionId, {
        type: 'contains',
        label: 'contains'
      });
    });
  });
  
  // Create edges for imports (file-level dependencies)
  parsedFiles.forEach(file => {
    const sourceFileId = fileMap.get(file.filename);
    
    file.imports.forEach(imp => {
      let targetFilename = resolveImportPath(imp.source, file.filename);
      const targetFileId = fileMap.get(targetFilename);
      
      if (targetFileId && sourceFileId !== targetFileId) {
        graph.setEdge(sourceFileId, targetFileId, {
          type: 'imports',
          label: imp.type,
          source: imp.source
        });
      }
    });
  });
  
  // Create edges for function calls
  parsedFiles.forEach(file => {
    file.functionCalls.forEach(call => {
      // Try to find the function in the same file first
      let targetFunctionId = functionMap.get(`${file.filename}:${call.name}`);
      
      if (!targetFunctionId) {
        // Look for the function in other files
        for (const [key, id] of functionMap.entries()) {
          if (key.endsWith(`:${call.name}`)) {
            targetFunctionId = id;
            break;
          }
        }
      }
      
      if (targetFunctionId) {
        // Find the calling function (approximate by line number)
        const callingFunction = file.functions.find(func => 
          func.line <= call.line && 
          (file.functions.find(f => f.line > func.line && f.line <= call.line) === undefined)
        );
        
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
  
  return graph;
}

// Simple import path resolution
function resolveImportPath(importPath, currentFile) {
  // Handle relative imports
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const currentDir = currentFile.split('/').slice(0, -1).join('/');
    const parts = importPath.split('/');
    const resolvedParts = currentDir ? currentDir.split('/') : [];
    
    for (const part of parts) {
      if (part === '..') {
        resolvedParts.pop();
      } else if (part !== '.') {
        resolvedParts.push(part);
      }
    }
    
    let resolved = resolvedParts.join('/');
    
    // Add common extensions if not present
    if (!resolved.includes('.')) {
      const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
      for (const ext of extensions) {
        // This is a simplified check - in a real implementation,
        // you'd check if the file actually exists
        resolved += ext;
        break;
      }
    }
    
    return resolved;
  }
  
  // For absolute imports, return as-is (could be npm packages)
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
        strokeWidth: 2,
        strokeDasharray: edgeData.type === 'contains' ? '5,5' : 'none'
      },
      label: edgeData.label,
      labelStyle: {
        fontSize: '10px',
        fontWeight: 'bold'
      }
    });
  });
  
  return { nodes, edges };
}

function getEdgeColor(type) {
  switch (type) {
    case 'imports':
      return '#ff9800';
    case 'calls':
      return '#4caf50';
    case 'contains':
      return '#9e9e9e';
    default:
      return '#666';
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