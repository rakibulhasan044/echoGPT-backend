import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator.js';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  @Public()
  @Version(VERSION_NEUTRAL)
  @Get()
  getRootHello(): string {
    return "Welcome to EchoGPT Backend!";
  }

  @Public()
  @Get()
  getApiHello(): string {
    return "EchoGPT API v1 is running perfectly!";
  }

}
