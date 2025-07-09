# 🚀 MONOMAX Setup Guide

## Prerequisites
- Node.js 18+ installed
- Docker Desktop (for Qdrant database)
- Hugging Face account

## 📋 Step-by-Step Setup

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Set up Qdrant Vector Database

#### Option A: Using Docker (Recommended)
```bash
# Pull and run Qdrant container
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

#### Option B: Using Docker Compose
Create `docker-compose.yml` in the root:
```yaml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage
volumes:
  qdrant_storage:
```

Then run:
```bash
docker-compose up -d
```

### 3. Configure API Keys

#### Get Hugging Face Token
1. Go to https://huggingface.co/settings/tokens
2. Create a new token (Read access is sufficient)
3. Copy the token

#### Update Backend Environment
Edit `backend/.env`:
```env
HUGGINGFACE_TOKEN=hf_your_actual_token_here
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=codebase_chunks
PORT=3001
```

### 4. Start the Application
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001
- Qdrant on http://localhost:6333

## 🔧 Configuration Options

### Environment Variables (backend/.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `HUGGINGFACE_TOKEN` | HF API token for embeddings | Required |
| `QDRANT_URL` | Qdrant database URL | http://localhost:6333 |
| `QDRANT_COLLECTION` | Collection name for embeddings | codebase_chunks |
| `PORT` | Backend server port | 3001 |

### Features Available
- 📁 **File Upload**: Upload zip files containing codebases
- 🔍 **Code Search**: Search through your codebase
- 🤖 **AI Chat**: Ask questions about your code
- 📊 **Dependency Graph**: Visual representation of code dependencies
- 🎨 **Monaco Editor**: Syntax-highlighted code viewing

## 🛠️ Development Commands

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Build frontend for production
npm run build
```

## 🔍 Troubleshooting

### Common Issues

1. **Qdrant Connection Error**
   - Make sure Docker is running
   - Check if Qdrant container is running: `docker ps`
   - Verify port 6333 is available

2. **Hugging Face API Error**
   - Check your token is valid
   - Ensure token has proper permissions
   - Try refreshing the token

3. **File Upload Issues**
   - Check backend/uploads directory exists
   - Verify file permissions
   - Ensure zip files are valid

### Health Checks
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Qdrant: http://localhost:6333/dashboard

## 🎯 Usage Flow

1. **Upload**: Upload a zip file containing your codebase
2. **Parse**: The system will parse and analyze your code
3. **Explore**: Use the file tree to navigate your project
4. **Search**: Search for specific code patterns
5. **Chat**: Ask the AI about your codebase
6. **Graph**: View dependency relationships

## 📚 API Endpoints

- `POST /api/upload` - Upload and parse codebase
- `POST /api/ask` - Ask questions about code
- `GET /api/search` - Search codebase
- `GET /api/file-content` - Get file content

## 🏗️ Architecture

```
Frontend (React/Vite) → Backend (Express/Node) → Qdrant (Vector DB)
                                              → Hugging Face (AI)
```

## 🔒 Security Notes

- Keep your Hugging Face token secure
- Don't commit .env files to version control
- Use environment variables for sensitive data
- Consider rate limiting for production use
