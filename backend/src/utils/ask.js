import axios from 'axios';
import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'codebase_chunks';
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

// Get embedding for a single text
async function getEmbedding(text) {
  if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_TOKEN is not set in environment variables');
  }

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        inputs: [text],
        options: { wait_for_model: true }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data[0]; // Return first (and only) embedding
  } catch (error) {
    console.error('❌ Error getting embedding:', error.response?.data || error.message);
    throw error;
  }
}

// Search for relevant code chunks
async function searchRelevantChunks(question, limit = 5) {
  try {
    // Get embedding for the question
    const questionEmbedding = await getEmbedding(question);

    // Search in Qdrant
    const searchResult = await client.search(COLLECTION_NAME, {
      vector: questionEmbedding,
      limit: limit,
      with_payload: true,
    });

    return searchResult.map(result => ({
      score: result.score,
      file: result.payload.file,
      line: result.payload.line,
      text: result.payload.text,
      type: result.payload.type,
      function_name: result.payload.function_name,
    }));
  } catch (error) {
    console.error('❌ Error searching relevant chunks:', error);
    throw error;
  }
}

// Generate answer using Hugging Face
async function generateAnswer(question, context) {
  if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_TOKEN is not set in environment variables');
  }

  const prompt = `Context: Here are relevant code snippets from the codebase:

${context.map((chunk, index) => 
  `${index + 1}. File: ${chunk.file} (Line ${chunk.line})
${chunk.text}
`).join('\n')}

Question: ${question}

Please provide a helpful answer based on the code context above. Be specific and reference the relevant files and functions when possible.

Answer:`;

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false,
        },
        options: { wait_for_model: true }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for generation
      }
    );

    // Handle different response formats
    let answer = '';
    if (Array.isArray(response.data)) {
      answer = response.data[0]?.generated_text || response.data[0]?.text || 'No answer generated';
    } else if (response.data.generated_text) {
      answer = response.data.generated_text;
    } else {
      answer = 'Unable to generate answer';
    }

    return answer.trim();
  } catch (error) {
    console.error('❌ Error generating answer:', error.response?.data || error.message);
    
    // Fallback: provide a basic answer based on context
    if (context.length > 0) {
      return `Based on the codebase, I found ${context.length} relevant code snippets:\n\n${
        context.map((chunk, index) => 
          `${index + 1}. In ${chunk.file} (line ${chunk.line}): ${chunk.text.substring(0, 100)}...`
        ).join('\n')
      }\n\nPlease check these files for more details about: ${question}`;
    }
    
    throw error;
  }
}

// Main function to answer questions
export async function answerQuestion(question) {
  try {
    console.log(`🤔 Processing question: ${question}`);

    // Search for relevant code chunks
    const relevantChunks = await searchRelevantChunks(question, 5);
    
    if (relevantChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant code snippets for your question. Please try rephrasing or asking about specific functions, files, or concepts in your codebase.",
        sources: [],
        confidence: 0
      };
    }

    console.log(`📚 Found ${relevantChunks.length} relevant chunks`);

    // Generate answer using the context
    const answer = await generateAnswer(question, relevantChunks);

    return {
      answer: answer,
      sources: relevantChunks.map(chunk => ({
        file: chunk.file,
        line: chunk.line,
        score: chunk.score,
        preview: chunk.text.substring(0, 150) + '...'
      })),
      confidence: relevantChunks[0]?.score || 0
    };
  } catch (error) {
    console.error('❌ Error answering question:', error);
    throw error;
  }
}