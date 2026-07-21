import { IsUUID, IsNumber, IsString } from 'class-validator';

export class AwardPointsDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  points: number;

  @IsString()
  reason: string;
}
