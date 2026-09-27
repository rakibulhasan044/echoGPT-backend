import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ example: 'What are the benefits of clean architecture in NestJS?' })
  @IsString()
  @IsNotEmpty()
  query!: string;
}

export class SearchSuggestionsDto {
  @ApiPropertyOptional({ example: 'NestJS clean' })
  @IsString()
  @IsOptional()
  q?: string;
}
