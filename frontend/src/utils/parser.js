import Parser from 'web-tree-sitter';

let parser = null;
let isInitialized = false;

// Initialize Tree-sitter parser with better error handling
export async function initializeParser() {
  if (isInitialized && parser) return parser;
  
  try {
    console.log('Initializing Tree-sitter parser...');
    
    await Parser.init({
      locateFile(scriptName, scriptDirectory) {
        // Use local public files first, then CDN as fallback
        if (scriptName === 'tree-sitter.wasm') {
          return '/tree-sitter.wasm';
        }
        if (scriptName === 'tree-sitter-javascript.wasm') {
          return '/tree-sitter-javascript.wasm';
        }
        return scriptDirectory + scriptName;
      }
    });
    
    parser = new Parser();
    
    // Load JavaScript language grammar with local files first
    try {
      const JavaScript = await Parser.Language.load('/tree-sitter-javascript.wasm');
      parser.setLanguage(JavaScript);
      console.log('✅ JavaScript grammar loaded successfully from local files');
    } catch (error) {
      console.warn('Failed to load local JavaScript grammar, trying CDN...');
      try {
        const JavaScript = await Parser.Language.load('https://cdn.jsdelivr.net/npm/tree-sitter-javascript@0.20.1/tree-sitter-javascript.wasm');
        parser.setLanguage(JavaScript);
        console.log('✅ JavaScript grammar loaded successfully from CDN');
      } catch (cdnError) {
        console.warn('Failed to load JavaScript grammar from CDN, using fallback parsing');
        parser = null;
      }
    }
    
    isInitialized = true;
    return parser;
  } catch (error) {
    console.error('Failed to initialize Tree-sitter:', error);
    // Use fallback parsing
    parser = null;
    isInitialized = true;
    return null;
  }
}

// Fallback regex-based parsing for when Tree-sitter fails
function parseWithRegex(content, filename) {
  const imports = [];
  const functions = [];
  const functionCalls = [];
  
  const lines = content.split('\n');
  
  // Extract imports
  const importRegex = /^import\s+.*?from\s+['"]([^'"]+)['"];?/gm;
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push({
      type: 'import',
      source: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push({
      type: 'require',
      source: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  // Extract functions
  const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?function|(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)/g;
  
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3] || match[4];
    if (name) {
      const line = content.substring(0, match.index).split('\n').length;
      functions.push({
        name,
        type: 'function',
        line,
        startPosition: { row: line - 1, column: match.index }
      });
    }
  }
  
  // Extract function calls
  const callRegex = /(\w+)\s*\(/g;
  while ((match = callRegex.exec(content)) !== null) {
    const name = match[1];
    // Skip common keywords and built-ins
    if (!['if', 'for', 'while', 'switch', 'catch', 'console', 'return'].includes(name)) {
      const line = content.substring(0, match.index).split('\n').length;
      functionCalls.push({
        name,
        line,
        startPosition: { row: line - 1, column: match.index }
      });
    }
  }
  
  return {
    filename,
    imports,
    functions,
    functionCalls,
    tree: null
  };
}

// Extract imports from Tree-sitter tree
export function extractImports(tree) {
  const imports = [];
  
  function traverse(node) {
    if (node.type === 'import_statement') {
      const sourceNode = node.namedChild(node.namedChildCount - 1);
      if (sourceNode && sourceNode.type === 'string') {
        const importPath = sourceNode.text.slice(1, -1);
        imports.push({
          type: 'import',
          source: importPath,
          line: node.startPosition.row + 1,
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
            const requirePath = pathNode.text.slice(1, -1);
            imports.push({
              type: 'require',
              source: requirePath,
              line: node.startPosition.row + 1,
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
        node.type === 'arrow_function' ||
        node.type === 'method_definition') {
      
      let name = 'anonymous';
      
      if (node.type === 'function_declaration') {
        const nameNode = node.namedChild(0);
        if (nameNode && nameNode.type === 'identifier') {
          name = nameNode.text;
        }
      } else if (node.type === 'method_definition') {
        const nameNode = node.namedChild(0);
        if (nameNode) {
          name = nameNode.text;
        }
      } else if (node.parent && node.parent.type === 'variable_declarator') {
        const nameNode = node.parent.namedChild(0);
        if (nameNode && nameNode.type === 'identifier') {
          name = nameNode.text;
        }
      } else if (node.parent && node.parent.type === 'assignment_expression') {
        const leftNode = node.parent.namedChild(0);
        if (leftNode && leftNode.type === 'identifier') {
          name = leftNode.text;
        }
      }
      
      functions.push({
        name,
        type: node.type,
        line: node.startPosition.row + 1,
        startPosition: node.startPosition,
        endPosition: node.endPosition
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
          const propertyNode = functionNode.namedChild(1);
          if (propertyNode) {
            functionName = propertyNode.text;
          }
        }
        
        if (functionName && functionName !== 'require' && functionName !== 'console') {
          calls.push({
            name: functionName,
            line: node.startPosition.row + 1,
            startPosition: node.startPosition,
            endPosition: node.endPosition
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

// Main parsing function with fallback
export async function parseFile(filename, content) {
  try {
    if (!parser) {
      await initializeParser();
    }
    
    if (parser) {
      // Use Tree-sitter parsing
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
    } else {
      // Use regex fallback
      console.log(`Using regex fallback for ${filename}`);
      return parseWithRegex(content, filename);
    }
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    // Fallback to regex parsing
    return parseWithRegex(content, filename);
  }
}

// Parse multiple files
export async function parseFiles(files) {
  if (!files || files.length === 0) {
    return [];
  }
  
  console.log(`Parsing ${files.length} files...`);
  const results = [];
  
  for (const file of files) {
    if (isJavaScriptFile(file.filename)) {
      try {
        const result = await parseFile(file.filename, file.content);
        results.push(result);
        console.log(`Parsed ${file.filename}: ${result.functions.length} functions, ${result.imports.length} imports`);
      } catch (error) {
        console.error(`Failed to parse ${file.filename}:`, error);
      }
    }
  }
  
  console.log(`Successfully parsed ${results.length} files`);
  return results;
}

// Check if file is a JavaScript/TypeScript file
function isJavaScriptFile(filename) {
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
  return extensions.some(ext => filename.toLowerCase().endsWith(ext));
}