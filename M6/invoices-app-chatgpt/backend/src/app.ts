// src/app.ts
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());  // built-in body parser (JSON)[object Object]

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// (Routes will be added here...)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
