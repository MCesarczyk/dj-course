// src/models/Invoice.ts
import { Schema, model, connect } from 'mongoose';

// 1. Define an interface for TypeScript
interface Invoice {
  title: string;
  amount: number;
  date: Date;
}

// 2. Create a Mongoose schema matching the interface
const invoiceSchema = new Schema<Invoice>({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date:   { type: Date,   required: true },
});

// 3. Create a Model.
const InvoiceModel = model<Invoice>('Invoice', invoiceSchema);
export default InvoiceModel;
