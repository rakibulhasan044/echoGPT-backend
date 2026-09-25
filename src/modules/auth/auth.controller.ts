import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBadRequestResponse, ApiConflictResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
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
          email: 'user@gmail.com',
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

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Email verified successfully. You are now logged in.')
  @ApiOperation({ 
    summary: 'Verify user email', 
    description: 'Verifies the email using the OTP code sent during registration, and issues authentication tokens.' 
  })
  @ApiBody({ 
    type: VerifyEmailDto,
    description: 'The email and the 6-digit verification code'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email successfully verified.',
    schema: {
      example: {
        success: true,
        message: 'Email verified successfully. You are now logged in.',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'a1b2c3d4e5f6g7h8i9j0...'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid code or expired.',
    schema: {
      example: {
        message: 'Invalid verification code.'
      }
    }
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successful.')
  @ApiOperation({ 
    summary: 'Login to an account', 
    description: 'Authenticates a user and returns access and refresh tokens.' 
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'The user email and password'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in.',
    schema: {
      example: {
        success: true,
        message: 'Login successful.',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'a1b2c3d4e5f6g7h8i9j0...'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account.',
    schema: {
      example: {
        message: 'Invalid email or password.'
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('resend-verification-otp')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('If that email is registered and unverified, a new verification code has been sent.')
  @ApiOperation({ 
    summary: 'Resend verification OTP', 
    description: 'Generates and sends a new 6-digit OTP to the users email if the account exists and is not yet verified.' 
  })
  @ApiBody({ 
    type: ResendOtpDto,
    description: 'The user email'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP resend requested.',
    schema: {
      example: {
        success: true,
        message: 'If that email is registered and unverified, a new verification code has been sent.',
        data: null
      }
    }
  })
  async resendVerificationOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendVerificationOtp(resendOtpDto);
  }
}
