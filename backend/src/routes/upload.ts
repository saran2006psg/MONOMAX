import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { CodeParser } from '../services/codeParser.js';
import { FileUtils } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const codeParser = new CodeParser();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  },
});

// Upload and process ZIP file
router.post('/upload', upload.single('zipFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const zipFilePath = req.file.path;
    const extractDir = path.join(path.dirname(zipFilePath), `extracted-${uuidv4()}`);

    // Extract ZIP file
    await FileUtils.extractZip(zipFilePath, extractDir);

    // Parse the extracted files
    const result = await codeParser.parseProject(extractDir);

    // Clean up ZIP file
    await FileUtils.deleteFile(zipFilePath);

    res.json({
      ...result,
      projectName: req.file.originalname.replace('.zip', ''),
      extractDir, // Keep this for file content requests
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process uploaded file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get file content
router.get('/file-content', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    const content = await FileUtils.readFile(filePath);
    const symbols = await codeParser.parseFileSymbols(filePath);

    res.json({
      content,
      symbols,
    });
  } catch (error) {
    console.error('File content error:', error);
    res.status(500).json({
      error: 'Failed to read file content',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Search across project
router.get('/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term || typeof term !== 'string') {
      return res.status(400).json({ error: 'Search term is required' });
    }

    // This would typically search through parsed files
    // For now, return empty results
    res.json([]);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as uploadRouter };