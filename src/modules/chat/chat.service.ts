import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, UnauthorizedException, MessageEvent } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SendMessageDto } from './dto/chat.dto.js';
import { ConfigService } from '@nestjs/config';
import { decrypt } from '../../common/utils/encryption.util.js';
import { Observable } from 'rxjs';
import axios from 'axios';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async streamChat(userId: string, dto: SendMessageDto): Promise<Observable<MessageEvent>> {
    // 1. Check Subscription limits
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new UnauthorizedException('You do not have an active subscription.');
    }

    if (subscription.requestsUsed >= subscription.requestLimit) {
      throw new BadRequestException('You have exceeded your request limit. Please upgrade your plan.');
    }

    // 2. Resolve Provider & Conversation
    let provider;
    let conversationId = dto.conversationId;

    if (conversationId) {
      // If continuing a chat, use the provider tied to that conversation
      const existingConv = await this.prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: { provider: true }
      });
      if (!existingConv || existingConv.userId !== userId) {
        throw new NotFoundException('Conversation not found');
      }
      provider = existingConv.provider;
    } else if (dto.providerId) {
      // If new chat with specific provider
      provider = await this.prisma.provider.findUnique({ where: { id: dto.providerId } });
    } else {
      // If new chat with no provider specified, use default
      provider = await this.prisma.provider.findFirst({ where: { isDefault: true } });
    }

    if (!provider || !provider.isActive) {
      throw new BadRequestException('Selected AI provider is not available.');
    }

    const secretKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!secretKey) throw new InternalServerErrorException('Server encryption key is missing.');
    
    let rawKey = '';
    try {
      rawKey = decrypt(provider.apiKey, secretKey);
    } catch {
      throw new InternalServerErrorException('Failed to decrypt API key.');
    }

    // 3. Setup Conversation & User Message
    if (!conversationId) {
      const newConv = await this.prisma.chatConversation.create({
        data: {
          userId,
          providerId: provider.id,
          title: dto.message.substring(0, 40) + '...',
        },
      });
      conversationId = newConv.id;
    }

    await this.prisma.chatMessage.create({
      data: {
        conversationId,
        providerId: provider.id,
        role: 'USER',
        content: dto.message,
      }
    });

    // We will just do a basic streaming implementation for OpenAI and Gemini
    return new Observable<MessageEvent>((subscriber) => {
      // 4. Emit the conversation ID instantly so the frontend can capture it
      subscriber.next({ data: JSON.stringify({ conversationId }) });

      const isGemini = provider!.name.toLowerCase().includes('gemini') || provider!.name.toLowerCase().includes('google');

      const streamHandler = isGemini 
        ? this.handleGeminiStream.bind(this)
        : this.handleOpenAiStream.bind(this);

      streamHandler(rawKey, provider!.baseUrl, dto.message, subscriber, async (fullResponse) => {
        // Complete Callback: Save response, log usage, increment limit
        try {
          await this.prisma.chatMessage.create({
            data: {
              conversationId: conversationId!,
              providerId: provider!.id,
              role: 'ASSISTANT',
              content: fullResponse,
            }
          });

          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: { requestsUsed: { increment: 1 } },
          });

          await this.prisma.apiUsageLog.create({
            data: {
              userId,
              providerId: provider!.id,
              endpoint: '/chat/stream',
              method: 'POST',
              statusCode: 200,
            }
          });
        } catch (e) {
          console.error('Failed to log AI response:', e);
        }
      });
    });
  }

  private async handleOpenAiStream(
    apiKey: string, 
    baseUrl: string | null,
    prompt: string, 
    subscriber: any, 
    onComplete: (fullText: string) => void
  ) {
    try {
      const endpoint = baseUrl ? `${baseUrl}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
      
      const response = await axios.post(
        endpoint,
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );

      let fullResponse = '';

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString('utf8').split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.includes('[DONE]')) {
            subscriber.next({ data: '[DONE]' });
            subscriber.complete();
            onComplete(fullResponse);
            return;
          }

          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            try {
              const data = JSON.parse(dataStr);
              const text = data.choices[0]?.delta?.content || '';
              fullResponse += text;
              if (text) {
                subscriber.next({ data: JSON.stringify({ text }) });
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      });

      response.data.on('error', (err: any) => {
        subscriber.error(err);
      });

    } catch (error: any) {
      let friendlyError = 'An unexpected error occurred with the AI provider.';
      
      if (error.response) {
        const status = error.response.status;
        if (status === 503) {
          friendlyError = 'OpenAI is currently overloaded (503 Service Unavailable). Please wait a moment and try again.';
        } else if (status === 404) {
          friendlyError = 'The requested AI model was not found. Please check your provider configuration.';
        } else if (status === 429) {
          friendlyError = 'You have exceeded your AI provider rate limit or quota. Please try again later.';
        } else if (status === 401) {
          friendlyError = 'Invalid OpenAI API key. Please verify your provider settings.';
        } else {
          friendlyError = `AI Provider Error: Received status code ${status}`;
        }
      }

      console.error('OpenAI Stream Error - Status:', error.response?.status, 'Message:', error.message);
      
      subscriber.next({ data: JSON.stringify({ error: friendlyError }) });
      subscriber.complete();
    }
  }

  private async handleGeminiStream(
    apiKey: string, 
    baseUrl: string | null,
    prompt: string, 
    subscriber: any, 
    onComplete: (fullText: string) => void
  ) {
    try {
      // e.g., baseUrl might be 'https://generativelanguage.googleapis.com/v1beta'
      const base = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
      
      // We strip any trailing slashes from base to be safe
      const cleanBase = base.replace(/\/$/, '');
      const endpoint = `${cleanBase}/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=${apiKey}`;

      const response = await axios.post(
        endpoint,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          responseType: 'stream',
        }
      );

      let fullResponse = '';

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString('utf8').split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') continue; // Gemini might not send this, but just in case
            try {
              const data = JSON.parse(dataStr);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              fullResponse += text;
              if (text) {
                subscriber.next({ data: JSON.stringify({ text }) });
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      });

      response.data.on('end', () => {
        subscriber.next({ data: '[DONE]' });
        subscriber.complete();
        onComplete(fullResponse);
      });

      response.data.on('error', (err: any) => {
        subscriber.error(err);
      });

    } catch (error: any) {
      let friendlyError = 'An unexpected error occurred with the AI provider.';
      
      if (error.response) {
        const status = error.response.status;
        if (status === 503) {
          friendlyError = 'Google AI Studio is currently overloaded (503 Service Unavailable). Please wait a moment and try again.';
        } else if (status === 404) {
          friendlyError = 'The requested AI model was not found. Please check your provider configuration.';
        } else if (status === 429) {
          friendlyError = 'You have exceeded your AI provider rate limit. Please try again later.';
        } else if (status === 400) {
          friendlyError = 'Invalid request or API key. Please verify your AI provider settings.';
        } else {
          friendlyError = `AI Provider Error: Received status code ${status}`;
        }
      }

      console.error('Gemini Stream Error - Status:', error.response?.status, 'Message:', error.message);
      
      subscriber.next({ data: JSON.stringify({ error: friendlyError }) });
      subscriber.complete();
    }
  }

  async getConversations(userId: string, query: any) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { 
      userId,
      // Only show conversations that have at least one reply from the AI
      messages: {
        some: { role: 'ASSISTANT' }
      }
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      this.prisma.chatConversation.count({ where }),
      this.prisma.chatConversation.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { updatedAt: 'desc' },
        include: {
          provider: {
            select: { name: true }
          }
        }
      })
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  async getConversationMessages(userId: string, conversationId: string) {
    const conv = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || conv.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
