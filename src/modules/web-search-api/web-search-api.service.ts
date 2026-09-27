import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SearchQueryDto } from './dto/web-search-api.dto.js';

@Injectable()
export class WebSearchApiService {
  constructor(private readonly prisma: PrismaService) {}

  async executeSearch(userId: string, dto: SearchQueryDto) {
    const { query } = dto;

    // 1. Check if the query is already cached
    const cachedResult = await this.prisma.searchQuery.findFirst({
      where: {
        query: { equals: query, mode: 'insensitive' },
        isCached: true,
      },
    });

    if (cachedResult) {
      // Return cached result (Bonus Requirement Fulfilled)
      
      // Still log it for this specific user's history, but without caching overhead
      await this.prisma.searchQuery.create({
        data: {
          userId,
          query,
          resultJson: cachedResult.resultJson as any,
          isCached: true,
        },
      });

      return {
        source: 'cache',
        results: cachedResult.resultJson,
      };
    }

    // 2. Perform the actual search (Mocked for the assignment)
    // In a real application, you would hit SerpAPI, Google Search, or an AI Provider here.
    const mockSearchResults = {
      summary: `AI generated summary for: ${query}`,
      links: [
        { title: `Result 1 for ${query}`, url: 'https://example.com/1' },
        { title: `Result 2 for ${query}`, url: 'https://example.com/2' },
        { title: `Result 3 for ${query}`, url: 'https://example.com/3' },
      ],
      timestamp: new Date().toISOString(),
    };

    // 3. Cache the new result in the database
    const savedQuery = await this.prisma.searchQuery.create({
      data: {
        userId,
        query,
        resultJson: mockSearchResults as any,
        isCached: true,
      },
    });

    return {
      source: 'live',
      results: mockSearchResults,
    };
  }

  async getSearchHistory(userId: string) {
    return this.prisma.searchQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        query: true,
        createdAt: true,
      }
    });
  }

  async getRecentSearches(userId: string) {
    // Similar to history, but maybe grouped or limited to the last 5
    const recent = await this.prisma.searchQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      distinct: ['query'],
      select: {
        query: true,
        createdAt: true,
      }
    });
    return recent;
  }

  async getSuggestions(query: string = '') {
    // 1. If query is provided, find similar past searches
    if (query.trim().length > 0) {
      const dbSuggestions = await this.prisma.searchQuery.findMany({
        where: {
          query: { contains: query, mode: 'insensitive' }
        },
        distinct: ['query'],
        take: 5,
        select: { query: true }
      });
      
      return dbSuggestions.map(s => s.query);
    }

    // 2. If no query, return some generic trending suggestions
    return [
      'What is NestJS?',
      'Clean Architecture examples',
      'PostgreSQL optimization tips',
      'AI Provider integration',
      'How to build an AI wrapper?'
    ];
  }
}
