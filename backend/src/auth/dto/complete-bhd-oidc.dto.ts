import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class CompleteBhdOidcDto {
  @ApiPropertyOptional({ description: 'Authorization code from BHD Identity' })
  @ValidateIf((dto: CompleteBhdOidcDto) => !dto.idToken)
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  code?: string;

  @ApiPropertyOptional({ example: 'https://bhdstor.bhd-om.com/api/auth/bhd/callback' })
  @ValidateIf((dto: CompleteBhdOidcDto) => !dto.idToken)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  redirectUri?: string;

  @ApiPropertyOptional({ description: 'PKCE S256 verifier' })
  @ValidateIf((dto: CompleteBhdOidcDto) => !dto.idToken)
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  codeVerifier?: string;

  @ApiProperty({ description: 'OIDC nonce from the start cookie' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  nonce: string;

  @ApiPropertyOptional({ description: 'Already-exchanged id_token from the store callback' })
  @IsOptional()
  @IsString()
  @MaxLength(8192)
  idToken?: string;

  @ApiPropertyOptional({ description: 'Already-exchanged access_token for userinfo' })
  @IsOptional()
  @IsString()
  @MaxLength(8192)
  accessToken?: string;
}
