import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '../../common/guards/admin.guard.js';


import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto.js';
import { UpdateUserStatusDto } from './dto/user.dto.js';
import { UserQueryDto } from './dto/user-query.dto.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';

@ApiTags('Admin Panel')
@ApiBearerAuth()
@UseGuards(AdminGuard)

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('plans')
  @ResponseMessage('Plan created successfully')
  @ApiOperation({ summary: 'Create a new subscription plan' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.adminService.createPlan(dto);
  }

  @Patch('plans/:id')
  @ResponseMessage('Plan updated successfully')
  @ApiOperation({ summary: 'Update an existing subscription plan' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.adminService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @ResponseMessage('Plan disabled successfully')
  @ApiOperation({ summary: 'Disable a subscription plan (Soft Delete)' })
  async deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }

  @Get('plans')
  @ResponseMessage('All plans retrieved successfully')
  @ApiOperation({ summary: 'View all plans (including disabled ones)' })
  async getAllPlans() {
    return this.adminService.getAllPlans();
  }

  @Get('subscriptions')
  @ResponseMessage('All subscriptions retrieved successfully')
  @ApiOperation({ summary: 'View all user subscriptions' })
  async getAllSubscriptions() {
    return this.adminService.getAllSubscriptions();
  }

  @Get('users')
  @ResponseMessage('Users retrieved successfully')
  @ApiOperation({ summary: 'Get all registered users with pagination and filters' })
  async getAllUsers(@Query() query: UserQueryDto) {
    return this.adminService.getAllUsers(query);
  }

  @Patch('users/:id/status')
  @ResponseMessage('User status updated successfully')
  @ApiOperation({ summary: 'Restrict or unrestrict a user' })
  async updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto.isActive);
  }

}