import { Module } from '@nestjs/common';
import { WebSearchApiController } from './web-search-api.controller.js';
import { WebSearchApiService } from './web-search-api.service.js';

@Module({
  controllers: [WebSearchApiController],
  providers: [WebSearchApiService]
})
export class WebSearchApiModule {}
