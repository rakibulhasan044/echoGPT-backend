import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBadRequestResponse, ApiConflictResponse, ApiOkResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  
  @Public() // Bypasses the JwtAuthGuard
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new user', 
    description: 'Creates a new user account and returns an initial set of authentication tokens.' 
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'The user registration details'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered.',
    schema: {
      example: {
        message: 'Registration successful',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'a1b2c3d4e5f6g7h8i9j0...'
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
    // Implementation would go here, usually calling authService.register(registerDto)
    return {
      message: 'Registration successful',
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    };
  }
}
