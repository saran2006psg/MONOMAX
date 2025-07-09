import express from 'express';
import multer from 'multer';
import { CodeParser } from '../services/codeParser.js';

const router = express.Router();
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'));
    }
  }
});

router.post('/upload', upload.single('codebase'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 Processing uploaded file:', req.file.originalname);
    const parser = new CodeParser();
    const result = await parser.parseProject(req.file.path);
    console.log('✅ Successfully processed codebase');
    res.json(result);
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process codebase',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as uploadRouter };