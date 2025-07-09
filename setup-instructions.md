# 🚀 Complete Setup Instructions for AI Assistant

## 📋 Prerequisites

1. **Docker** installed on your system
2. **Node.js** (v18+) and npm
3. **Hugging Face Account** (free)

## 🔧 Step-by-Step Setup

### 1. Start Qdrant Database

**Option A: Using Docker directly**
```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant:latest
```

**Option B: Using Docker Compose (recommended)**
```bash
# In your project root
docker-compose up -d qdrant
```

### 2. Get Your Hugging Face Token

1. Go to https://huggingface.co/
2. Sign up/Login (free)
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Copy the token (starts with `hf_`)

### 3. Configure Environment

Create `backend/.env`:
```env
HUGGINGFACE_TOKEN=hf_your_actual_token_here
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=codebase_chunks
NODE_ENV=development
```

### 4. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Test the AI Assistant

1. Open http://localhost:5173
2. Upload a zip file with your codebase
3. Wait for processing to complete
4. Click "Ask AI" button
5. Ask questions like:
   - "How does authentication work?"
   - "What React components are available?"
   - "Show me the database connection code"

## 🧪 Testing Commands

### Check if Qdrant is running:
```bash
curl http://localhost:6333/collections
```

### Test the AI endpoint:
```bash
curl -X POST http://localhost:3001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "How does file upload work?"}'
```

### Check service health:
```bash
curl http://localhost:3001/api/ask/health
```

## 🔍 Troubleshooting

### Qdrant Connection Issues:
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Check Qdrant logs
docker logs <qdrant_container_id>

# Restart Qdrant
docker restart <qdrant_container_id>
```

### Hugging Face API Issues:
- Verify your token is correct
- Check rate limits (1000 requests/hour free tier)
- Wait 20 seconds for model loading on first request

### Backend Issues:
```bash
# Check backend logs
cd backend && npm run dev

# Verify environment variables
node -e "console.log(process.env.HUGGINGFACE_TOKEN)"
```

## 🎯 What Each Service Does

- **Qdrant**: Stores code embeddings for semantic search
- **Hugging Face**: Provides AI models for embeddings and text generation
- **Backend**: Processes uploads, creates embeddings, handles AI requests
- **Frontend**: User interface for uploading code and chatting with AI

## 🚀 Ready to Use!

Once everything is running:
1. Upload your codebase (zip file)
2. Wait for indexing to complete
3. Start asking questions about your code!

The AI will understand your codebase and provide contextual answers with source references.