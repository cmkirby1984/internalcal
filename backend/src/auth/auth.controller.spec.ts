import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    refreshToken: jest.fn(),
    getProfile: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'ADMIN',
    permissions: ['*'],
  };

  const mockLoginResponse = {
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return token and user on successful login', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const loginDto: LoginDto = {
        username: 'inactiveuser',
        password: 'password123',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Account is inactive'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      };

      const newTokens = {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(newTokens);

      const result = await controller.refresh(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
      expect(result).toEqual(newTokens);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalid-refresh-token',
      };

      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token'),
      );

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'expired-refresh-token',
      };

      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token'),
      );

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should return success message', () => {
      const result = controller.logout();

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockAuthService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile('user-123');

      expect(authService.getProfile).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getMe', () => {
    it('should return current user from request', () => {
      const result = controller.getMe(mockUser);

      expect(result).toEqual(mockUser);
    });
  });
});
