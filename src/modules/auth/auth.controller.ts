import { UserResponseDto } from './dto/auth-responses.dto.js';
import { ApiSuccessResponse } from '../../common/decorators/api-success-response.decorator.js';
import { Body, Controller, Post, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBadRequestResponse, ApiConflictResponse, ApiUnauthorizedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/auth.decorator.js';
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
  @ApiSuccessResponse(UserResponseDto, 'Registration successful. Please check your email for the verification code.')
  @ApiOperation({ 
    summary: 'Register a new user', 
    description: 'Creates a new user account, generates an OTP, and sends a verification email.' 
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'The user registration details'
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
  @ApiSuccessResponse(undefined, 'Email verified successfully. You are now logged in.')
  @ApiOperation({ 
    summary: 'Verify user email', 
    description: 'Verifies the email using the OTP code sent during registration, and issues authentication tokens.' 
  })
  @ApiBody({ 
    type: VerifyEmailDto,
    description: 'The email and the 6-digit verification code'
  })

  @ApiBadRequestResponse({
    description: 'Invalid code or expired.',
    schema: {
      example: {
        message: 'Invalid verification code.'
      }
    }
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.verifyEmail(verifyEmailDto);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return null;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successful.')
  @ApiSuccessResponse(undefined, 'Login successful.')
  @ApiOperation({ 
    summary: 'Login to an account (user must verify email address before login)', 
    description: 'Authenticates a user and returns access and refresh tokens.' 
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'The user email and password'
  })

  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account.',
    schema: {
      example: {
        message: 'Invalid email or password.'
      }
    }
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.login(loginDto);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return null;
  }

  @Public()
  @Post('resend-verification-otp')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('If that email is registered and unverified, a new verification code has been sent.')
  @ApiSuccessResponse(undefined, 'If that email is registered and unverified, a new verification code has been sent.')
  @ApiOperation({ 
    summary: 'Resend verification OTP', 
    description: 'Generates and sends a new 6-digit OTP to the users email if the account exists and is not yet verified.' 
  })
  @ApiBody({ 
    type: ResendOtpDto,
    description: 'The user email'
  })

  async resendVerificationOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendVerificationOtp(resendOtpDto);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('You have been logged out from this session successfully.')
  @ApiSuccessResponse(undefined, 'You have been logged out from this session successfully.')
  @ApiOperation({ 
    summary: 'Logout of the current session', 
    description: 'Revokes the current session and clears cookies.' 
  })

  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('id') userId: string
  ) {
    const refreshToken = req.cookies?.refreshToken;

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    if (refreshToken) {
      await this.authService.logout({ refreshToken }, userId);
    }

    return null;
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('You have been logged out from all devices successfully. Any device will need to login again before using the account.')
  @ApiSuccessResponse(undefined, 'You have been logged out from all devices successfully. Any device will need to login again before using the account.')
  @ApiOperation({ 
    summary: 'Logout of all sessions', 
    description: 'Revokes all active refresh tokens for the user and clears cookies.' 
  })

  async logoutAll(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser('id') userId: string
  ) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return this.authService.logoutAll(userId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Session refreshed successfully.')
  @ApiSuccessResponse(undefined, 'Session refreshed successfully.')
  @ApiOperation({ 
    summary: 'Refresh session', 
    description: 'Uses the HTTP-only refresh token cookie to get a new access token and rotate the refresh token.' 
  })

  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token.' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    // If the frontend also sends it in the body, they can fall back to that, but cookies are preferred
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const tokens = await this.authService.refreshSession(refreshToken);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return null;
  }
}
