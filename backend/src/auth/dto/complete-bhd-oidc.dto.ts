import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CompleteBhdOidcDto {
  @ApiProperty({ description: 'Authorization code from BHD Identity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  code: string;

  @ApiProperty({ example: 'http://localhost:3000/api/auth/bhd/callback' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  redirectUri: string;

  @ApiProperty({ description: 'PKCE S256 verifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  codeVerifier: string;

  @ApiProperty({ description: 'OIDC nonce from the start cookie' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  nonce: string;
}
