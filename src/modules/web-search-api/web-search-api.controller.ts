import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebSearchApiService } from './web-search-api.service.js';
import { SearchQueryDto, SearchSuggestionsDto } from './dto/web-search-api.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Request } from 'express';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Web Search API')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class WebSearchApiController {
  constructor(private readonly webSearchApiService: WebSearchApiService) {}

  @Post('query')
  @ResponseMessage('Search completed successfully')
  @ApiOperation({ summary: 'Execute an AI-assisted web search (supports caching)' })
  async executeSearch(@Req() req: RequestWithUser, @Body() dto: SearchQueryDto) {
    return this.webSearchApiService.executeSearch(req.user.id, dto);
  }

  @Get('history')
  @ResponseMessage('Search history retrieved successfully')
  @ApiOperation({ summary: 'Get the full search history for the logged in user' })
  async getSearchHistory(@Req() req: RequestWithUser) {
    return this.webSearchApiService.getSearchHistory(req.user.id);
  }

  @Get('recent')
  @ResponseMessage('Recent searches retrieved successfully')
  @ApiOperation({ summary: 'Get the 5 most recent unique searches' })
  async getRecentSearches(@Req() req: RequestWithUser) {
    return this.webSearchApiService.getRecentSearches(req.user.id);
  }

  @Get('suggestions')
  @ResponseMessage('Search suggestions retrieved successfully')
  @ApiOperation({ summary: 'Get autocomplete suggestions based on query or trends' })
  async getSuggestions(@Query() queryDto: SearchSuggestionsDto) {
    return this.webSearchApiService.getSuggestions(queryDto.q);
  }
}
