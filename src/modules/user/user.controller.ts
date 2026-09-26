import { UserResponseDto } from '../auth/dto/auth-responses.dto.js';
import { ApiSuccessResponse } from '../../common/decorators/api-success-response.decorator.js';
import { Controller, Get, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { CurrentUser } from '../../common/decorators/auth.decorator.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import { AdminGuard } from '../../common/guards/admin.guard.js';

@ApiTags('User Management')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ResponseMessage('Profile retrieved successfully.')
  @ApiOperation({ summary: 'Get current user profile', description: 'Retrieves the profile of the currently authenticated user.' })
  @ApiSuccessResponse(UserResponseDto, 'Profile retrieved successfully.')

  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Patch('profile')
  @ResponseMessage('Profile updated successfully.')
  @ApiSuccessResponse(UserResponseDto, 'Profile updated successfully.')
  @ApiOperation({ summary: 'Update user profile', description: 'Updates the full name of the currently authenticated user.' })
  @ApiBody({ type: UpdateProfileDto })

  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, updateProfileDto);
  }

  @Patch('change-password')
  @ResponseMessage('Password changed successfully.')
  @ApiSuccessResponse(undefined, 'Password changed successfully.')
  @ApiOperation({ summary: 'Change password', description: 'Changes the password of the currently authenticated user.' })
  @ApiBody({ type: ChangePasswordDto })

  @ApiBadRequestResponse({ description: 'Incorrect current password or invalid new password.' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, changePasswordDto);
  }

  @Delete('account')
  @ResponseMessage('Account deleted successfully.')
  @ApiSuccessResponse(undefined, 'Account deleted successfully.')
  @ApiOperation({ summary: 'Delete account', description: 'Permanently deletes the currently authenticated user account and all active sessions.' })

  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.userService.deleteAccount(userId);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/role')
  @ResponseMessage('User role updated successfully.')
  @ApiSuccessResponse(UserResponseDto, 'User role updated successfully.')
  @ApiOperation({ summary: 'Update user role (Admin only)', description: 'Allows an administrator to change the role (e.g., USER to ADMIN) of another user.' })
  @ApiBody({ type: UpdateRoleDto })

  @ApiNotFoundResponse({ description: 'User not found.' })
  async updateUserRole(
    @Param('id') targetUserId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.userService.updateUserRole(targetUserId, updateRoleDto);
  }
}
