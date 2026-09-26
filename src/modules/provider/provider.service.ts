import { Injectable, ConflictException, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto.js';
import { encrypt, decrypt } from '../../common/utils/encryption.util.js';
import axios from 'axios';

@Injectable()
export class ProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createProvider(dto: CreateProviderDto) {
    const existing = await this.prisma.provider.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`A provider named ${dto.name} already exists.`);
    }

    const secretKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!secretKey || secretKey.length !== 32) {
      throw new InternalServerErrorException('Server encryption key is missing or invalid.');
    }

    const encryptedKey = encrypt(dto.apiKey, secretKey);

    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.provider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const provider = await this.prisma.provider.create({
      data: {
        ...dto,
        apiKey: encryptedKey,
      }
    });

    const { apiKey, ...safeProvider } = provider;
    return safeProvider;
  }

  async updateProvider(id: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const secretKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!secretKey || secretKey.length !== 32) {
      throw new InternalServerErrorException('Server encryption key is missing or invalid.');
    }

    const dataToUpdate: any = { ...dto };

    if (dto.apiKey) {
      dataToUpdate.apiKey = encrypt(dto.apiKey, secretKey);
    }

    if (dto.isDefault) {
      await this.prisma.provider.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.provider.update({
      where: { id },
      data: dataToUpdate
    });

    const { apiKey, ...safeProvider } = updated;
    return safeProvider;
  }

  async getAllProviders() {
    const providers = await this.prisma.provider.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return providers.map(p => {
      const { apiKey, ...safeProvider } = p;
      return safeProvider;
    });
  }

  async deleteProvider(id: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    await this.prisma.provider.delete({ where: { id } });
    return { success: true, message: 'Provider deleted successfully' };
  }

  async healthCheck(id: string) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const secretKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!secretKey || secretKey.length !== 32) {
      throw new InternalServerErrorException('Server encryption key is missing or invalid.');
    }

    let rawKey;
    try {
      rawKey = decrypt(provider.apiKey, secretKey);
    } catch {
      return { status: 'unhealthy', reason: 'Failed to decrypt API key.' };
    }

    // Attempt a lightweight test call based on the provider name
    try {
      if (provider.name.toLowerCase().includes('openai')) {
        const res = await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${rawKey}` },
          timeout: 5000,
        });
        if (res.status === 200) return { status: 'healthy', provider: provider.name };
      } else if (provider.name.toLowerCase().includes('gemini') || provider.name.toLowerCase().includes('google')) {
        // Just checking if key exists, real health check for gemini requires a valid endpoint
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${rawKey}`, {
          timeout: 5000,
        });
        if (res.status === 200) return { status: 'healthy', provider: provider.name };
      }
      return { status: 'unknown', reason: 'Provider is not officially supported for deep health checks.' };
    } catch (error: any) {
      return { status: 'unhealthy', reason: error.response?.data || error.message };
    }
  }
}
