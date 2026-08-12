import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty({
    description: 'Short-lived JWT from login when 2FA is required',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  challengeToken: string;

  @ApiProperty({
    description: '6-digit TOTP code or backup code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(32)
  code: string;
}
