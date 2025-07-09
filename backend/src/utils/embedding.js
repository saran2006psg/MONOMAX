import axios from 'axios';
import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'codebase_chunks';
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

// Initialize Qdrant collection
export async function initializeCollection() {
  try {
    // Check if collection exists
    const collections = await client.getCollections();
    const collectionExists = collections.collections.some(
      col => col.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 384, // sentence-transformers/all-MiniLM-L6-v2 embedding size
          distance: 'Cosine',
        },
      });
      console.log(`✅ Created Qdrant collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`✅ Qdrant collection already exists: ${COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error('❌ Error initializing Qdrant collection:', error);
    throw error;
  }
}

// Get embeddings from Hugging Face
async function getEmbeddings(texts) {
  if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_TOKEN is not set in environment variables');
  }

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        inputs: texts,
        options: { wait_for_model: true }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Error getting embeddings from Hugging Face:', error.response?.data || error.message);
    throw error;
  }
}

// Index code chunks into Qdrant
export async function indexCodeChunks(chunks) {
  try {
    console.log(`🔄 Indexing ${chunks.length} code chunks...`);
    
    if (chunks.length === 0) {
      console.log('⚠️ No chunks to index');
      return;
    }

    // Initialize collection if needed
    await initializeCollection();

    // Prepare texts for embedding
    const texts = chunks.map(chunk => 
      `File: ${chunk.file}\nLine: ${chunk.line}\nCode: ${chunk.text}`
    );

    // Get embeddings in batches to avoid API limits
    const batchSize = 10;
    const points = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchTexts = texts.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      
      const embeddings = await getEmbeddings(batchTexts);
      
      // Prepare points for Qdrant
      const batchPoints = batch.map((chunk, index) => ({
        id: i + index + 1, // Unique ID
        vector: embeddings[index],
        payload: {
          file: chunk.file,
          line: chunk.line,
          text: chunk.text,
          type: chunk.type || 'code',
          function_name: chunk.function_name || null,
          indexed_at: new Date().toISOString(),
        },
      }));

      points.push(...batchPoints);
      
      // Small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Insert all points into Qdrant
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: points,
    });

    console.log(`✅ Successfully indexed ${points.length} code chunks`);
    return { success: true, indexed: points.length };
  } catch (error) {
    console.error('❌ Error indexing code chunks:', error);
    throw error;
  }
}

// Clear existing collection (useful for re-indexing)
export async function clearCollection() {
  try {
    await client.deleteCollection(COLLECTION_NAME);
    console.log(`✅ Cleared collection: ${COLLECTION_NAME}`);
  } catch (error) {
    console.error('❌ Error clearing collection:', error);
    throw error;
  }
}