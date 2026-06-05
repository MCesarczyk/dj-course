// src/routes/invoices.ts
import express, { Request, Response } from 'express';
import InvoiceModel from '../models/Invoice';
import redisClient from '../redisClient';

const router = express.Router();

// GET /invoices - get all (with caching)
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Check cache
    const cacheData = await redisClient.get('invoices');
    if (cacheData) {
      console.log('Cache hit');
      return res.json(JSON.parse(cacheData));
    }
    // Cache miss: fetch from DB
    const invoices = await InvoiceModel.find().lean();
    // Store in cache (expire in 3600s)
    await redisClient.setEx('invoices', 3600, JSON.stringify(invoices));
    console.log('Cache miss - fetched from MongoDB');
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// POST /invoices - create new, invalidate cache
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, amount, date } = req.body;
    const newInv = new InvoiceModel({ title, amount, date });
    await newInv.save();
    // Invalidate cache
    await redisClient.del('invoices');
    res.status(201).json(newInv);
  } catch (err) {
    console.error(err);
    res.status(400).send('Invalid data');
  }
});

export default router;
