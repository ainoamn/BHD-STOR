import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TrackingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lang?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeTimeline?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeDriver?: boolean;
}
