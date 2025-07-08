import express from 'express';
import multer from 'multer';
import { parseCodebase } from '../services/codeParser.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('codebase'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await parseCodebase(req.file.path);
    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process codebase' });
  }
});

export { router as uploadRouter };