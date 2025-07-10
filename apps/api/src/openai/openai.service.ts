import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateUsername(profile: { name: string; email: string }) {
    const prompt = `Suggest a unique, short, cook chef and friendly and funny username for this Google profile: Name: ${profile.name} Email: ${profile.email}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
    });

    const suggestion = completion.choices[0].message.content.trim();
    return suggestion;
  }
}
