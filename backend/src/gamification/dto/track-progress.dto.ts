import { IsUUID, IsString, IsNumber, IsOptional } from 'class-validator';

export class TrackProgressDto {
  @IsUUID()
  userId: string;

  @IsString()
  action: string;

  @IsNumber()
  @IsOptional()
  value?: number = 1;
}
