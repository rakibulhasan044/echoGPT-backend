import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProviderService } from './provider.service.js';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto.js';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';

@ApiTags('AI Providers (Admin)')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  @ResponseMessage('AI Provider created successfully')
  @ApiOperation({ summary: 'Add a new AI provider (stores API key securely)' })
  async createProvider(@Body() dto: CreateProviderDto) {
    return this.providerService.createProvider(dto);
  }

  @Patch(':id')
  @ResponseMessage('AI Provider updated successfully')
  @ApiOperation({ summary: 'Update an AI provider (e.g., rotate API key or disable)' })
  async updateProvider(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.providerService.updateProvider(id, dto);
  }

  @Get()
  @ResponseMessage('AI Providers retrieved successfully')
  @ApiOperation({ summary: 'List all AI providers (API keys are hidden)' })
  async getAllProviders() {
    return this.providerService.getAllProviders();
  }

  @Delete(':id')
  @ResponseMessage('AI Provider deleted successfully')
  @ApiOperation({ summary: 'Delete an AI provider' })
  async deleteProvider(@Param('id') id: string) {
    return this.providerService.deleteProvider(id);
  }

  @Get(':id/health')
  @ResponseMessage('Provider health checked')
  @ApiOperation({ summary: 'Test if the API key for a provider is working' })
  async healthCheck(@Param('id') id: string) {
    return this.providerService.healthCheck(id);
  }
}
