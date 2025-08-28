import { Injectable } from '@nestjs/common';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TranslationUsage } from './translation-usage.schema';
import { TranslationUsageTotal } from './translation-usage-total.schema';

@Injectable()
export class GoogleTranslateService {
  private translate: Translate;
  private readonly WORD_LIMIT = 500000;

  constructor(
    @InjectModel(TranslationUsage.name)
    private readonly usageModel: Model<TranslationUsage>,
    @InjectModel(TranslationUsageTotal.name)
    private readonly usageTotalModel: Model<TranslationUsageTotal>
  ) {
    // Use key file from local path
    this.translate = new Translate({
      keyFilename: process.env.GOOGLE_KEY_PATH,
    });
  }

  async canTranslate(words: number): Promise<boolean> {
    // Use rolling total for fast check
    let usageTotal = await this.usageTotalModel.findOne();
    if (!usageTotal) {
      usageTotal = await this.usageTotalModel.create({
        total: 0,
        lastUpdated: new Date(),
      });
    }
    return usageTotal.total + words <= this.WORD_LIMIT;
  }

  async logUsage(words: number) {
    await this.usageModel.create({ date: new Date(), words });
    // Update rolling total
    let usageTotal = await this.usageTotalModel.findOne();
    if (!usageTotal) {
      usageTotal = await this.usageTotalModel.create({
        total: 0,
        lastUpdated: new Date(),
      });
    }
    usageTotal.total += words;
    usageTotal.lastUpdated = new Date();
    await usageTotal.save();
  }

  async translateText(text: string, target: string): Promise<string> {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (!(await this.canTranslate(wordCount))) {
      throw new Error('Google Translate word limit exceeded for this period.');
    }
    const [translation] = await this.translate.translate(text, target);
    await this.logUsage(wordCount);
    return translation;
  }
}
