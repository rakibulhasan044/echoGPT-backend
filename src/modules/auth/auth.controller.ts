import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBadRequestResponse, ApiConflictResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  
  constructor(private readonly authService: AuthService) {}

  @Public() // Bypasses the JwtAuthGuard
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Registration successful. Please check your email for the verification code.')
  @ApiOperation({ 
    summary: 'Register a new user', 
    description: 'Creates a new user account, generates an OTP, and sends a verification email.' 
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'The user registration details'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered and OTP sent.',
    schema: {
      example: {
        success: true,
        message: 'Registration successful. Please check your email for the verification code.',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          fullName: 'John Doe',
          role: 'USER',
          isEmailVerified: false,
          isActive: true,
          createdAt: '2026-09-25T12:00:00.000Z',
          updatedAt: '2026-09-25T12:00:00.000Z'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    schema: {
      example: {
        message: 'Validation Error',
        errors: ['Password must be at least 8 characters long', 'Please provide a valid email address']
      }
    }
  })
  @ApiConflictResponse({
    description: 'User already exists.',
    schema: {
      example: {
        message: 'This email address is already registered.'
      }
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
