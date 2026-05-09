import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { createClient } from 'redis'

const app = express()
const PORT = process.env.PORT || 3000
const MONGO_URL = process.env.MONGO_URL || 'mongodb://root:example@localhost:27017/invoices?authSource=admin'
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const CACHE_KEY = 'invoices:all'
const CACHE_TTL = 60

app.use(cors())
app.use(express.json())

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true },
    client: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' }
  },
  { timestamps: true }
)

const Invoice = mongoose.model('Invoice', invoiceSchema)

const redis = createClient({ url: REDIS_URL })

redis.on('error', (err) => console.error('Redis error:', err))

app.get('/invoices', async (_req, res) => {
  try {
    const cached = await redis.get(CACHE_KEY)
    if (cached) {
      res.json({ data: JSON.parse(cached), cached: true })
      return
    }
    const invoices = await Invoice.find().sort({ createdAt: -1 })
    await redis.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(invoices))
    res.json({ data: invoices, cached: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/invoices', async (req, res) => {
  try {
    const invoice = new Invoice(req.body)
    await invoice.save()
    await redis.del(CACHE_KEY)
    res.status(201).json(invoice)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

async function start() {
  await mongoose.connect(MONGO_URL)
  console.log('Connected to MongoDB')

  await redis.connect()
  console.log('Connected to Redis')

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

start().catch(console.error)
