import { IsEnum, IsDate, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveType } from '../entities/leave.entity';

export class LeaveRequestDto {
  @IsEnum(['annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity', 'hajj'])
  type: LeaveType;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsString()
  @Length(1, 1000)
  reason: string;
}

export class ApproveLeaveDto {
  @IsString()
  approverId: string;
}

export class RejectLeaveDto {
  @IsString()
  approverId: string;

  @IsString()
  @Length(1, 500)
  reason: string;
}
