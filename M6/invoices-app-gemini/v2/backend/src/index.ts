import express from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoicedb';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_KEY = 'invoices_cache';

// Redis Setup
const redisClient = createClient({ url: REDIS_URL });
redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.connect();

// MongoDB Schema
const InvoiceSchema = new mongoose.Schema({
  clientName: String,
  amount: Number,
  date: { type: Date, default: Date.now }
});
const Invoice = mongoose.model('Invoice', InvoiceSchema);

// GET /invoices
app.get('/invoices', async (req, res) => {
  try {
    const cachedData = await redisClient.get(CACHE_KEY);
    if (cachedData) {
      console.log('⚡ Cache Hit');
      return res.json(JSON.parse(cachedData));
    }

    console.log('🐢 Cache Miss');
    const invoices = await Invoice.find().sort({ date: -1 });
    await redisClient.setEx(CACHE_KEY, 3600, JSON.stringify(invoices));
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /invoices
app.post('/invoices', async (req, res) => {
  const { clientName, amount } = req.body;
  const newInvoice = new Invoice({ clientName, amount });
  await newInvoice.save();

  // Invalidate cache
  await redisClient.del(CACHE_KEY);
  res.status(201).json(newInvoice);
});

mongoose.connect(MONGO_URI).then(() => {
  app.listen(3000, () => console.log('🚀 Server running on port 3000'));
});
