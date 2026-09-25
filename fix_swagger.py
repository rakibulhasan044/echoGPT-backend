import re

# 1. Update auth.controller.ts
with open('src/modules/auth/auth.controller.ts', 'r') as f:
    auth = f.read()

auth = "import { ApiSuccessResponse } from '../../common/decorators/api-success-response.decorator.js';\n" + auth
auth = "import { UserResponseDto } from './dto/auth-responses.dto.js';\n" + auth

# Replace huge @ApiResponse blocks
auth = re.sub(r"@ApiResponse\(\{[\s\S]*?schema:\s*\{[\s\S]*?\}[\s\S]*?\}\)", "", auth)

# We will just replace them line by line manually or using simple regex
auth = re.sub(r"@ApiResponse\(\{.*?status: HttpStatus\.OK.*?\}\)", "", auth)
auth = re.sub(r"@ApiResponse\(\{.*?status: HttpStatus\.CREATED.*?\}\)", "", auth)

auth = auth.replace(
    "@ResponseMessage('Registration successful. Please check your email for the verification code.')",
    "@ResponseMessage('Registration successful. Please check your email for the verification code.')\n  @ApiSuccessResponse(UserResponseDto, 'Registration successful. Please check your email for the verification code.')"
)
auth = auth.replace(
    "@ResponseMessage('Email verified successfully. You are now logged in.')",
    "@ResponseMessage('Email verified successfully. You are now logged in.')\n  @ApiSuccessResponse(undefined, 'Email verified successfully. You are now logged in.')"
)
auth = auth.replace(
    "@ResponseMessage('Login successful.')",
    "@ResponseMessage('Login successful.')\n  @ApiSuccessResponse(undefined, 'Login successful.')"
)
auth = auth.replace(
    "@ResponseMessage('If that email is registered and unverified, a new verification code has been sent.')",
    "@ResponseMessage('If that email is registered and unverified, a new verification code has been sent.')\n  @ApiSuccessResponse(undefined, 'If that email is registered and unverified, a new verification code has been sent.')"
)
auth = auth.replace(
    "@ResponseMessage('You have been logged out from this session successfully.')",
    "@ResponseMessage('You have been logged out from this session successfully.')\n  @ApiSuccessResponse(undefined, 'You have been logged out from this session successfully.')"
)
auth = auth.replace(
    "@ResponseMessage('You have been logged out from all devices successfully. Any device will need to login again before using the account.')",
    "@ResponseMessage('You have been logged out from all devices successfully. Any device will need to login again before using the account.')\n  @ApiSuccessResponse(undefined, 'You have been logged out from all devices successfully. Any device will need to login again before using the account.')"
)
auth = auth.replace(
    "@ResponseMessage('Session refreshed successfully.')",
    "@ResponseMessage('Session refreshed successfully.')\n  @ApiSuccessResponse(undefined, 'Session refreshed successfully.')"
)

# Remove empty lines left behind by regex
auth = re.sub(r'\n\s*\n', '\n\n', auth)

with open('src/modules/auth/auth.controller.ts', 'w') as f:
    f.write(auth)

# 2. Update user.controller.ts
with open('src/modules/user/user.controller.ts', 'r') as f:
    user = f.read()

user = "import { ApiSuccessResponse } from '../../common/decorators/api-success-response.decorator.js';\n" + user
user = "import { UserResponseDto } from '../auth/dto/auth-responses.dto.js';\n" + user

user = re.sub(r"@ApiResponse\(\{.*?status: HttpStatus\.OK.*?\}\)", "", user)

user = user.replace(
    "@ApiOperation({ summary: 'Get current user profile', description: 'Retrieves the profile of the currently authenticated user.' })",
    "@ApiOperation({ summary: 'Get current user profile', description: 'Retrieves the profile of the currently authenticated user.' })\n  @ApiSuccessResponse(UserResponseDto, 'Operation successful')"
)
user = user.replace(
    "@ResponseMessage('Profile updated successfully.')",
    "@ResponseMessage('Profile updated successfully.')\n  @ApiSuccessResponse(UserResponseDto, 'Profile updated successfully.')"
)
user = user.replace(
    "@ResponseMessage('Password changed successfully.')",
    "@ResponseMessage('Password changed successfully.')\n  @ApiSuccessResponse(undefined, 'Password changed successfully.')"
)
user = user.replace(
    "@ResponseMessage('Account deleted successfully.')",
    "@ResponseMessage('Account deleted successfully.')\n  @ApiSuccessResponse(undefined, 'Account deleted successfully.')"
)
user = user.replace(
    "@ResponseMessage('User role updated successfully.')",
    "@ResponseMessage('User role updated successfully.')\n  @ApiSuccessResponse(UserResponseDto, 'User role updated successfully.')"
)

user = re.sub(r'\n\s*\n', '\n\n', user)

with open('src/modules/user/user.controller.ts', 'w') as f:
    f.write(user)

