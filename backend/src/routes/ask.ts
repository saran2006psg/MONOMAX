import express, { Request, Response } from 'express';
import { FileUtils } from '../utils/fileUtils.js';
import { CodeParser } from '../services/codeParser.js';

const router = express.Router();

// POST /api/ask - Answer questions about the codebase
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    // Validate input
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        error: 'Question is required and must be a non-empty string'
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({
        error: 'Question is too long. Please keep it under 1000 characters.'
      });
    }

    console.log(`📝 Received question: ${question}`);

    // Simple mock response since AI service isn't set up yet
    const result = {
      answer: `I understand you're asking: "${question}". The AI service is not fully configured yet, but I can help you navigate your codebase. Please make sure your codebase is properly uploaded and parsed first.`,
      sources: [],
      confidence: 0.5
    };

    res.json({
      success: true,
      question: question.trim(),
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in /api/ask:', error);

    // Handle specific error types
    if (error.message.includes('HUGGINGFACE_TOKEN')) {
      return res.status(500).json({
        error: 'AI service configuration error. Please check server configuration.',
        details: 'Hugging Face token not configured'
      });
    }

    if (error.code === 'ECONNREFUSED' || error.message.includes('Qdrant')) {
      return res.status(500).json({
        error: 'Vector database connection error. Please ensure Qdrant is running.',
        details: 'Cannot connect to Qdrant at http://localhost:6333'
      });
    }

    res.status(500).json({
      error: 'Failed to process question',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/ask/health - Health check for AI services
router.get('/ask/health', async (req: Request, res: Response) => {
  try {
    const { QdrantClient } = await import('@qdrant/js-client-rest');
    const client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });

    // Check Qdrant connection
    const collections = await client.getCollections();
    const collectionExists = collections.collections.some(
      col => col.name === (process.env.QDRANT_COLLECTION || 'codebase_chunks')
    );

    res.json({
      success: true,
      services: {
        qdrant: {
          status: 'connected',
          url: process.env.QDRANT_URL || 'http://localhost:6333',
          collection_exists: collectionExists
        },
        huggingface: {
          status: process.env.HUGGINGFACE_TOKEN ? 'configured' : 'not_configured'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Service health check failed',
      details: error.message
    });
  }
});

// GET /api/file-content - Get file content and symbols
router.get('/file-content', async (req: Request, res: Response) => {
  try {
    const { path } = req.query;
    
    if (!path || typeof path !== 'string') {
      return res.status(400).json({
        error: 'File path is required'
      });
    }

    // Read file content
    const content = await FileUtils.readFile(path);
    
    // Parse symbols from the file
    const parser = new CodeParser();
    const symbols = await parser.parseFileSymbols(path);
    
    res.json({
      success: true,
      content,
      symbols,
      path
    });
    
  } catch (error: any) {
    console.error('❌ Error reading file:', error);
    res.status(500).json({
      error: 'Failed to read file',
      details: error.message
    });
  }
});

// GET /api/search - Search through codebase
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { term } = req.query;
    
    if (!term || typeof term !== 'string') {
      return res.status(400).json({
        error: 'Search term is required'
      });
    }

    // This is a simple mock search for now
    // In a real implementation, this would search through indexed files
    const results = [
      {
        file: 'example.ts',
        line: 10,
        symbolKind: 'function',
        context: `function ${term}() { // Example search result }`
      }
    ];

    res.json(results);
    
  } catch (error: any) {
    console.error('❌ Error searching:', error);
    res.status(500).json({
      error: 'Failed to search',
      details: error.message
    });
  }
});

export { router as askRouter };
