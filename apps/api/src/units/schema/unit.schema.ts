import { Schema, model } from 'mongoose';

export const UnitSchema = new Schema({
  code: { type: String, required: true, unique: true },
  defaultName: { type: String, required: true },
  category: { type: String },
  conversionToBase: { type: Number },
  locales: {
    en: { type: String, required: true },
    cs: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Unit = model('Unit', UnitSchema);
