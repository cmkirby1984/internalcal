import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'securepassword123' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token received from login' })
  @IsString()
  refreshToken: string;
}

export class LoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    permissions: string[];
  };
}
