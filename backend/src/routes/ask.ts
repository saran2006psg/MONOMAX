import express, { Request, Response } from 'express';
import { answerQuestion } from '../utils/ask.js';

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

    // Get answer from AI
    const result = await answerQuestion(question.trim());

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

export { router as askRouter };
