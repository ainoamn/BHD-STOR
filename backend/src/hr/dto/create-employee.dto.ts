import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDecimal,
  IsDate,
  IsObject,
  IsInt,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Department, EmploymentType } from '../entities/employee.entity';

export class CreateEmployeeDto {
  @IsUUID()
  userId: string;

  @IsString()
  @Length(1, 50)
  employeeNumber: string;

  @IsEnum([
    'operations',
    'logistics',
    'it',
    'finance',
    'marketing',
    'hr',
    'customer_service',
    'management',
  ])
  department: Department;

  @IsString()
  @Length(1, 255)
  position: string;

  @IsEnum(['full_time', 'part_time', 'contract', 'intern'])
  employmentType: EmploymentType;

  @IsDate()
  @Type(() => Date)
  joinDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  probationEndDate?: Date;

  @IsDecimal({ decimal_digits: '3' })
  @Min(0)
  salary: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsObject()
  bankAccount?: {
    bank: string;
    accountNumber: string;
    iban: string;
  };

  @IsOptional()
  @IsObject()
  workSchedule?: {
    days: string[];
    startTime: string;
    endTime: string;
  };

  @IsOptional()
  @IsInt()
  annualLeaveBalance?: number;

  @IsOptional()
  @IsInt()
  sickLeaveBalance?: number;

  @IsOptional()
  @IsUUID()
  managerId?: string;
}
