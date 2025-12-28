import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UnitLang } from './types';

function isUnitLang(lang: string): lang is UnitLang {
  return lang === 'en' || lang === 'cs';
}

@Injectable()
export class UnitsService {
  constructor(@InjectModel('Unit') private readonly unitModel: Model<any>) {}

  async autocomplete(q: string, lang = 'en') {
    if (!q) return [];
    const query = q.toLowerCase();
    const locale: UnitLang = isUnitLang(lang) ? lang : 'en';
    const filter = {
      $or: [
        { [`locales.${locale}`]: { $regex: query, $options: 'i' } },
        { symbol: { $regex: query, $options: 'i' } },
      ],
    };
    const units = await this.unitModel.find(filter).limit(10).lean();
    return units.map((u: any) => ({
      id: u._id,
      name: u.locales?.[locale] || u.defaultName,
      symbol: u.symbol,
    }));
  }
}
