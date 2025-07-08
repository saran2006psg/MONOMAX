import express from 'express';
import cors from 'cors';
import { uploadRouter } from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', uploadRouter);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});