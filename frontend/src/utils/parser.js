import Parser from 'web-tree-sitter';

let parser = null;
let isInitialized = false;

// Initialize Tree-sitter parser
export async function initializeParser() {
  if (isInitialized) return parser;
  
  try {
    await Parser.init();
    parser = new Parser();
    
    // Load JavaScript language grammar
    const JavaScript = await Parser.Language.load('/tree-sitter-javascript.wasm');
    parser.setLanguage(JavaScript);
    
    isInitialized = true;
    return parser;
  } catch (error) {
    console.error('Failed to initialize Tree-sitter:', error);
    throw error;
  }
}

// Extract imports from a file
export function extractImports(tree) {
  const imports = [];
  
  function traverse(node) {
    if (node.type === 'import_statement') {
      const sourceNode = node.namedChild(node.namedChildCount - 1);
      if (sourceNode && sourceNode.type === 'string') {
        const importPath = sourceNode.text.slice(1, -1); // Remove quotes
        imports.push({
          type: 'import',
          source: importPath,
          startPosition: node.startPosition,
          endPosition: node.endPosition
        });
      }
    } else if (node.type === 'call_expression') {
      const functionNode = node.namedChild(0);
      if (functionNode && functionNode.text === 'require') {
        const argumentNode = node.namedChild(1);
        if (argumentNode && argumentNode.type === 'arguments') {
          const pathNode = argumentNode.namedChild(0);
          if (pathNode && pathNode.type === 'string') {
            const requirePath = pathNode.text.slice(1, -1); // Remove quotes
            imports.push({
              type: 'require',
              source: requirePath,
              startPosition: node.startPosition,
              endPosition: node.endPosition
            });
          }
        }
      }
    }
    
    for (let i = 0; i < node.namedChildCount; i++) {
      traverse(node.namedChild(i));
    }
  }
  
  traverse(tree.rootNode);
  return imports;
}

// Extract function declarations
export function extractFunctions(tree) {
  const functions = [];
  
  function traverse(node) {
    if (node.type === 'function_declaration' || 
        node.type === 'function_expression' || 
        node.type === 'arrow_function') {
      
      let name = 'anonymous';
      
      if (node.type === 'function_declaration') {
        const nameNode = node.namedChild(0);
        if (nameNode && nameNode.type === 'identifier') {
          name = nameNode.text;
        }
      } else if (node.parent && node.parent.type === 'variable_declarator') {
        const nameNode = node.parent.namedChild(0);
        if (nameNode && nameNode.type === 'identifier') {
          name = nameNode.text;
        }
      }
      
      functions.push({
        name,
        type: node.type,
        startPosition: node.startPosition,
        endPosition: node.endPosition,
        line: node.startPosition.row + 1
      });
    }
    
    for (let i = 0; i < node.namedChildCount; i++) {
      traverse(node.namedChild(i));
    }
  }
  
  traverse(tree.rootNode);
  return functions;
}

// Extract function calls
export function extractFunctionCalls(tree) {
  const calls = [];
  
  function traverse(node) {
    if (node.type === 'call_expression') {
      const functionNode = node.namedChild(0);
      if (functionNode) {
        let functionName = '';
        
        if (functionNode.type === 'identifier') {
          functionName = functionNode.text;
        } else if (functionNode.type === 'member_expression') {
          functionName = functionNode.text;
        }
        
        if (functionName && functionName !== 'require') {
          calls.push({
            name: functionName,
            startPosition: node.startPosition,
            endPosition: node.endPosition,
            line: node.startPosition.row + 1
          });
        }
      }
    }
    
    for (let i = 0; i < node.namedChildCount; i++) {
      traverse(node.namedChild(i));
    }
  }
  
  traverse(tree.rootNode);
  return calls;
}

// Main parsing function
export async function parseFile(filename, content) {
  if (!parser) {
    await initializeParser();
  }
  
  try {
    const tree = parser.parse(content);
    
    const imports = extractImports(tree);
    const functions = extractFunctions(tree);
    const functionCalls = extractFunctionCalls(tree);
    
    return {
      filename,
      imports,
      functions,
      functionCalls,
      tree
    };
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return {
      filename,
      imports: [],
      functions: [],
      functionCalls: [],
      tree: null
    };
  }
}

// Parse multiple files
export async function parseFiles(files) {
  const results = [];
  
  for (const file of files) {
    const result = await parseFile(file.filename, file.content);
    results.push(result);
  }
  
  return results;
}