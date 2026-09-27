import { Controller, Post, Get, Body, Param, UseGuards, Req, Res, MessageEvent, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/chat.dto.js';
import { ConversationQueryDto } from './dto/conversation-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Observable } from 'rxjs';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Chat API')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  @ApiOperation({ summary: 'Send a prompt and receive a streaming response via SSE' })
  async streamChat(
    @Req() req: RequestWithUser,
    @Body() dto: SendMessageDto,
    @Res() res: any
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream$ = await this.chatService.streamChat(req.user.id, dto);

    stream$.subscribe({
      next: (event: MessageEvent) => {
        res.write(`data: ${event.data}\n\n`);
      },
      error: (err: any) => {
        res.write(`data: {"error": "${err.message}"}\n\n`);
        res.end();
      },
      complete: () => {
        res.end();
      }
    });
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for the logged in user with pagination and search' })
  getConversations(@Req() req: RequestWithUser, @Query() query: ConversationQueryDto) {
    return this.chatService.getConversations(req.user.id, query);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get all messages for a specific conversation' })
  getConversationMessages(@Req() req: RequestWithUser, @Param('id') conversationId: string) {
    return this.chatService.getConversationMessages(req.user.id, conversationId);
  }
}
